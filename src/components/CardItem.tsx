import type { Card } from "@/lib/cards";
import type { ProgressRow } from "@/lib/progress";
import CardStatus from "./CardStatus";
import { BrainIcon, CATEGORY, Spoon } from "./icons";
import Journal from "./Journal";
import PhotoSlot from "./PhotoSlot";
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

type Props = {
  card: Card;
  flip: boolean; // alternate sides, like the pages of a book
  row?: ProgressRow;
  photoUrl?: string;
  onReveal: () => void;
  onSave: (fields: Partial<ProgressRow>) => Promise<boolean>;
  onUpload: (file: File) => Promise<boolean>;
  onRemovePhoto: () => Promise<void>;
};

export default function CardItem({
  card, flip, row, photoUrl, onReveal, onSave, onUpload, onRemovePhoto,
}: Props) {
  const revealed = !!row?.scratched_at;
  const square = (
    <div className="min-w-0 flex-1">
      <ScratchSquare card={card} revealed={revealed} onReveal={onReveal} />
    </div>
  );

  return (
    <article id={`c${card.number}`} className="scroll-mt-16 py-6" aria-labelledby={`card-${card.number}`}>
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
            <CardStatus
              row={row}
              onComplete={() => onSave({ completed_at: new Date().toISOString() })}
              onUndo={() => onSave({ completed_at: null })}
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <PhotoSlot
            cardNumber={card.number}
            locked={!revealed}
            url={photoUrl}
            onUpload={onUpload}
            onRemove={onRemovePhoto}
          />
        </div>
      </div>
      <Journal
        cardNumber={card.number}
        locked={!revealed}
        initial={row?.journal ?? ""}
        onSave={(journal) => onSave({ journal })}
      />
    </article>
  );
}
