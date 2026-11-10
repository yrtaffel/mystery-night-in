# Build plan notes

## Decisions so far
- Stack: Next.js + Tailwind, Supabase (auth, database, photo storage, realtime), Vercel hosting. All free tiers.
- Keep Supabase awake with a free scheduled ping (free projects pause after ~1 week idle).
- Card #14 → built-in **Fridge Magnets** page, rebuilt in our site (Option B).
  - Based on [lukeshafer/fridgemagnets](https://github.com/lukeshafer/fridgemagnets) (MIT license, © 2022 Luke Shafer). Credit the author on the page.
  - Reuse its word tiles + prompts; swap out prompts that don't fit the vibe (edgy is OK).
  - Two players join with a room code; live play via Supabase Realtime.
  - Phone-first: tap tiles to build a sentence → reveal → vote.
- Built-in mini features: Riddle Trail (#12), A–Z letter spinner (#24), Fridge Magnets (#14).

## Phases
1. ✅ Cards drafted (Yehudit will review later)
2. ✅ Setup: Supabase + Vercel accounts, starter site
   - ✅ Supabase project created (East US), keys added
   - ✅ Starter site built (magic link + 6-digit code sign-in)
   - ✅ Vercel import started
   - ✅ Gmail SMTP connected (custom sender), signups locked, 2 users pre-added
   - ✅ Live at https://mystery-night-in.vercel.app — sign-in email works
3. ✅ Design + card grid + scratch-off
4. ✅ Photos, journal, countdown, progress page, rules page ("I did it!" → "Nice job! Hope you enjoyed that!"; books stay separate per person)
5. ✅ Mini features: Time Travel riddle trail, Fridge Magnets (guest links, optional score), filters, 7 sections
6. ✅ Birthday welcome, daily keep-awake ping (Vercel cron), final polish

## Final card count
36 cards for Atara's 36th birthday, in 7 sections.
