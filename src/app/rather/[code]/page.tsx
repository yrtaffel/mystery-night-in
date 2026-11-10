import { Suspense } from "react";
import BackToSite from "@/components/BackToSite";
import WyrGame from "@/components/WyrGame";

// Public page: guests can join a Would You Rather game without an account.
export default function RatherGamePage() {
  return (
    <main className="mx-auto w-full max-w-xl overflow-x-clip px-4 pt-4 pb-16">
      <p className="mb-4 min-h-5"><BackToSite /></p>
      <h1 className="mb-6 text-center font-script text-5xl">
        <span className="swoosh">Would You Rather</span>
      </h1>
      <Suspense fallback={<p className="py-12 text-center font-script text-3xl">Setting up the questions…</p>}>
        <WyrGame />
      </Suspense>
    </main>
  );
}
