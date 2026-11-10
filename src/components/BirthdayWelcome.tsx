"use client";

import { useEffect, useRef } from "react";
import { cards } from "@/lib/cards";

const SEEN_KEY = "birthday-welcome-seen";
const COLORS = ["#c4b0ec", "#7e5fc4", "#f4b6c9", "#f7d774", "#9ed9c8"];

// Fixed "random" confetti so the server and browser draw the same thing.
const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 30) / 10,
  duration: 3.5 + ((i * 17) % 20) / 10,
  color: COLORS[i % COLORS.length],
  size: 6 + ((i * 7) % 6),
  round: i % 3 === 0,
}));

/** Opens automatically the first time; `open` lets other pages show it again. */
export default function BirthdayWelcome({ auto = true, openSignal = 0 }: { auto?: boolean; openSignal?: number }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!auto) return;
    let seen = false;
    try {
      seen = !!localStorage.getItem(SEEN_KEY);
    } catch {
      // ignore
    }
    if (!seen) ref.current?.showModal();
  }, [auto]);

  useEffect(() => {
    if (openSignal) ref.current?.showModal();
  }, [openSignal]);

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
    ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      onCancel={close}
      aria-labelledby="bday-title"
      className="m-auto w-[min(92vw,26rem)] overflow-hidden rounded-3xl bg-paper p-0 text-ink shadow-2xl"
    >
      <div className="relative px-6 pt-12 pb-8 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="confetti absolute top-[-12px] block"
              style={{
                left: `${c.left}%`,
                width: c.size,
                height: c.round ? c.size : c.size * 1.6,
                background: c.color,
                borderRadius: c.round ? "999px" : "2px",
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
              }}
            />
          ))}
        </div>

        <p className="relative text-5xl" aria-hidden="true">🎂</p>
        <h2 id="bday-title" className="relative mt-3 font-script text-[clamp(2.2rem,10vw,2.8rem)] leading-none whitespace-nowrap">
          <span className="swoosh">Happy Birthday,</span>
        </h2>
        <p className="relative mt-1 font-title text-5xl font-semibold tracking-wide uppercase">Atara!</p>
        <p className="relative mt-5">
          Inside are {cards.length} little adventures, made with love. Some are for you plus someone
          else (it doesn&apos;t have to be me, but I will gladly join you for any of these little
          adventures), and some are just for you.
        </p>
        <p className="relative mt-4">
          Love you! 💜,
          <br />
          <span className="font-script text-3xl">Yehudit</span>
        </p>
        <p className="relative mt-3 font-script text-[clamp(1.45rem,7.5vw,1.875rem)]">Unknown adventure awaits!</p>
        <button
          type="button"
          onClick={close}
          className="relative mt-6 w-full rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white"
        >
          Let&apos;s begin 🚂
        </button>
      </div>
    </dialog>
  );
}
