import { Suspense } from "react";
import BackToSite from "@/components/BackToSite";
import MagnetsGame from "@/components/MagnetsGame";

// Public page: guests can join a Fridge Magnets game without an account.
export default function PlayPage() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pt-4 pb-16">
      <p className="mb-4 min-h-5"><BackToSite /></p>
      <h1 className="mb-6 text-center font-script text-5xl">
        <span className="swoosh">Fridge Magnets</span>
      </h1>
      <Suspense fallback={<p className="py-12 text-center font-script text-3xl">Finding the fridge…</p>}>
        <MagnetsGame />
      </Suspense>
      <p className="mt-8 text-center"><BackToSite /></p>
    </main>
  );
}
