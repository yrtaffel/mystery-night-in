"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { makeCode, makeId } from "@/lib/magnets";
import { NAME_KEY, read } from "./RoomBits";

export default function WyrStart() {
  const router = useRouter();
  const [name, setName] = useState(() => read("local", NAME_KEY) ?? "Atara");
  const [joinCode, setJoinCode] = useState("");

  function start(e: React.FormEvent) {
    e.preventDefault();
    const code = makeCode();
    const id = makeId();
    try {
      localStorage.setItem(NAME_KEY, name.trim());
      sessionStorage.setItem(`wyr-id-${code}`, id);
      sessionStorage.setItem(`wyr-host-${code}`, JSON.stringify({ id, name: name.trim() }));
    } catch {
      // storage blocked: hosting still works, it just won't survive a refresh
    }
    router.push(`/rather/${code}`);
  }

  return (
    <div className="space-y-8">
      <p className="mx-auto max-w-sm text-center text-sm text-ink-soft">
        Two choices. No skipping. Everyone votes, then you see who picked what. Some questions are silly,
        some are real, all of them are up for debate.
      </p>

      <form onSubmit={start} className="flex flex-col gap-3 rounded-2xl bg-white/60 p-5 shadow-sm">
        <h2 className="font-title text-lg tracking-wide uppercase">Start a game</h2>
        <label htmlFor="wyr-name" className="text-sm">Your name</label>
        <input id="wyr-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20}
          className="rounded-lg border border-line bg-white/80 px-3 py-3 text-base" />
        <button disabled={!name.trim()} className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white disabled:opacity-60">
          Start a game 🤔
        </button>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); if (joinCode.trim()) router.push(`/rather/${joinCode.trim().toUpperCase()}`); }}
        className="flex flex-col gap-3 rounded-2xl bg-white/60 p-5 shadow-sm">
        <h2 className="font-title text-lg tracking-wide uppercase">Join with a code</h2>
        <label htmlFor="wyr-code" className="sr-only">Room code</label>
        <input id="wyr-code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} maxLength={8}
          autoCapitalize="characters" autoComplete="off" placeholder="ABCD23"
          className="rounded-lg border border-line bg-white/80 px-3 py-3 text-center font-title text-2xl tracking-[0.2em] uppercase" />
        <button disabled={!joinCode.trim()} className="rounded-full border border-line bg-white px-4 py-3 font-semibold disabled:opacity-60">
          Join
        </button>
      </form>
    </div>
  );
}
