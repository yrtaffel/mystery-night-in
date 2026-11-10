import data from "../../content/cards.json";

export type IconKey =
  | "together" | "solo" | "art" | "game" | "kitchen" | "shopping"
  | "learn" | "pampering" | "movie" | "daytime" | "evening";

export type Card = {
  number: number;
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
  cut?: boolean; // removed during review
};

export type Page = { id: string; heading: string };

export const pages: Page[] = data.pages;
export const cards = (data.cards as Card[]).filter((c) => !c.cut);
