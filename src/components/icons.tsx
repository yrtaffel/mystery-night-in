import {
  BookOpen, Brain, Coffee, Dice5, Globe, Moon, Paintbrush, Popcorn,
  ShoppingCart, Smile, Sun, type LucideProps,
} from "lucide-react";
import type { IconKey } from "@/lib/cards";

type SvgProps = { className?: string; strokeWidth?: number };

/** Two overlapping hearts = "Together". */
export function TwoHearts({ className, strokeWidth = 2 }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9.5 19.5S2.5 15.3 2.5 10.3A3.7 3.7 0 0 1 9.5 8.6a3.7 3.7 0 0 1 7 1.7" />
      <path d="M16.5 21s-5-3-5-6.6a2.6 2.6 0 0 1 5-1.2 2.6 2.6 0 0 1 5 1.2c0 3.6-5 6.6-5 6.6Z"
        fill="currentColor" />
    </svg>
  );
}

/** A spoon (energy). */
export function Spoon({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="15.6" cy="8.4" rx="4.6" ry="6.4" transform="rotate(45 15.6 8.4)" />
      <path d="M11.4 11.2 13 12.8 5.2 21.4a1.6 1.6 0 0 1-2.4-2.3Z" />
    </svg>
  );
}

/** A bottle of nail polish (pampering). */
export function NailPolish({ className, strokeWidth = 2 }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="10" y="2" width="4" height="7" rx="1" fill="currentColor" />
      <path d="M8 9h8l1.5 3v8a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-8Z" />
      <path d="M6.5 15h11" />
    </svg>
  );
}

const lucide = (Icon: React.ComponentType<LucideProps>) =>
  function L({ className, strokeWidth = 2 }: SvgProps) {
    return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  };

export const CATEGORY: Record<IconKey, { label: string; Icon: React.ComponentType<SvgProps> }> = {
  together: { label: "Together", Icon: TwoHearts },
  solo: { label: "Solo self-care", Icon: lucide(Smile) },
  art: { label: "Art", Icon: lucide(Paintbrush) },
  game: { label: "Game", Icon: lucide(Dice5) },
  kitchen: { label: "Kitchen", Icon: lucide(Coffee) },
  shopping: { label: "Shopping", Icon: lucide(ShoppingCart) },
  learn: { label: "Learn", Icon: lucide(BookOpen) },
  pampering: { label: "Pampering", Icon: NailPolish },
  movie: { label: "Movie", Icon: lucide(Popcorn) },
  online: { label: "Online", Icon: lucide(Globe) },
  daytime: { label: "Daytime", Icon: lucide(Sun) },
  evening: { label: "Evening", Icon: lucide(Moon) },
};

export const BrainIcon = lucide(Brain);
