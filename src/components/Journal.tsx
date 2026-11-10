"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  cardNumber: number;
  locked: boolean;
  initial: string;
  onSave: (text: string) => Promise<boolean>;
};

const MIN_HEIGHT_REM = 7.6; // 4 lines

/** Lined journal. Saves on its own a moment after she stops typing. */
export default function Journal({ cardNumber, locked, initial, onSave }: Props) {
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState<"" | "saving" | "saved">("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const lastSaved = useRef(initial);
  const pending = useRef<string | null>(null);
  // Keep the latest save function without restarting the timers below.
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  // Grow with the text, one line at a time.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px"; // minHeight keeps at least 4 lines
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  // Save 1 second after typing stops.
  useEffect(() => {
    if (text === lastSaved.current) return;
    pending.current = text;
    const t = window.setTimeout(async () => {
      setStatus("saving");
      const ok = await saveRef.current(text);
      if (ok) {
        lastSaved.current = text;
        pending.current = null;
        setStatus("saved");
      } else {
        setStatus("");
      }
    }, 1000);
    return () => window.clearTimeout(t);
  }, [text]);

  // If she leaves the page mid-typing, save what's there.
  useEffect(() => {
    return () => {
      if (pending.current !== null) void saveRef.current(pending.current);
    };
  }, []);

  if (locked) {
    return <div className="journal-lines mt-3 h-[7.6rem]" aria-hidden="true" />;
  }

  return (
    <div className="mt-3">
      <label htmlFor={`journal-${cardNumber}`} className="sr-only">
        Journal for card {cardNumber}
      </label>
      <textarea
        id={`journal-${cardNumber}`}
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a few lines about it…"
        className="journal-lines block w-full resize-none overflow-hidden bg-transparent text-[15px] leading-[1.9rem] outline-none placeholder:text-ink-soft/60"
        style={{ minHeight: `${MIN_HEIGHT_REM}rem` }}
      />
      <p className="h-4 text-right text-[11px] text-ink-soft" aria-live="polite">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : ""}
      </p>
    </div>
  );
}
