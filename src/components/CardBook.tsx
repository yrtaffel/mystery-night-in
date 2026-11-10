"use client";

import { useCallback, useEffect, useState } from "react";
import { cards, pages } from "@/lib/cards";
import { EMPTY, matches, type Filters } from "@/lib/filters";
import { useProgress, type ProgressRow } from "@/lib/progress";
import CardItem from "./CardItem";
import FilterBar from "./FilterBar";

const FILTER_KEY = "card-filters";

export default function CardBook() {
  const { rows, photoUrls, loaded, problem, save, uploadPhoto, removePhoto } = useProgress();
  const [filters, setFilters] = useState<Filters>(EMPTY);

  // Remember her filters on this device (nice-to-have; fine if it fails).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore once after mount
      if (saved) setFilters({ ...EMPTY, ...JSON.parse(saved) });
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

      <FilterBar filters={filters} onChange={changeFilters} shown={visible.length} total={cards.length} />

      {visible.length === 0 && (
        <p className="py-12 text-center">
          No adventures match those filters.{" "}
          <button type="button" className="underline" onClick={() => changeFilters(EMPTY)}>
            Clear filters
          </button>
        </p>
      )}

      {pages.map((page) => {
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
