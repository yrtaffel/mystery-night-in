"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Shows a way back to the cards, but only for people signed in to the site (not guests). */
export default function BackToSite({ className = "" }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  if (!signedIn) return null;
  return (
    <Link href="/" className={`text-sm underline ${className}`}>
      ← Back to Atara&apos;s Mystery Night In
    </Link>
  );
}
