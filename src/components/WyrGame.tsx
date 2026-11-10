"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { makeId } from "@/lib/magnets";
import { connect, type Transport } from "@/lib/magnetsTransport";
import { createClient } from "@/lib/supabase/client";
import {
  applyWyr, newWyr, QUESTIONS, RESULT_SECONDS, startWyr, type Choice, type WyrAction, type WyrState,
} from "@/lib/wyr";
import { Invite, NAME_KEY, NameForm, read, write } from "./RoomBits";

type Msg = { kind: "action"; action: WyrAction } | { kind: "state"; state: WyrState } | { kind: "hello" };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function WyrGame() {
  const router = useRouter();
  const { code: rawCode } = useParams<{ code: string }>();
  const code = (rawCode ?? "").toUpperCase();

  const [me, setMe] = useState<{ id: string; name: string; isHost: boolean } | null>(null);
  const [needName, setNeedName] = useState(false);
  const [state, setState] = useState<WyrState | null>(null);
  const [connected, setConnected] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const transport = useRef<Transport<Msg> | null>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  // Who am I? (The host's details are saved by the start page.)
  useEffect(() => {
    let id = read("session", `wyr-id-${code}`);
    if (!id) {
      id = makeId();
      write("session", `wyr-id-${code}`, id);
    }
    const hostSetup = read("session", `wyr-host-${code}`);
    const name = read("local", NAME_KEY);
    if (hostSetup) {
      const setup = JSON.parse(hostSetup) as { id: string; name: string };
      const saved = read("session", `wyr-state-${code}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time setup from storage
      setMe({ id: setup.id, name: setup.name, isHost: true });
      setState(saved ? (JSON.parse(saved) as WyrState) : newWyr(setup.id, setup.name));
    } else if (name) {
      setMe({ id, name, isHost: false });
    } else {
      setNeedName(true);
    }
  }, [code]);

  // Connect to the room.
  useEffect(() => {
    if (!me) return;
    const t = connect<Msg>(
      `wyr-${code}`,
      (m) => {
        if (me.isHost) {
          if (m.kind === "action") setState((s) => (s ? applyWyr(s, m.action) : s));
          if (m.kind === "hello") setState((s) => (s ? { ...s } : s));
        } else if (m.kind === "state") {
          setState((s) => (!s || m.state.hostId !== s.hostId || m.state.v >= s.v ? m.state : s));
        }
      },
      () => {
        setConnected(true);
        if (!me.isHost) t.send({ kind: "hello" });
      },
    );
    transport.current = t;
    return () => {
      t.close();
      transport.current = null;
      setConnected(false);
    };
  }, [code, me]);

  // Host: share the game state on every change (and every few seconds for late joiners).
  useEffect(() => {
    if (!me?.isHost || !state || !connected) return;
    transport.current?.send({ kind: "state", state });
    write("session", `wyr-state-${code}`, JSON.stringify(state));
    const t = setInterval(() => transport.current?.send({ kind: "state", state }), 3000);
    return () => clearInterval(t);
  }, [state, me, connected, code]);

  // Guest: keep saying hi until the host adds me.
  const joined = !!state?.players.some((p) => p.id === me?.id);
  useEffect(() => {
    if (!me || me.isHost || !connected || joined) return;
    const say = () => transport.current?.send({ kind: "action", action: { type: "join", id: me.id, name: me.name } });
    say();
    const t = setInterval(say, 2000);
    return () => clearInterval(t);
  }, [me, connected, joined]);

  // Host: after everyone's seen the votes for a few seconds, move on.
  const resultAt = state?.phase === "result" ? state.resultAt : null;
  useEffect(() => {
    if (!me?.isHost || !resultAt) return;
    const wait = Math.max(0, resultAt + RESULT_SECONDS * 1000 - Date.now());
    const t = setTimeout(() => setState((s) => (s && s.resultAt === resultAt ? applyWyr(s, { type: "next" }) : s)), wait);
    return () => clearTimeout(t);
  }, [me, resultAt]);

  // All done: signed-in players head back to the cards after a moment.
  const done = state?.phase === "done";
  useEffect(() => {
    if (!done || !signedIn) return;
    const t = setTimeout(() => router.push("/"), 8000);
    return () => clearTimeout(t);
  }, [done, signedIn, router]);

  function act(action: WyrAction) {
    if (!me) return;
    if (me.isHost) setState((s) => (s ? applyWyr(s, action) : s));
    else transport.current?.send({ kind: "action", action });
  }

  if (needName) {
    return (
      <NameForm onDone={(name) => {
        write("local", NAME_KEY, name);
        setNeedName(false);
        setMe({ id: read("session", `wyr-id-${code}`) ?? makeId(), name, isHost: false });
      }} />
    );
  }

  if (!me || !state || !joined) {
    return (
      <div className="py-12 text-center">
        <p className="font-script text-3xl">Setting up the questions…</p>
        <p className="mt-2 text-sm text-ink-soft">
          Connecting to room {code}. If this takes a while, make sure the host has the game open.
        </p>
      </div>
    );
  }

  const hostName = state.players.find((p) => p.id === state.hostId)?.name ?? "the host";
  const q = state.current !== null ? QUESTIONS[state.current] : null;
  const myVote = state.votes[me.id];
  const waitingOn = state.players.filter((p) => !state.votes[p.id]);
  const namesFor = (c: Choice) => state.players.filter((p) => state.votes[p.id] === c).map((p) => p.name);

  return (
    <div>
      {state.phase === "lobby" && (
        <>
          <Invite code={code} path="rather" title="Would You Rather" />
          <div className="mt-6 rounded-2xl bg-white/60 p-4 shadow-sm">
            <p className="mb-2 font-title text-xs tracking-[0.2em] text-ink-soft uppercase">Players</p>
            <ul className="space-y-1">
              {state.players.map((p) => (
                <li key={p.id}>🤔 {p.name}{p.id === state.hostId ? " (host)" : ""}{p.id === me.id ? " (you)" : ""}</li>
              ))}
            </ul>
          </div>
          {me.isHost ? (
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={() => setState((s) => (s ? startWyr(s) : s))}
                className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white">
                Start the questions!
              </button>
              {state.players.length < 2 && <p className="text-center text-xs text-ink-soft">Waiting for friends to join…</p>}
            </div>
          ) : (
            <p className="mt-6 text-center">Waiting for {hostName} to start… ✨</p>
          )}
        </>
      )}

      {(state.phase === "question" || state.phase === "result") && q && (
        <>
          <p className="text-center font-title text-xs tracking-[0.2em] text-ink-soft uppercase">
            Question {state.asked} of {state.target}
          </p>
          <h2 className="mt-1 text-center font-script text-4xl">Would you rather…</h2>
          <div className="mt-5 flex flex-col gap-3">
            {(["a", "b"] as const).map((c, i) => {
              const chosen = myVote === c;
              const voters = namesFor(c);
              return (
                <div key={c}>
                  {i === 1 && <p className="my-1 text-center font-title text-sm tracking-[0.2em] text-ink-soft">OR</p>}
                  <button type="button" disabled={state.phase === "result"}
                    onClick={() => act({ type: "vote", id: me.id, choice: c })}
                    className={`w-full rounded-2xl px-5 py-5 text-left text-lg font-medium shadow-sm ${
                      chosen ? "bg-lavender-deep text-white" : "bg-white/80"
                    }`}>
                    {cap(q[c])}
                    {state.phase === "result" && (
                      <span className={`mt-2 block text-sm ${chosen ? "text-white/90" : "text-ink-soft"}`}>
                        {voters.length ? voters.join(", ") : "Nobody!"}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {state.phase === "question" && myVote && waitingOn.length > 0 && (
            <p className="mt-4 text-center text-sm">
              Waiting for {waitingOn.map((p) => p.name).join(", ")}… (you can still change your answer)
            </p>
          )}
          {state.phase === "result" && (
            <div className="mt-5 text-center">
              <p className="font-medium">
                {namesFor("a").length === 0 || namesFor("b").length === 0
                  ? "Great minds think alike! 🤝"
                  : "Ooh, a split! Defend your answers. 😄"}
              </p>
              <button type="button" onClick={() => act({ type: "next" })} className="mt-3 text-sm underline">
                Next question →
              </button>
            </div>
          )}
        </>
      )}

      {state.phase === "more" && (
        <div className="rounded-2xl bg-white/60 p-6 text-center shadow-sm">
          <p className="text-4xl" aria-hidden="true">🤔</p>
          <h2 className="mt-2 font-script text-4xl">That&apos;s {state.target}!</h2>
          <p className="mt-2">Want to do 5 more questions?</p>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={() => act({ type: "more", yes: true })}
              className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white">
              Yes, 5 more!
            </button>
            <button type="button" onClick={() => act({ type: "more", yes: false })}
              className="rounded-full border border-line bg-white px-4 py-3">
              No, we&apos;re done
            </button>
          </div>
        </div>
      )}

      {state.phase === "done" && (
        <div className="rounded-2xl bg-white/70 p-8 text-center shadow-md">
          <p className="text-5xl" aria-hidden="true">🎉</p>
          <p className="mt-3 text-lg font-medium">
            Hope you had fun! Now back to real life, where you don&apos;t have to decide if you&apos;d rather
            have a tail or an extra eye.
          </p>
          {signedIn && (
            <>
              <p className="mt-4 text-sm text-ink-soft">Taking you back to your cards…</p>
              <Link href="/" className="mt-2 inline-block text-sm underline">Go now →</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
