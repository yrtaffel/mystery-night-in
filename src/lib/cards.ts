import data from "../../content/cards.json";

export type IconKey =
  | "together" | "solo" | "art" | "game" | "kitchen" | "shopping"
  | "learn" | "pampering" | "movie" | "online" | "daytime" | "evening";

export type Card = {
  id: number; // permanent; progress is saved under this, so it never changes
  number: number; // the number shown on the card (1, 2, 3… in page order)
  page: string;
  title: string;
  cost: string;
  time: string;
  duration: string;
  spoons: number;
  brains: number;
  icons: IconKey[];
  instructions: string;
  link?: string;
  feature?: string;
};

export type Page = { id: string; heading: string };

type RawCard = Omit<Card, "number"> & { cut?: boolean };

export const pages: Page[] = data.pages;

export const cards: Card[] = pages
  .flatMap((page) => (data.cards as RawCard[]).filter((c) => c.page === page.id && !c.cut))
  .map((c, i) => {
    const card: Card & { cut?: boolean } = { ...c, number: i + 1 };
    delete card.cut;
    return card;
  });
