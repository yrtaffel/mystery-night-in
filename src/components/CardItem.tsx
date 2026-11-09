import type { Card } from "@/lib/cards";
import { BrainIcon, CATEGORY, Spoon } from "./icons";
import ScratchSquare from "./ScratchSquare";

function MetaRow({ card }: { card: Card }) {
  return (
    <p className="mb-1.5 flex flex-wrap gap-x-2.5 font-title text-[11px] font-medium tracking-wide sm:text-xs">
      <span className="whitespace-nowrap">$: {card.cost}</span>
      <span className="whitespace-nowrap">⏰: {card.time}</span>
      <span className="whitespace-nowrap">⏳: {card.duration}</span>
    </p>
  );
}

function Rating({ count, kind }: { count: number; kind: "spoons" | "brains" }) {
  const Icon = kind === "spoons" ? Spoon : BrainIcon;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${count} of 5 ${kind}`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} className={`h-4 w-4 ${i < count ? "" : "opacity-15"}`} />
      ))}
    </span>
  );
}

function IconColumn({ card }: { card: Card }) {
  return (
    <ul className="flex w-7 shrink-0 flex-col items-center gap-2.5 pt-1">
      {card.icons.map((key) => {
        const { label, Icon } = CATEGORY[key];
        return (
          <li key={key} title={label}>
            <Icon className="h-6 w-6" />
            <span className="sr-only">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function PhotoSlot() {
  return (
    <div className="flex h-full min-h-40 items-center justify-center gap-1 text-[11px] text-ink-soft min-[380px]:gap-1.5 min-[380px]:text-sm">
      <span>Photo</span>
      <span aria-hidden="true" className="h-32 w-7 shrink-0 -rotate-2 rounded-[2px] bg-[var(--tape)] shadow-sm min-[380px]:h-36 min-[380px]:w-10 sm:h-44 sm:w-12" />
      <span>Here</span>
    </div>
  );
}

type Props = {
  card: Card;
  flip: boolean; // alternate sides, like the pages of a book
  revealed: boolean;
  onReveal: () => void;
};

export default function CardItem({ card, flip, revealed, onReveal }: Props) {
  const square = (
    <div className="min-w-0 flex-1">
      <ScratchSquare card={card} revealed={revealed} onReveal={onReveal} />
    </div>
  );

  return (
    <article className="py-6" aria-labelledby={`card-${card.number}`}>
      <div className={`flex items-center gap-2 ${flip ? "flex-row-reverse" : ""}`}>
        <div className="w-[64%] shrink-0">
          <MetaRow card={card} />
          <div className="flex gap-2">
            {flip ? (
              <>
                <IconColumn card={card} />
                {square}
              </>
            ) : (
              <>
                {square}
                <IconColumn card={card} />
              </>
            )}
          </div>
          <div className={`mt-2 ${flip ? "pl-9" : "pr-9"}`}>
            <h3 id={`card-${card.number}`} className="font-title text-sm font-semibold tracking-wide sm:text-base">
              <span className="font-normal text-ink-soft">{card.number}</span>
              <span className="mx-1.5 text-line">|</span>
              {card.title}
            </h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <Rating count={card.spoons} kind="spoons" />
              <Rating count={card.brains} kind="brains" />
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <PhotoSlot />
        </div>
      </div>
      <div className="journal-lines mt-3 h-[7.7rem]" aria-hidden="true" />
    </article>
  );
}
