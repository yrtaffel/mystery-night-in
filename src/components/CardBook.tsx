"use client";

import { useCallback, useEffect, useState } from "react";
import { cards, pages } from "@/lib/cards";
import { EMPTY, matches, type Filters } from "@/lib/filters";
import { useProgress, type ProgressRow } from "@/lib/progress";
import CardItem from "./CardItem";
import CardRow from "./CardRow";
import FilterBar from "./FilterBar";

const FILTER_KEY = "card-filters";
const VIEW_KEY = "card-view";
type View = "book" | "list";

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const opt = (v: View, label: string) => (
    <button
      type="button"
      aria-pressed={view === v}
      onClick={() => onChange(v)}
      className={`flex-1 rounded-full px-4 py-1.5 font-title text-sm tracking-[0.15em] uppercase ${
        view === v ? "bg-lavender-deep text-white" : "text-ink-soft"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="How to show the cards"
      className="mx-auto mb-4 flex max-w-xs rounded-full border border-line bg-white/70 p-1">
      {opt("book", "Book view")}
      {opt("list", "List view")}
    </div>
  );
}

export default function CardBook() {
  const { rows, photoUrls, loaded, problem, save, uploadPhoto, removePhoto } = useProgress();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [view, setView] = useState<View>("book");
  const [openId, setOpenId] = useState<number | null>(null);

  // Remember her filters on this device (nice-to-have; fine if it fails).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore once after mount
      if (saved) setFilters({ ...EMPTY, ...JSON.parse(saved) });
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {
      // ignore
    }
  }, []);
  const changeFilters = (f: Filters) => {
    setFilters(f);
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(f));
    } catch {
      // ignore
    }
  };

  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // ignore
    }
  };

  // From the list: switch to the book and jump to that card.
  const openCard = (id: number) => {
    changeView("book");
    setOpenId(id);
  };
  useEffect(() => {
    if (view === "book" && openId !== null) {
      document.getElementById(`c${openId}`)?.scrollIntoView({ block: "start" });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot jump
      setOpenId(null);
    }
  }, [view, openId]);

  const saveFields = useCallback(
    (n: number) => (fields: Partial<ProgressRow>) => save(n, fields),
    [save],
  );

  // Jump to a card (e.g. /#c12) once the cards have loaded.
  useEffect(() => {
    if (loaded && window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView();
    }
  }, [loaded]);

  if (!loaded) {
    return <p className="py-16 text-center font-script text-3xl">Opening your book…</p>;
  }

  const visible = cards.filter((c) => matches(c, rows[c.id], filters));

  let index = 0;
  return (
    <>
      {problem && (
        <p role="alert" className="mb-4 rounded-lg bg-white/70 p-3 text-center text-sm text-red-800">
          {problem}
        </p>
      )}

      <ViewToggle view={view} onChange={changeView} />
      <FilterBar filters={filters} onChange={changeFilters} shown={visible.length} total={cards.length} />

      {visible.length === 0 && (
        <p className="py-12 text-center">
          No adventures match those filters.{" "}
          <button type="button" className="underline" onClick={() => changeFilters(EMPTY)}>
            Clear filters
          </button>
        </p>
      )}

      {view === "list" &&
        pages.map((page) => {
          const pageCards = visible.filter((c) => c.page === page.id);
          if (!pageCards.length) return null;
          return (
            <section key={page.id} aria-labelledby={`list-${page.id}`} className="mb-6">
              <h2 id={`list-${page.id}`} className="mt-5 mb-2 font-script text-3xl leading-tight">
                <span className="swoosh">{page.heading}</span>
              </h2>
              <ul className="space-y-2">
                {pageCards.map((card) => (
                  <CardRow key={card.id} card={card} row={rows[card.id]} onOpen={() => openCard(card.id)} />
                ))}
              </ul>
            </section>
          );
        })}

      {view === "book" && pages.map((page) => {
        const pageCards = visible.filter((c) => c.page === page.id);
        if (!pageCards.length) return null;
        return (
          <section key={page.id} aria-labelledby={`page-${page.id}`} className="mb-10">
            <h2 id={`page-${page.id}`} className="my-4 text-center font-script text-[2.6rem] leading-tight">
              <span className="swoosh">{page.heading}</span>
            </h2>
            {pageCards.map((card) => {
              const row = rows[card.id];
              return (
                <CardItem
                  key={card.id}
                  card={card}
                  flip={index++ % 2 === 1}
                  row={row}
                  photoUrl={row?.photo_path ? photoUrls[row.photo_path] : undefined}
                  onReveal={() => save(card.id, { scratched_at: new Date().toISOString() })}
                  onSave={saveFields(card.id)}
                  onUpload={(file) => uploadPhoto(card.id, file)}
                  onRemovePhoto={() => removePhoto(card.id)}
                />
              );
            })}
          </section>
        );
      })}
    </>
  );
}
