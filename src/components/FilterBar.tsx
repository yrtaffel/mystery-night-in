"use client";

import { useState } from "react";
import {
  countActive, EMPTY, MINUTE_CHOICES, TYPE_KEYS, type Filters, type Status, type When,
} from "@/lib/filters";
import { BrainIcon, CATEGORY, Spoon } from "./icons";

function Chip({
  on, onClick, children, label,
}: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        on ? "border-lavender-deep bg-lavender-deep text-white" : "border-line bg-white/70 text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-1.5 font-title text-xs tracking-[0.15em] text-ink-soft uppercase">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

type Props = {
  filters: Filters;
  onChange: (f: Filters) => void;
  shown: number;
  total: number;
};

export default function FilterBar({ filters: f, onChange, shown, total }: Props) {
  const [open, setOpen] = useState(false);
  const active = countActive(f);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className="rounded-full border border-line bg-white/70 px-4 py-2 font-title text-sm tracking-[0.15em] uppercase"
        >
          {open ? "Close filters" : "Filter"}
          {active > 0 && (
            <span className="ml-2 rounded-full bg-lavender-deep px-2 py-0.5 text-xs text-white">{active}</span>
          )}
        </button>
        <p className="text-xs text-ink-soft" aria-live="polite">
          {active ? `Showing ${shown} of ${total}` : `${total} adventures`}
          {active > 0 && (
            <button type="button" onClick={() => onChange(EMPTY)} className="ml-2 underline">
              Clear
            </button>
          )}
        </p>
      </div>

      {open && (
        <div id="filter-panel" className="mt-3 rounded-2xl bg-white/50 p-4 shadow-sm">
          <Group title="Who">
            {(["together", "solo"] as const).map((k) => {
              const { label, Icon } = CATEGORY[k];
              return (
                <Chip key={k} on={f.who.includes(k)} onClick={() => set({ who: toggle(f.who, k) })}>
                  <Icon className="h-4 w-4" /> {label}
                </Chip>
              );
            })}
          </Group>

          <Group title="Type">
            {TYPE_KEYS.map((k) => {
              const { label, Icon } = CATEGORY[k];
              return (
                <Chip key={k} on={f.types.includes(k)} onClick={() => set({ types: toggle(f.types, k) })}>
                  <Icon className="h-4 w-4" /> {label}
                </Chip>
              );
            })}
          </Group>

          <Group title="Spoons (energy), up to">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} on={f.maxSpoons === n} label={`Up to ${n} spoons`}
                onClick={() => set({ maxSpoons: f.maxSpoons === n ? null : n })}>
                {n} <Spoon className="h-3.5 w-3.5" />
              </Chip>
            ))}
          </Group>

          <Group title="Brains (mental effort), up to">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} on={f.maxBrains === n} label={`Up to ${n} brains`}
                onClick={() => set({ maxBrains: f.maxBrains === n ? null : n })}>
                {n} <BrainIcon className="h-3.5 w-3.5" />
              </Chip>
            ))}
          </Group>

          <Group title="Time of day (anytime cards always show)">
            {(
              [
                ["DAYTIME", "daytime"],
                ["EVENING", "evening"],
              ] as [When, "daytime" | "evening"][]
            ).map(([w, k]) => {
              const { label, Icon } = CATEGORY[k];
              return (
                <Chip key={w} on={f.when.includes(w)} onClick={() => set({ when: toggle(f.when, w) })}>
                  <Icon className="h-4 w-4" /> {label}
                </Chip>
              );
            })}
          </Group>

          <Group title="How long, up to">
            {MINUTE_CHOICES.map((m) => (
              <Chip key={m} on={f.maxMinutes === m}
                onClick={() => set({ maxMinutes: f.maxMinutes === m ? null : m })}>
                ⏳ {m === 60 ? "1 hr" : `${m} min`}
              </Chip>
            ))}
          </Group>

          <Group title="Cost">
            <Chip on={f.freeOnly} onClick={() => set({ freeOnly: !f.freeOnly })}>$ Free only</Chip>
          </Group>

          <Group title="Progress">
            {(
              [
                ["new", "Not scratched yet"],
                ["scratched", "Scratched"],
                ["done", "Completed"],
              ] as [Status, string][]
            ).map(([s, label]) => (
              <Chip key={s} on={f.status.includes(s)} onClick={() => set({ status: toggle(f.status, s) })}>
                {label}
              </Chip>
            ))}
          </Group>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 w-full rounded-full bg-lavender-deep px-4 py-2.5 font-semibold text-white"
          >
            Show {shown} {shown === 1 ? "card" : "cards"}
          </button>
        </div>
      )}
    </div>
  );
}
