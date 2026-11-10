"use client";

import { daysLeft, type ProgressRow } from "@/lib/progress";

type Props = {
  row?: ProgressRow;
  onComplete: () => void;
  onUndo: () => void;
};

/** After scratching: a gentle countdown and an "I did it!" button. */
export default function CardStatus({ row, onComplete, onUndo }: Props) {
  if (!row?.scratched_at) return null;

  if (row.completed_at) {
    return (
      <div className="mt-2 text-xs">
        <p className="font-medium text-lavender-deep">Nice job! Hope you enjoyed that! 💜</p>
        <button type="button" onClick={onUndo} className="mt-0.5 text-[11px] text-ink-soft underline">
          undo
        </button>
      </div>
    );
  }

  const days = daysLeft(row.scratched_at);
  const message =
    days === 0 ? "Whenever you're ready 💜" : days === 1 ? "Last day! (No pressure.)" : `You have ${days} days!`;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <p className="font-title text-xs tracking-wide">⏳ {message}</p>
      <button
        type="button"
        onClick={onComplete}
        className="rounded-full bg-lavender-deep px-3 py-1.5 text-xs font-semibold text-white"
      >
        I did it! 🎉
      </button>
    </div>
  );
}
