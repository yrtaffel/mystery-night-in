import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

// Placeholder home page. The real card grid comes in Phase 3.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Atara&apos;s Mystery Night In</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <SignedInAs />
      </Suspense>
      <p>The mystery cards are coming soon.</p>
    </main>
  );
}

async function SignedInAs() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <p>You&apos;re signed in as {String(data?.claims?.email ?? "")} 💜</p>;
}
