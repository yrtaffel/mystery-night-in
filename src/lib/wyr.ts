import data from "../../content/wyr.json";

export const QUESTIONS = data.questions;
export const FIRST_BATCH = 10;
export const MORE_BATCH = 5;
export const RESULT_SECONDS = 5; // how long everyone sees the votes before moving on

export type Choice = "a" | "b";
export type Phase = "lobby" | "question" | "result" | "more" | "done";
export type WyrPlayer = { id: string; name: string };

export type WyrState = {
  v: number;
  hostId: string;
  phase: Phase;
  players: WyrPlayer[];
  deck: number[]; // shuffled question numbers still to come
  current: number | null;
  asked: number;
  target: number; // how many questions this session (10, then +5 at a time)
  votes: Record<string, Choice>;
  resultAt: number | null; // when the votes were all in (ms)
};

export type WyrAction =
  | { type: "join"; id: string; name: string }
  | { type: "vote"; id: string; choice: Choice }
  | { type: "next" }
  | { type: "more"; yes: boolean };

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newWyr(hostId: string, hostName: string): WyrState {
  return {
    v: 1, hostId, phase: "lobby", players: [{ id: hostId, name: hostName }],
    deck: shuffle(QUESTIONS.map((_, i) => i)), current: null, asked: 0, target: FIRST_BATCH,
    votes: {}, resultAt: null,
  };
}

function nextQuestion(s: WyrState): WyrState {
  const deck = s.deck.length ? s.deck : shuffle(QUESTIONS.map((_, i) => i));
  return {
    ...s, phase: "question", current: deck[0], deck: deck.slice(1),
    asked: s.asked + 1, votes: {}, resultAt: null,
  };
}

export const startWyr = (s: WyrState): WyrState => ({ ...nextQuestion(s), v: s.v + 1 });

/** After the votes are shown: next question, or ask about 5 more. */
function advance(s: WyrState): WyrState {
  if (s.asked >= s.target) return { ...s, phase: "more", votes: {}, resultAt: null };
  return nextQuestion(s);
}

/** Runs on the host for everyone's taps. */
export function applyWyr(s: WyrState, a: WyrAction): WyrState {
  let next = s;
  if (a.type === "join") {
    const name = a.name.trim().slice(0, 20) || "Guest";
    const existing = s.players.find((p) => p.id === a.id);
    if (existing && existing.name === name) return s;
    next = {
      ...s,
      players: existing
        ? s.players.map((p) => (p.id === a.id ? { ...p, name } : p))
        : [...s.players, { id: a.id, name }],
    };
  } else if (a.type === "vote" && s.phase === "question") {
    next = { ...s, votes: { ...s.votes, [a.id]: a.choice } };
    if (next.players.every((p) => next.votes[p.id])) next = { ...next, phase: "result", resultAt: Date.now() };
  } else if (a.type === "next" && s.phase === "result") {
    next = advance(s);
  } else if (a.type === "more" && s.phase === "more") {
    next = a.yes ? nextQuestion({ ...s, target: s.target + MORE_BATCH }) : { ...s, phase: "done" };
  } else {
    return s;
  }
  return { ...next, v: s.v + 1 };
}
