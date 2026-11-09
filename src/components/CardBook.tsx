"use client";

import { useEffect, useMemo, useState } from "react";
import { cards, pages } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import CardItem from "./CardItem";

type Progress = Record<number, { scratched_at: string | null }>;

export default function CardBook() {
  const supabase = useMemo(() => createClient(), []);
  const [progress, setProgress] = useState<Progress>({});
  const [saveProblem, setSaveProblem] = useState(false);

  // Load which cards she's already scratched.
  useEffect(() => {
    supabase
      .from("card_progress")
      .select("card_number, scratched_at")
      .then(({ data, error }) => {
        if (error) return setSaveProblem(true);
        const next: Progress = {};
        for (const row of data ?? []) next[row.card_number] = { scratched_at: row.scratched_at };
        setProgress(next);
      });
  }, [supabase]);

  async function reveal(cardNumber: number) {
    const scratched_at = new Date().toISOString();
    setProgress((p) => ({ ...p, [cardNumber]: { scratched_at } }));
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("card_progress")
      .upsert({ user_id: auth.user?.id, card_number: cardNumber, scratched_at });
    if (error) setSaveProblem(true);
  }

  let index = 0;
  return (
    <>
      {saveProblem && (
        <p role="alert" className="mx-4 mb-4 rounded-lg bg-white/70 p-3 text-center text-sm text-red-800">
          Heads up: progress isn&apos;t saving right now. Scratched cards may reset on refresh.
        </p>
      )}
      {pages.map((page) => (
        <section key={page.id} aria-labelledby={`page-${page.id}`} className="mb-10">
          <h2 id={`page-${page.id}`} className="my-4 text-center font-script text-[2.6rem] leading-tight">
            <span className="swoosh">{page.heading}</span>
          </h2>
          {cards
            .filter((c) => c.page === page.id)
            .map((card) => (
              <CardItem
                key={card.number}
                card={card}
                flip={index++ % 2 === 1}
                revealed={!!progress[card.number]?.scratched_at}
                onReveal={() => reveal(card.number)}
              />
            ))}
        </section>
      ))}
    </>
  );
}
