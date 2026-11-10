"use client";

import Link from "next/link";
import { cards } from "@/lib/cards";
import { useProgress } from "@/lib/progress";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/60 px-2 py-4 text-center shadow-sm">
      <p className="font-title text-3xl font-semibold">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

export default function ProgressView() {
  const { rows, photoUrls, loaded } = useProgress();
  if (!loaded) return <p className="py-16 text-center font-script text-3xl">Counting adventures…</p>;

  const list = Object.values(rows);
  const scratched = list.filter((r) => r.scratched_at).length;
  const completed = list.filter((r) => r.completed_at).length;
  const photos = cards.flatMap((card) => {
    const path = rows[card.id]?.photo_path;
    const url = path ? photoUrls[path] : undefined;
    return url ? [{ card, url }] : [];
  });

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Stat value={`${scratched}/${cards.length}`} label="scratched" />
        <Stat value={`${completed}`} label="completed" />
        <Stat value={`${photos.length}`} label="photos" />
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70" role="img"
        aria-label={`${scratched} of ${cards.length} cards scratched`}>
        <div className="h-full rounded-full bg-lavender" style={{ width: `${(scratched / cards.length) * 100}%` }} />
      </div>

      <h2 className="mt-10 mb-6 text-center font-script text-[2.6rem] leading-tight">
        <span className="swoosh">Memories so far</span>
      </h2>

      {photos.length === 0 ? (
        <p className="text-center text-sm text-ink-soft">
          Your photos will show up here 📸 Scratch a card, try it, then tap &quot;Photo Here.&quot;
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8">
          {photos.map(({ card, url }, i) => (
            <li key={card.id}>
              <Link href={`/#c${card.id}`} className="block">
                <span className={`relative block bg-white p-1.5 pb-3 shadow-md ${i % 2 ? "rotate-2" : "-rotate-2"}`}>
                  <span aria-hidden="true"
                    className="absolute -top-3 left-1/2 block h-6 w-14 -translate-x-1/2 -rotate-6 rounded-[2px] bg-[var(--tape)] shadow-sm" />
                  {/* eslint-disable-next-line @next/next/no-img-element -- private, signed photo URL */}
                  <img src={url} alt={`Photo for ${card.title}`} className="aspect-square w-full object-cover" />
                </span>
                <span className="mt-2 block text-center font-title text-xs tracking-wide">
                  {card.number} | {card.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
