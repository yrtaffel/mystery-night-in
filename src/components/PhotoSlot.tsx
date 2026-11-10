"use client";

import { useRef, useState } from "react";

type Props = {
  cardNumber: number;
  locked: boolean; // photos open up after the card is scratched
  url?: string;
  onUpload: (file: File) => Promise<boolean>;
  onRemove: () => Promise<void>;
};

const Tape = ({ className = "" }: { className?: string }) => (
  <span aria-hidden="true" className={`block rounded-[2px] bg-[var(--tape)] shadow-sm ${className}`} />
);

export default function PhotoSlot({ cardNumber, locked, url, onUpload, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMenu(false);
    await onUpload(file);
    setBusy(false);
  }

  const input = (
    <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={pick}
      aria-label={`Add a photo for card ${cardNumber}`} tabIndex={-1} />
  );

  // A photo is taped in.
  if (url) {
    return (
      <div className="flex flex-col items-center gap-2">
        {input}
        <button type="button" onClick={() => setMenu((m) => !m)}
          className="relative mt-3 rotate-2 bg-white p-1.5 pb-4 shadow-md"
          aria-label={`Photo for card ${cardNumber}. Tap for options.`}>
          <Tape className="absolute -top-3 left-1/2 h-6 w-14 -translate-x-1/2 -rotate-6" />
          {/* eslint-disable-next-line @next/next/no-img-element -- private, signed photo URL */}
          <img src={url} alt="" className="max-h-44 w-full object-cover" />
        </button>
        {busy && <p className="text-xs text-ink-soft">Uploading…</p>}
        {menu && !busy && (
          <div className="flex gap-3 text-xs">
            <button type="button" className="underline" onClick={() => inputRef.current?.click()}>
              Change
            </button>
            <button type="button" className="text-red-800 underline"
              onClick={async () => { setMenu(false); await onRemove(); }}>
              Remove
            </button>
          </div>
        )}
      </div>
    );
  }

  // Empty "Photo [tape] Here" slot.
  const look = (
    <span className="flex h-full min-h-40 items-center justify-center gap-1 text-[11px] text-ink-soft min-[380px]:gap-1.5 min-[380px]:text-sm">
      <span>{busy ? "Uploading" : "Photo"}</span>
      <Tape className="h-32 w-7 shrink-0 -rotate-2 min-[380px]:h-36 min-[380px]:w-10 sm:h-44 sm:w-12" />
      <span>{busy ? "…" : "Here"}</span>
    </span>
  );

  if (locked) return <div title="Scratch the card first!">{look}</div>;

  return (
    <>
      {input}
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
        className="block w-full" aria-label={`Add a photo for card ${cardNumber}`}>
        {look}
      </button>
    </>
  );
}
