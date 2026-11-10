import data from "../../content/magnets.json";

export type Phase = "lobby" | "writing" | "reveal" | "results";
export type Player = { id: string; name: string; score: number };

export type GameState = {
  v: number; // bumps on every change, so stale updates are ignored
  hostId: string;
  phase: Phase;
  round: number;
  prompt: string;
  usedPrompts: number[];
  players: Player[];
  submitted: Record<string, string[]>;
  votes: Record<string, string>; // voter -> whose answer
  order: string[]; // reveal order (shuffled, so answers are anonymous)
  keepScore: boolean;
  timerSec: number; // 0 = no timer
  deadline: number | null; // when this round's timer runs out (ms)
};

export type Action =
  | { type: "join"; id: string; name: string }
  | { type: "submit"; id: string; words: string[] }
  | { type: "unsubmit"; id: string }
  | { type: "vote"; id: string; target: string };

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Short, easy-to-read room code (no 0/O or 1/I mix-ups). */
export function makeCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  return Array.from({ length: 4 }, () => pick([...letters])).join("") +
    Array.from({ length: 2 }, () => pick([...digits])).join("");
}

export const makeId = () => Math.random().toString(36).slice(2, 10);

/** A few extra tiles when the pile isn't cutting it. */
export function moreTiles(count = 10): string[] {
  const fn = shuffle(data.functionWords).slice(0, 3);
  const rest = shuffle(data.words.filter((w) => !data.functionWords.includes(w))).slice(0, count - 4);
  return shuffle([...fn, ...rest, pick(data.suffixes)]);
}

/** A fresh pile of word tiles for one player. */
export function dealTiles(): string[] {
  const fn = shuffle(data.functionWords).slice(0, 14);
  const rest = shuffle(data.words.filter((w) => !data.functionWords.includes(w))).slice(0, 30);
  const suffixes = shuffle(data.suffixes).slice(0, 4);
  const punct = shuffle(data.punctuation).slice(0, 3);
  return shuffle([...fn, ...rest, ...suffixes, ...punct]);
}

/** Joins tiles into a sentence: "-ing" sticks to the word before, punctuation too. */
export function joinTiles(words: string[]) {
  let out = "";
  for (const w of words) {
    if (w.startsWith("-")) out += w.slice(1);
    else if ([",", "!", "?", ".", "..."].includes(w)) out += w;
    else out += (out ? " " : "") + w;
  }
  return out;
}

export function newGame(hostId: string, hostName: string, keepScore: boolean): GameState {
  return {
    v: 1, hostId, phase: "lobby", round: 0, prompt: "", usedPrompts: [],
    players: [{ id: hostId, name: hostName, score: 0 }],
    submitted: {}, votes: {}, order: [], keepScore, timerSec: 0, deadline: null,
  };
}

function nextPrompt(s: GameState) {
  const all = data.prompts.map((_, i) => i);
  let left = all.filter((i) => !s.usedPrompts.includes(i));
  if (!left.length) left = all;
  const i = pick(left);
  return { prompt: data.prompts[i], usedPrompts: [...(left === all ? [] : s.usedPrompts), i] };
}

export const canVoteForSelf = (s: GameState) => s.players.length < 3;

function tally(s: GameState) {
  const counts: Record<string, number> = {};
  for (const target of Object.values(s.votes)) counts[target] = (counts[target] ?? 0) + 1;
  return counts;
}
export const voteCounts = tally;

/** Host-only moves. */
export const host = {
  startRound(s: GameState): GameState {
    const deadline = s.timerSec ? Date.now() + s.timerSec * 1000 : null;
    return { ...s, v: s.v + 1, phase: "writing", round: s.round + 1, ...nextPrompt(s), submitted: {}, votes: {}, order: [], deadline };
  },
  newPrompt(s: GameState): GameState {
    const deadline = s.timerSec ? Date.now() + s.timerSec * 1000 : null;
    return { ...s, v: s.v + 1, ...nextPrompt(s), deadline };
  },
  setTimer(s: GameState, sec: number): GameState {
    return { ...s, v: s.v + 1, timerSec: sec };
  },
  reveal(s: GameState): GameState {
    return { ...s, v: s.v + 1, phase: "reveal", order: shuffle(Object.keys(s.submitted)), deadline: null };
  },
  results(s: GameState): GameState {
    const counts = tally(s);
    const players = s.keepScore
      ? s.players.map((p) => ({ ...p, score: p.score + (counts[p.id] ?? 0) }))
      : s.players;
    return { ...s, v: s.v + 1, phase: "results", players };
  },
  toggleScore(s: GameState): GameState {
    return { ...s, v: s.v + 1, keepScore: !s.keepScore };
  },
  backToLobby(s: GameState): GameState {
    return { ...s, v: s.v + 1, phase: "lobby", submitted: {}, votes: {}, order: [] };
  },
};

/** Applies a player's action on the host. Moves forward automatically when everyone's ready. */
export function apply(s: GameState, a: Action): GameState {
  let next = s;
  if (a.type === "join") {
    const name = a.name.trim().slice(0, 20) || "Guest";
    const exists = s.players.find((p) => p.id === a.id);
    if (exists && exists.name === name) return s;
    next = {
      ...s,
      players: exists
        ? s.players.map((p) => (p.id === a.id ? { ...p, name } : p))
        : [...s.players, { id: a.id, name, score: 0 }],
    };
  } else if (a.type === "submit" && s.phase === "writing") {
    next = { ...s, submitted: { ...s.submitted, [a.id]: a.words.slice(0, 40) } };
  } else if (a.type === "unsubmit" && s.phase === "writing") {
    const submitted = { ...s.submitted };
    delete submitted[a.id];
    next = { ...s, submitted };
  } else if (a.type === "vote" && s.phase === "reveal") {
    if (a.target === a.id && !canVoteForSelf(s)) return s;
    next = { ...s, votes: { ...s.votes, [a.id]: a.target } };
  } else {
    return s;
  }
  next = { ...next, v: s.v + 1 };

  const everyone = next.players.map((p) => p.id);
  if (next.phase === "writing" && everyone.every((id) => next.submitted[id])) next = host.reveal(next);
  else if (next.phase === "reveal" && everyone.every((id) => next.votes[id])) next = host.results(next);
  return next;
}
