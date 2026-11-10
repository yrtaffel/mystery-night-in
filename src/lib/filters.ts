import type { Card, IconKey } from "@/lib/cards";
import type { ProgressRow } from "@/lib/progress";

export type Status = "new" | "scratched" | "done";
export type When = "DAYTIME" | "EVENING";

export type Filters = {
  who: ("together" | "solo")[];
  types: IconKey[];
  maxSpoons: number | null;
  maxBrains: number | null;
  when: When[];
  maxMinutes: number | null;
  freeOnly: boolean;
  status: Status[];
};

export const EMPTY: Filters = {
  who: [], types: [], maxSpoons: null, maxBrains: null, when: [], maxMinutes: null, freeOnly: false, status: [],
};

export const TYPE_KEYS: IconKey[] = ["art", "game", "kitchen", "shopping", "learn", "pampering", "movie", "online"];
export const MINUTE_CHOICES = [20, 30, 45, 60];

/** "30–45 MIN" → 45, "1 HR" → 60, "40 MIN + CHECK-INS" → 40. */
export function minutesOf(duration: string) {
  const nums = (duration.match(/\d+/g) ?? []).map(Number);
  const top = nums.length ? Math.max(...nums.slice(0, 2)) : 0;
  return /HR/.test(duration) ? top * 60 : top;
}

export function countActive(f: Filters) {
  return (
    f.who.length + f.types.length + f.when.length + f.status.length +
    (f.maxSpoons ? 1 : 0) + (f.maxBrains ? 1 : 0) + (f.maxMinutes ? 1 : 0) + (f.freeOnly ? 1 : 0)
  );
}

export function matches(card: Card, row: ProgressRow | undefined, f: Filters) {
  if (f.who.length && !f.who.some((w) => card.icons.includes(w))) return false;
  if (f.types.length && !f.types.some((t) => card.icons.includes(t))) return false;
  if (f.maxSpoons && card.spoons > f.maxSpoons) return false;
  if (f.maxBrains && card.brains > f.maxBrains) return false;
  // "Anytime" cards fit any time of day.
  if (f.when.length && card.time !== "ANYTIME" && !f.when.includes(card.time as When)) return false;
  if (f.maxMinutes && minutesOf(card.duration) > f.maxMinutes) return false;
  if (f.freeOnly && card.cost !== "FREE") return false;
  if (f.status.length) {
    const s: Status = row?.completed_at ? "done" : row?.scratched_at ? "scratched" : "new";
    if (!f.status.includes(s)) return false;
  }
  return true;
}
