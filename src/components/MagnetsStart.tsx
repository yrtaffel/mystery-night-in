"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { makeCode, makeId } from "@/lib/magnets";

const NAME_KEY = "magnets-name";

function readName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? "Atara";
  } catch {
    return "Atara";
  }
}

export default function MagnetsStart() {
  const router = useRouter();
  const [name, setName] = useState(readName);
  const [keepScore, setKeepScore] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  function start(e: React.FormEvent) {
    e.preventDefault();
    const code = makeCode();
    const id = makeId();
    try {
      localStorage.setItem(NAME_KEY, name.trim());
      sessionStorage.setItem(`magnets-id-${code}`, id);
      sessionStorage.setItem(`magnets-host-${code}`, JSON.stringify({ id, name: name.trim(), keepScore }));
    } catch {
      // storage blocked; hosting won't survive a refresh, but still works
    }
    router.push(`/play/${code}`);
  }

  return (
    <div className="space-y-8">
      <p className="mx-auto max-w-sm text-center text-sm text-ink-soft">
        Everyone gets the same silly prompt and a pile of word tiles. Build the funniest answer you can,
        read them out loud dramatically, and vote!
      </p>

      <form onSubmit={start} className="flex flex-col gap-3 rounded-2xl bg-white/60 p-5 shadow-sm">
        <h2 className="font-title text-lg tracking-wide uppercase">Start a game</h2>
        <label htmlFor="host-name" className="text-sm">Your name</label>
        <input id="host-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20}
          className="rounded-lg border border-line bg-white/80 px-3 py-3 text-base" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={keepScore} onChange={(e) => setKeepScore(e.target.checked)}
            className="h-5 w-5 accent-[var(--lavender-deep)]" />
          Keep score (you can change this later)
        </label>
        <button disabled={!name.trim()} className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white disabled:opacity-60">
          Start a game 🧲
        </button>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); if (joinCode.trim()) router.push(`/play/${joinCode.trim().toUpperCase()}`); }}
        className="flex flex-col gap-3 rounded-2xl bg-white/60 p-5 shadow-sm">
        <h2 className="font-title text-lg tracking-wide uppercase">Join with a code</h2>
        <label htmlFor="join-code" className="sr-only">Room code</label>
        <input id="join-code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} maxLength={8}
          autoCapitalize="characters" autoComplete="off" placeholder="ABCD23"
          className="rounded-lg border border-line bg-white/80 px-3 py-3 text-center font-title text-2xl tracking-[0.2em] uppercase" />
        <button disabled={!joinCode.trim()} className="rounded-full border border-line bg-white px-4 py-3 font-semibold disabled:opacity-60">
          Join
        </button>
      </form>
    </div>
  );
}
