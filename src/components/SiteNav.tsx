"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/", label: "Cards" },
  { href: "/progress", label: "Progress" },
  { href: "/rules", label: "Rules" },
];

export default function SiteNav() {
  const path = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/signin");
    router.refresh();
  }

  return (
    <nav aria-label="Main" className="sticky top-0 z-10 -mx-4 bg-paper/90 px-4 py-2 backdrop-blur-sm">
      <ul className="flex items-center justify-center gap-5 font-title text-sm tracking-[0.15em] uppercase">
        {LINKS.map(({ href, label }) => {
          const active = path === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={active ? "swoosh font-semibold" : "text-ink-soft hover:text-ink"}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={signOut} className="text-[11px] tracking-normal normal-case text-ink-soft underline">
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
