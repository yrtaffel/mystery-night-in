"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  apply, canVoteForSelf, dealTiles, host, joinTiles, makeId, newGame, voteCounts,
  type Action, type GameState,
} from "@/lib/magnets";
import { connect, type Msg, type Transport } from "@/lib/magnetsTransport";

const NAME_KEY = "magnets-name";
const tilt = (i: number) => ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0"][i % 5];

function read(store: "local" | "session", key: string) {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}
function write(store: "local" | "session", key: string, value: string) {
  try {
    (store === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    // private browsing: fine
  }
}

function Tile({ word, onClick, i, label }: { word: string; onClick: () => void; i: number; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className={`rounded-[3px] bg-white px-2 py-1 text-[15px] leading-tight shadow-[0_1px_3px_rgba(0,0,0,0.25)] ${tilt(i)}`}>
      {word}
    </button>
  );
}

function Answer({ words }: { words: string[] }) {
  return (
    <p className="flex flex-wrap gap-1.5">
      {words.map((w, i) => (
        <span key={i} className={`rounded-[3px] bg-white px-2 py-1 text-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.25)] ${tilt(i)}`}>
          {w}
        </span>
      ))}
    </p>
  );
}

function Invite({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/play/${code}`;
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
            onClick={() => navigator.share({ title: "Fridge Magnets", text: "Come play Fridge Magnets with me!", url: link }).catch(() => {})}>
            Share
          </button>
        )}
      </div>
    </div>
  );
}

function NameForm({ onDone }: { onDone: (name: string) => void }) {
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

export default function MagnetsGame() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = (rawCode ?? "").toUpperCase();

  const [me, setMe] = useState<{ id: string; name: string; isHost: boolean } | null>(null);
  const [needName, setNeedName] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const transport = useRef<Transport | null>(null);

  // Who am I? (Host info is saved by the "Start a game" page.)
  useEffect(() => {
    let id = read("session", `magnets-id-${code}`);
    if (!id) {
      id = makeId();
      write("session", `magnets-id-${code}`, id);
    }
    const hostSetup = read("session", `magnets-host-${code}`);
    const name = read("local", NAME_KEY);
    if (hostSetup) {
      const setup = JSON.parse(hostSetup) as { id: string; name: string; keepScore: boolean };
      const saved = read("session", `magnets-state-${code}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time setup from storage
      setMe({ id: setup.id, name: setup.name, isHost: true });
      setState(saved ? (JSON.parse(saved) as GameState) : newGame(setup.id, setup.name, setup.keepScore));
    } else if (name) {
      setMe({ id, name, isHost: false });
    } else {
      setNeedName(true);
    }
  }, [code]);

  // Connect to the room.
  useEffect(() => {
    if (!me) return;
    const t = connect(
      code,
      (m: Msg) => {
        if (me.isHost) {
          if (m.kind === "action") setState((s) => (s ? apply(s, m.action) : s));
          if (m.kind === "hello") setState((s) => (s ? { ...s } : s)); // re-send current state
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

  // Host: share the game state whenever it changes (and every few seconds, for late joiners).
  useEffect(() => {
    if (!me?.isHost || !state || !connected) return;
    transport.current?.send({ kind: "state", state });
    write("session", `magnets-state-${code}`, JSON.stringify(state));
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

  function act(action: Action) {
    if (!me) return;
    if (me.isHost) setState((s) => (s ? apply(s, action) : s));
    else transport.current?.send({ kind: "action", action });
  }
  const hostDo = (fn: (s: GameState) => GameState) => setState((s) => (s ? fn(s) : s));

  // My tiles for this round.
  const [tiles, setTiles] = useState<string[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const round = state?.round ?? 0;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- new tiles each round
    setTiles(dealTiles());
    setPicked([]);
  }, [round]);
  const answer = useMemo(() => picked.map((i) => tiles[i]), [picked, tiles]);

  if (needName) {
    return (
      <NameForm onDone={(name) => {
        write("local", NAME_KEY, name);
        setNeedName(false);
        setMe({ id: read("session", `magnets-id-${code}`) ?? makeId(), name, isHost: false });
      }} />
    );
  }

  if (!me || !state || !joined) {
    return (
      <div className="py-12 text-center">
        <p className="font-script text-3xl">Finding the fridge…</p>
        <p className="mt-2 text-sm text-ink-soft">
          Connecting to room {code}. If this takes a while, make sure the host has the game open.
        </p>
      </div>
    );
  }

  const isHost = me.isHost;
  const hostName = state.players.find((p) => p.id === state.hostId)?.name ?? "the host";
  const mySubmission = state.submitted[me.id];
  const waitingOn = state.players.filter((p) =>
    state.phase === "writing" ? !state.submitted[p.id] : state.phase === "reveal" ? !state.votes[p.id] : false);

  const scoreboard = state.keepScore && (
    <div className="mt-6 rounded-2xl bg-white/60 p-4 shadow-sm">
      <p className="mb-2 text-center font-title text-xs tracking-[0.2em] text-ink-soft uppercase">Scores</p>
      <ul className="space-y-1">
        {[...state.players].sort((a, b) => b.score - a.score).map((p) => (
          <li key={p.id} className="flex justify-between font-medium">
            <span>{p.name}</span><span>{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      {state.phase === "lobby" && (
        <>
          <Invite code={code} />
          <div className="mt-6 rounded-2xl bg-white/60 p-4 shadow-sm">
            <p className="mb-2 font-title text-xs tracking-[0.2em] text-ink-soft uppercase">Players</p>
            <ul className="space-y-1">
              {state.players.map((p) => (
                <li key={p.id}>🧲 {p.name}{p.id === state.hostId ? " (host)" : ""}{p.id === me.id ? " (you)" : ""}</li>
              ))}
            </ul>
          </div>
          {isHost ? (
            <div className="mt-6 flex flex-col gap-3">
              <label className="flex items-center justify-center gap-2 text-sm">
                <input type="checkbox" checked={state.keepScore} onChange={() => hostDo(host.toggleScore)} className="h-5 w-5 accent-[var(--lavender-deep)]" />
                Keep score
              </label>
              <button type="button" onClick={() => hostDo(host.startRound)}
                className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white">
                {state.round ? "Start next round" : "Start the game!"}
              </button>
              {state.players.length < 2 && <p className="text-center text-xs text-ink-soft">Waiting for friends to join…</p>}
            </div>
          ) : (
            <p className="mt-6 text-center">Waiting for {hostName} to start… ✨</p>
          )}
        </>
      )}

      {state.phase === "writing" && (
        <>
          <p className="text-center font-title text-xs tracking-[0.2em] text-ink-soft uppercase">Round {state.round}</p>
          <h2 className="mt-1 text-center text-xl font-semibold">{state.prompt}</h2>

          {mySubmission ? (
            <div className="mt-6 text-center">
              <p className="mb-2 text-sm text-ink-soft">Your answer:</p>
              <div className="flex justify-center"><Answer words={mySubmission} /></div>
              <p className="mt-4">Waiting for {waitingOn.map((p) => p.name).join(", ") || "everyone"}…</p>
              <button type="button" className="mt-2 text-sm underline" onClick={() => act({ type: "unsubmit", id: me.id })}>
                Change my answer
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4 min-h-24 rounded-2xl border-2 border-dashed border-line bg-white/40 p-3" aria-label="Your answer">
                {answer.length === 0 ? (
                  <p className="text-center text-sm text-ink-soft">Tap words below to build your answer</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {picked.map((ti, i) => (
                      <Tile key={ti} i={i} word={tiles[ti]} label={`Remove ${tiles[ti]}`}
                        onClick={() => setPicked((p) => p.filter((x) => x !== ti))} />
                    ))}
                  </div>
                )}
              </div>
              {answer.length > 0 && (
                <p className="mt-2 text-center text-sm italic text-ink-soft">&ldquo;{joinTiles(answer)}&rdquo;</p>
              )}
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={!answer.length} onClick={() => act({ type: "submit", id: me.id, words: answer })}
                  className="flex-1 rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white disabled:opacity-60">
                  Done!
                </button>
                <button type="button" onClick={() => setPicked([])} className="rounded-full border border-line bg-white px-4 py-3 text-sm">
                  Clear
                </button>
                <button type="button" onClick={() => { setTiles(dealTiles()); setPicked([]); }}
                  className="rounded-full border border-line bg-white px-4 py-3 text-sm">
                  New tiles
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-[#e9e6ee] p-3" aria-label="Word tiles">
                {tiles.map((w, i) =>
                  picked.includes(i) ? null : (
                    <Tile key={i} i={i} word={w} label={`Add ${w}`} onClick={() => setPicked((p) => [...p, i])} />
                  ),
                )}
              </div>
            </>
          )}

          {isHost && (
            <div className="mt-6 flex justify-center gap-4 text-sm">
              {Object.keys(state.submitted).length === 0 && (
                <button type="button" className="underline" onClick={() => hostDo(host.newPrompt)}>Skip this prompt</button>
              )}
              {Object.keys(state.submitted).length > 0 && (
                <button type="button" className="underline" onClick={() => hostDo(host.reveal)}>Reveal now</button>
              )}
            </div>
          )}
        </>
      )}

      {state.phase === "reveal" && (
        <>
          <h2 className="text-center text-xl font-semibold">{state.prompt}</h2>
          <p className="mt-1 text-center text-sm text-ink-soft">Read them out loud, dramatically. Then vote for your favorite!</p>
          <ul className="mt-5 space-y-4">
            {state.order.map((pid, i) => {
              const mine = pid === me.id;
              const myVote = state.votes[me.id];
              const blocked = mine && !canVoteForSelf(state);
              return (
                <li key={pid} className="rounded-2xl bg-white/60 p-4 shadow-sm">
                  <p className="mb-2 font-title text-xs tracking-[0.2em] text-ink-soft uppercase">
                    Answer {String.fromCharCode(65 + i)}{mine ? " (yours)" : ""}
                  </p>
                  <Answer words={state.submitted[pid] ?? []} />
                  {!blocked && (
                    <button type="button" onClick={() => act({ type: "vote", id: me.id, target: pid })}
                      className={`mt-3 rounded-full px-4 py-1.5 text-sm font-semibold ${
                        myVote === pid ? "bg-lavender-deep text-white" : "border border-line bg-white"
                      }`}>
                      {myVote === pid ? "Your vote ✓" : "Vote for this one"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {state.votes[me.id] && waitingOn.length > 0 && (
            <p className="mt-4 text-center text-sm">Waiting for {waitingOn.map((p) => p.name).join(", ")} to vote…</p>
          )}
          {isHost && (
            <p className="mt-4 text-center">
              <button type="button" className="text-sm underline" onClick={() => hostDo(host.results)}>Show results now</button>
            </p>
          )}
        </>
      )}

      {state.phase === "results" && (() => {
        const counts = voteCounts(state);
        const best = Math.max(0, ...Object.values(counts));
        return (
          <>
            <h2 className="text-center text-xl font-semibold">{state.prompt}</h2>
            <ul className="mt-5 space-y-4">
              {state.order.map((pid) => {
                const p = state.players.find((x) => x.id === pid);
                const n = counts[pid] ?? 0;
                const won = best > 0 && n === best;
                return (
                  <li key={pid} className={`rounded-2xl p-4 shadow-sm ${won ? "bg-lavender/50" : "bg-white/60"}`}>
                    <p className="mb-2 font-semibold">
                      {won ? "🏆 " : ""}{p?.name ?? "Someone"}
                      <span className="ml-2 text-sm font-normal text-ink-soft">{n} {n === 1 ? "vote" : "votes"}</span>
                    </p>
                    <Answer words={state.submitted[pid] ?? []} />
                  </li>
                );
              })}
            </ul>
            {scoreboard}
            {isHost ? (
              <div className="mt-6 flex flex-col gap-3">
                <button type="button" onClick={() => hostDo(host.startRound)}
                  className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white">
                  Next round
                </button>
                <label className="flex items-center justify-center gap-2 text-sm">
                  <input type="checkbox" checked={state.keepScore} onChange={() => hostDo(host.toggleScore)} className="h-5 w-5 accent-[var(--lavender-deep)]" />
                  Keep score
                </label>
                <button type="button" className="text-sm underline" onClick={() => hostDo(host.backToLobby)}>
                  Back to the lobby (invite more friends)
                </button>
              </div>
            ) : (
              <p className="mt-6 text-center">Waiting for {hostName} to start the next round…</p>
            )}
          </>
        );
      })()}

      {state.phase !== "results" && state.phase !== "lobby" && scoreboard}

      <p className="mt-10 text-center text-[11px] text-ink-soft">
        Inspired by the open-source fridgemagnets game by Luke Shafer (MIT license).
      </p>
    </div>
  );
}
