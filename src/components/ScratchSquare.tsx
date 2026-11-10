"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Card } from "@/lib/cards";

// Original ragged "brushstroke" shape that sits behind the revealed text.
const BRUSH =
  "M3.0 3.9 L6.1 6.2 L8.5 6.0 L10.1 3.4 L11.9 8.0 L13.7 6.8 L17.5 5.4 L21.5 8.2 L23.7 3.7 L26.0 0.5 L28.9 5.2 L31.8 3.4 L33.8 5.6 L36.1 5.7 L38.3 2.1 L40.5 6.2 L44.1 0.9 L48.1 5.5 L51.5 5.9 L53.1 7.6 L56.0 0.9 L59.3 6.5 L61.9 2.8 L64.6 3.4 L67.8 9.0 L71.4 5.3 L74.6 5.8 L76.5 3.4 L79.9 4.5 L82.4 0.2 L85.0 8.3 L88.6 0.8 L91.1 8.3 L95.0 4.1 L96.1 8.0 L97.7 14.4 L95.0 19.7 L96.7 25.8 L99.3 32.7 L97.3 40.1 L98.0 47.2 L99.0 51.5 L98.9 59.4 L96.8 67.4 L95.5 73.4 L95.3 80.5 L95.9 84.9 L96.5 89.7 L97.0 91.9 L95.2 91.2 L91.6 91.9 L89.4 93.2 L87.6 100.0 L85.0 91.5 L83.2 92.6 L79.6 91.1 L75.8 91.9 L72.9 94.2 L68.9 99.1 L66.8 92.0 L63.4 95.7 L61.0 95.9 L57.1 99.4 L53.5 97.7 L50.7 91.2 L49.2 92.6 L45.9 98.3 L42.1 99.9 L39.7 92.4 L37.7 94.7 L33.9 98.4 L30.8 97.3 L27.7 99.3 L24.3 92.1 L20.8 95.8 L16.9 93.4 L13.0 97.5 L11.2 96.4 L7.7 96.0 L3.7 93.1 L1.1 92.0 L4.9 87.9 L2.9 80.7 L2.5 72.0 L4.2 63.7 L1.6 58.6 L1.6 53.1 L1.7 46.2 L1.1 40.1 L2.1 31.6 L3.1 25.3 L2.4 16.7 L2.8 8.2 Z";

const REVEAL_AT = 0.5; // auto-reveal once half the square is scratched

/** Shrinks the text until it fits inside the brushstroke (no cut-off words). */
function useFitText(ref: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = 15;
      el.style.fontSize = `${size}px`;
      while (el.scrollHeight > el.clientHeight + 1 && size > 8) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
}

/** What's hidden under the gray: white text on a black brushstroke. */
function Revealed({ card }: { card: Card }) {
  const textRef = useRef<HTMLDivElement>(null);
  useFitText(textRef);
  return (
    <div className="absolute inset-0 bg-scratch">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"
        className="absolute inset-[4%] h-[92%] w-[92%] fill-[#141216]">
        <path d={BRUSH} />
      </svg>
      <div ref={textRef} className="absolute inset-[10%] overflow-hidden leading-[1.4] text-white">
        <p>{card.instructions}</p>
        {card.link && (
          <a href={card.link} target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-block font-semibold text-lavender underline">
            Open link ↗
          </a>
        )}
        {card.feature === "riddle-trail" && (
          <Link href="/trail" className="mt-1.5 inline-block font-semibold text-lavender underline">
            Start the Riddle Trail →
          </Link>
        )}
      </div>
    </div>
  );
}

/** Paints the gray, slightly textured scratch-off coating. */
function paintCoating(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22; // grain
    img.data[i] = 160 + n;
    img.data[i + 1] = 163 + n;
    img.data[i + 2] = 170 + n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // faint vertical streaks, like real scratch foil
  for (let s = 0; s < 40; s++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * w, 0, Math.random() * 3 * dpr, h);
  }
}

type Props = {
  card: Card;
  revealed: boolean;
  onReveal: () => void;
};

export default function ScratchSquare({ card, revealed, onReveal }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const moves = useRef(0);
  const [painted, setPainted] = useState(false);
  const [armed, setArmed] = useState(false); // true after she confirms in the warning
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (revealed || !canvasRef.current) return;
    paintCoating(canvasRef.current);
    setPainted(true);
  }, [revealed]);

  const finish = useCallback(() => {
    if (fading) return;
    setFading(true);
    window.setTimeout(onReveal, 450);
  }, [fading, onReveal]);

  const checkProgress = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 16) {
      total++;
      if (data[i] < 128) clear++;
    }
    if (clear / total >= REVEAL_AT) finish();
  }, [finish]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function scratchTo(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const p = point(e);
    const from = last.current ?? p;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = canvas.width * 0.13;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    last.current = p;
    if (++moves.current % 12 === 0) checkProgress();
  }

  if (revealed) {
    return (
      <div className="relative aspect-square w-full">
        <Revealed card={card} />
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full select-none">
      <div className={painted ? "" : "invisible"}>
        <Revealed card={card} />
      </div>

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
          fading ? "opacity-0" : ""
        } ${armed ? "cursor-crosshair touch-none" : ""}`}
        onPointerDown={(e) => {
          if (!armed) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = null;
          scratchTo(e);
        }}
        onPointerMove={(e) => {
          if (armed && last.current) scratchTo(e);
        }}
        onPointerUp={() => {
          last.current = null;
          if (armed) checkProgress();
        }}
        onPointerCancel={() => (last.current = null)}
      />

      {!armed && (
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="absolute inset-0 flex items-end justify-center pb-3 font-title text-xs tracking-[0.2em] text-white/80"
          aria-label={`Scratch card ${card.number}: ${card.title}`}
        >
          TAP TO SCRATCH
        </button>
      )}

      {armed && !fading && (
        <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-title text-xs tracking-[0.2em] text-white/90">
          DRAG TO SCRATCH ✨
        </p>
      )}

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(90vw,22rem)] rounded-2xl bg-paper p-6 text-center text-ink shadow-xl"
      >
        <p className="font-script text-4xl leading-tight">Ready?</p>
        <p className="mt-2 font-title text-lg tracking-wide">
          {card.number} | {card.title}
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          Once you scratch it, it stays revealed. You can aim to finish it within a week, but no
          pressure ever. This is your game, so you make the rules!
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white"
            onClick={() => {
              setArmed(true);
              dialogRef.current?.close();
            }}
          >
            Let&apos;s scratch!
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-2 text-ink-soft"
            onClick={() => dialogRef.current?.close()}
          >
            Not yet
          </button>
          <button
            type="button"
            className="text-xs text-ink-soft underline"
            onClick={() => {
              dialogRef.current?.close();
              setArmed(true);
              finish();
            }}
          >
            Just reveal it (no scratching)
          </button>
        </div>
      </dialog>
    </div>
  );
}
