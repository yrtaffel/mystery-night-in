// Turns content/cards.json into content/CARDS.md (an easy-to-read review copy).
// Run: node scripts/cards-to-md.mjs
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync("content/cards.json", "utf8"));

const ICONS = {
  together: "💕", solo: "🧖‍♀️", art: "🎨", game: "🎲", kitchen: "☕",
  shopping: "🛒", learn: "📚", pampering: "💅", movie: "🍿",
  daytime: "☀️", evening: "🌙",
};

const lines = [
  "# Atara's Mystery Night In — Cards (draft)",
  "",
  "_Generated from `content/cards.json`. Edit the JSON, then run `node scripts/cards-to-md.mjs`._",
  "",
  "**Icon key:** " + Object.entries(ICONS).map(([k, v]) => `${v} ${k}`).join(" · "),
  "",
];

let n = 0;
for (const page of data.pages) {
  lines.push("---", "", `## ${page.heading}`, "");
  for (const c of data.cards.filter((c) => c.page === page.id && !c.cut)) {
    lines.push(`**${++n} | ${c.title}**  `);
    lines.push(
      `$ ${c.cost} · ⏰ ${c.time} · ⏳ ${c.duration} · ${"🥄".repeat(c.spoons)} · ${"🧠".repeat(c.brains)} · ${c.icons.map((i) => ICONS[i]).join("")}  `
    );
    lines.push(c.instructions);
    if (c.link) lines.push(`Link: ${c.link}`);
    if (c.feature) lines.push(`_Built-in feature: ${c.feature}_`);
    lines.push("");
  }
}

writeFileSync("content/CARDS.md", lines.join("\n"));
console.log(`Wrote content/CARDS.md (${data.cards.filter((c) => !c.cut).length} cards)`);
