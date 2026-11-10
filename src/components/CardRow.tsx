import type { Card } from "@/lib/cards";
import { daysLeft, type ProgressRow } from "@/lib/progress";
import { BrainIcon, CATEGORY, Spoon } from "./icons";

function Dots({ count, kind }: { count: number; kind: "spoons" | "brains" }) {
  const Icon = kind === "spoons" ? Spoon : BrainIcon;
  return (
    <span className="inline-flex items-center gap-px" role="img" aria-label={`${count} of 5 ${kind}`}>
      {Array.from({ length: count }, (_, i) => <Icon key={i} className="h-3.5 w-3.5" />)}
    </span>
  );
}

function Status({ row }: { row?: ProgressRow }) {
  if (row?.completed_at) {
    return <span className="rounded-full bg-lavender/60 px-2 py-0.5 text-[11px] font-semibold">✓ Done</span>;
  }
  if (row?.scratched_at) {
    const days = daysLeft(row.scratched_at);
    return (
      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-lavender-deep">
        ⏳ {days === 0 ? "Whenever" : `${days} more ${days === 1 ? "day" : "days"}`}
      </span>
    );
  }
  return <span className="rounded-full bg-scratch/40 px-2 py-0.5 text-[11px] text-ink-soft">Not scratched</span>;
}

/** One compact line per card for the list view. Tapping opens it in the book. */
export default function CardRow({ card, row, onOpen }: { card: Card; row?: ProgressRow; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-xl bg-white/55 px-3 py-2.5 text-left shadow-sm hover:bg-white/80"
        aria-label={`${card.number}, ${card.title}. Open this card.`}
      >
        <span className="w-6 shrink-0 pt-0.5 text-right font-title text-sm text-ink-soft">{card.number}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="font-title text-[15px] leading-tight font-semibold tracking-wide">{card.title}</span>
            <span className="shrink-0 whitespace-nowrap"><Status row={row} /></span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-title text-[11px] tracking-wide text-ink-soft">
            <span>{card.cost}</span>
            <span>{card.time}</span>
            <span>{card.duration}</span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Dots count={card.spoons} kind="spoons" />
            <Dots count={card.brains} kind="brains" />
            <span className="inline-flex items-center gap-1.5">
              {card.icons.map((k) => {
                const { label, Icon } = CATEGORY[k];
                return <Icon key={k} className="h-4 w-4" aria-label={label} />;
              })}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
