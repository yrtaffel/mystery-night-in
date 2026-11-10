# Atara's Mystery Night In

A birthday gift: a cozy, phone-first "scratch-off adventure book" for Atara.

- **Cards:** 30 activities in 7 sections, each with hints (cost, best time, duration, spoons, brains, icons) and a real scratch-off square.
- **After scratching:** a gentle 1-week countdown, a photo slot, journal lines, and an "Adventure complete!" button.
- **Extras:** filters, a progress page with a photo gallery, a rules page, the Time Travel Riddle Trail, and Fridge Magnets (with guest links).

## Stack

Next.js + Tailwind (hosted on Vercel), Supabase for sign-in, saving progress, photos, and live game rooms.

## Where things live

- `content/cards.json`: all card text and ratings (`node scripts/cards-to-md.mjs` makes `content/CARDS.md`, a readable copy)
- `content/trail.json`: the riddle trail (encrypted; each stop unlocks with the previous answer)
- `content/magnets.json`: Fridge Magnets words and prompts (partly from [fridgemagnets](https://github.com/lukeshafer/fridgemagnets), MIT, see `content/fridgemagnets-LICENSE.md`)
- `supabase/migrations/`: the SQL that sets up saving and photo storage
- `vercel.json`: a daily ping so the free Supabase project never pauses

## Run locally

```bash
npm install
npm run dev
```

Needs `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).
