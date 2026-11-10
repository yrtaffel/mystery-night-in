import { connection } from "next/server";

/**
 * Called once a day by a Vercel cron job (see vercel.json). It makes one tiny
 * request to Supabase so the free project never pauses from inactivity.
 */
export async function GET() {
  await connection();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ ok: false, reason: "missing settings" }, { status: 500 });

  const res = await fetch(`${url}/rest/v1/card_progress?select=card_number&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  return Response.json({ ok: res.ok, status: res.status, at: new Date().toISOString() });
}
