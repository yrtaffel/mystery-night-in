"use client";

import { useState } from "react";

// Shared bits for the live games (Fridge Magnets, Would You Rather).

export const NAME_KEY = "magnets-name";

export function read(store: "local" | "session", key: string) {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

export function write(store: "local" | "session", key: string, value: string) {
  try {
    (store === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    // private browsing: fine
  }
}

export function Invite({ code, path, title }: { code: string; path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/${path}/${code}`;
  return (
    <div className="rounded-2xl bg-white/60 p-4 text-center shadow-sm">
      <p className="font-title text-xs tracking-[0.2em] text-ink-soft uppercase">Room code</p>
      <p className="font-title text-4xl font-semibold tracking-[0.2em]">{code}</p>
      <p className="mt-1 text-xs text-ink-soft">Friends can join with this link. No account needed!</p>
      <div className="mt-3 flex justify-center gap-2">
        <button type="button" className="rounded-full bg-lavender-deep px-4 py-2 text-sm font-semibold text-white"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              window.prompt("Copy this link:", link);
            }
          }}>
          {copied ? "Copied! ✓" : "Copy invite link"}
        </button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button type="button" className="rounded-full border border-line bg-white px-4 py-2 text-sm"
            onClick={() => navigator.share({ title, text: `Come play ${title} with me!`, url: link }).catch(() => {})}>
            Share
          </button>
        )}
      </div>
    </div>
  );
}

export function NameForm({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState(read("local", NAME_KEY) ?? "");
  return (
    <form className="mx-auto flex max-w-xs flex-col gap-3"
      onSubmit={(e) => { e.preventDefault(); if (name.trim()) onDone(name.trim()); }}>
      <label htmlFor="player-name" className="text-center">What should we call you?</label>
      <input id="player-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoComplete="nickname"
        className="rounded-lg border border-line bg-white/80 px-3 py-3 text-center text-base" />
      <button disabled={!name.trim()} className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white disabled:opacity-60">
        Join the game
      </button>
    </form>
  );
}
