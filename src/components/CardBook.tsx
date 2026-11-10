"use client";

import { useCallback } from "react";
import { cards, pages } from "@/lib/cards";
import { useProgress, type ProgressRow } from "@/lib/progress";
import CardItem from "./CardItem";

export default function CardBook() {
  const { rows, photoUrls, loaded, problem, save, uploadPhoto, removePhoto } = useProgress();

  const saveFields = useCallback(
    (n: number) => (fields: Partial<ProgressRow>) => save(n, fields),
    [save],
  );

  if (!loaded) {
    return <p className="py-16 text-center font-script text-3xl">Opening your book…</p>;
  }

  let index = 0;
  return (
    <>
      {problem && (
        <p role="alert" className="mb-4 rounded-lg bg-white/70 p-3 text-center text-sm text-red-800">
          {problem}
        </p>
      )}
      {pages.map((page) => (
        <section key={page.id} aria-labelledby={`page-${page.id}`} className="mb-10">
          <h2
            id={`page-${page.id}`}
            className={`my-4 text-center font-script leading-tight text-[2.6rem]`}
          >
            <span className="swoosh">{page.heading}</span>
          </h2>
          {cards
            .filter((c) => c.page === page.id)
            .map((card) => {
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
      ))}
    </>
  );
}
