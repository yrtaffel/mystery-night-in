"use client";

import { daysLeft, type ProgressRow } from "@/lib/progress";

// Said by a friend, not a robot. One is picked per card and stays the same.
const CHEERS = [
  "Yay! Hope you enjoyed that one!",
  "Go you!",
  "Look at you go!",
  "So glad you did this one!",
  "Another one done!",
  "Woohoo!",
  "Love that you did this!",
  "Hope that was fun!",
  "Yesss, nicely done!",
  "Proud of you!",
];

function cheerFor(cardNumber: number, completedAt: string) {
  let hash = cardNumber;
  for (const ch of completedAt) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CHEERS[hash % CHEERS.length];
}

type Props = {
  row?: ProgressRow;
  onComplete: () => void;
  onUndo: () => void;
};

/** After scratching: a gentle countdown and an "Adventure complete!" button. */
export default function CardStatus({ row, onComplete, onUndo }: Props) {
  if (!row?.scratched_at) return null;

  if (row.completed_at) {
    return (
      <div className="mt-2 text-xs">
        <p className="font-medium text-lavender-deep">{cheerFor(row.card_number, row.completed_at)}</p>
        <button type="button" onClick={onUndo} className="mt-0.5 text-[11px] text-ink-soft underline">
          undo
        </button>
      </div>
    );
  }

  const days = daysLeft(row.scratched_at);
  const message =
    days === 0 ? "Whenever you're ready" : `${days} more ${days === 1 ? "day" : "days"}`;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <p className="font-title text-xs tracking-wide">⏳ {message}</p>
      <button
        type="button"
        onClick={onComplete}
        className="rounded-full bg-lavender-deep px-3 py-1.5 text-xs font-semibold text-white"
      >
        Adventure complete! 🎉
      </button>
    </div>
  );
}
