"use client";

import { useEffect, useRef, useState } from "react";
import trail from "../../content/trail.json";
import { tryUnlock, type Final, type Stop, type StopUnlocked } from "@/lib/trail";

const SAVE_KEY = "riddle-trail-answers";
const TOTAL = trail.stops;

type Solved = { stop: Stop; answer: string; letter: string };

function loadAnswers(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveAnswers(answers: string[]) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(answers));
  } catch {
    // private mode: progress just won't be remembered
  }
}

function AnswerBox({
  label, hint, onTry,
}: { label: string; hint: string; onTry: (answer: string) => Promise<boolean> }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [showHint, setShowHint] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setWrong(false);
    const ok = await onTry(value);
    setBusy(false);
    if (ok) setValue("");
    else setWrong(true);
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
      <label className="sr-only" htmlFor="trail-answer">{label}</label>
      <input
        id="trail-answer" value={value} onChange={(e) => setValue(e.target.value)}
        autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Your answer"
        className="rounded-lg border border-line bg-white/80 px-3 py-3 text-base"
      />
      <button disabled={busy || !value.trim()}
        className="rounded-full bg-lavender-deep px-4 py-3 font-semibold text-white disabled:opacity-60">
        {busy ? "Checking…" : "Unlock 🔓"}
      </button>
      <p aria-live="polite" className="min-h-5 text-center text-sm text-red-800">
        {wrong ? "Not quite. Try again!" : ""}
      </p>
      <button type="button" onClick={() => setShowHint((s) => !s)} className="text-sm text-ink-soft underline">
        {showHint ? "Hide the nudge" : "Need a nudge?"}
      </button>
      {showHint && <p className="rounded-lg bg-white/60 p-3 text-center text-sm">{hint}</p>}
    </form>
  );
}

export default function RiddleTrail() {
  const [solved, setSolved] = useState<Solved[]>([]);
  const [current, setCurrent] = useState<Stop | null>(trail.first as Stop);
  const [final, setFinal] = useState<Final | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const answers = useRef<string[]>([]);

  // Apply one correct answer and move forward. Returns false if wrong.
  async function advance(stop: Stop, answer: string, list: Solved[]) {
    const open = await tryUnlock<StopUnlocked>(stop.lock, answer);
    if (!open) return null;
    const nextList = [...list, { stop, answer, letter: open.letter }];
    return { open, nextList };
  }

  // Replay saved answers so she picks up where she left off.
  useEffect(() => {
    (async () => {
      const saved = loadAnswers();
      let stop: Stop | null = trail.first as Stop;
      let list: Solved[] = [];
      let fin: Final | null = null;
      let msg: string | null = null;
      const good: string[] = [];
      for (const answer of saved) {
        if (stop) {
          const step = await advance(stop, answer, list);
          if (!step) break;
          list = step.nextList;
          good.push(answer);
          stop = step.open.next ?? null;
          fin = step.open.final ?? null;
        } else if (fin) {
          const end = await tryUnlock<{ message: string }>(fin.lock, answer);
          if (end) {
            msg = end.message;
            good.push(answer);
          }
          break;
        }
      }
      answers.current = good;
      setSolved(list);
      setCurrent(stop);
      setFinal(fin);
      setMessage(msg);
      setReady(true);
    })();
  }, []);

  async function tryStop(answer: string) {
    if (!current) return false;
    const step = await advance(current, answer, solved);
    if (!step) return false;
    answers.current = [...answers.current, answer];
    saveAnswers(answers.current);
    setSolved(step.nextList);
    setCurrent(step.open.next ?? null);
    setFinal(step.open.final ?? null);
    return true;
  }

  async function tryFinal(answer: string) {
    if (!final) return false;
    const end = await tryUnlock<{ message: string }>(final.lock, answer);
    if (!end) return false;
    answers.current = [...answers.current, answer];
    saveAnswers(answers.current);
    setMessage(end.message);
    return true;
  }

  function startOver() {
    if (!window.confirm("Start the whole trail over?")) return;
    saveAnswers([]);
    answers.current = [];
    setSolved([]);
    setCurrent(trail.first as Stop);
    setFinal(null);
    setMessage(null);
  }

  if (!ready) return <p className="py-16 text-center font-script text-3xl">Warming up the time machine…</p>;

  const letters = solved.map((s) => s.letter);

  return (
    <div>
      <p className="mx-auto max-w-sm text-center text-sm text-ink-soft">
        Hop through time, one stop at a time. Each answer unlocks the next stop and gives you a secret
        letter. Only the final password opens the last door. Searching online is encouraged!
      </p>

      {/* progress dots */}
      <ol className="my-6 flex justify-center gap-2" aria-label="Trail progress">
        {Array.from({ length: TOTAL + 1 }, (_, i) => {
          const done = i < solved.length || (i === TOTAL && message);
          const here = i === solved.length && !message;
          return (
            <li key={i}
              className={`h-3 w-3 rounded-full ${done ? "bg-lavender-deep" : here ? "bg-lavender" : "bg-white/80"}`}
              aria-label={i === TOTAL ? "Final door" : `Stop ${i + 1}${done ? ", solved" : ""}`} />
          );
        })}
      </ol>

      {/* letters collected */}
      {letters.length > 0 && (
        <div className="mb-6 text-center">
          <p className="font-title text-xs tracking-[0.2em] text-ink-soft uppercase">Your secret letters</p>
          <p className="mt-1 flex justify-center gap-2">
            {letters.map((l, i) => (
              <span key={i} className="flex h-9 w-9 items-center justify-center rounded-md bg-white font-title text-xl shadow-sm">
                {l}
              </span>
            ))}
          </p>
        </div>
      )}

      {current && (
        <section className="rounded-2xl bg-white/60 p-5 shadow-sm" aria-labelledby="stop-title">
          <p className="font-title text-xs tracking-[0.2em] text-lavender-deep uppercase">
            Stop {current.n} of {TOTAL}
          </p>
          <h2 id="stop-title" className="font-title text-2xl font-semibold tracking-wide">
            {current.era} · {current.place}
          </h2>
          <p className="mt-3">{current.riddle}</p>
          <AnswerBox key={current.n} label={`Answer for stop ${current.n}`} hint={current.hint} onTry={tryStop} />
        </section>
      )}

      {!current && final && !message && (
        <section className="rounded-2xl bg-white/60 p-5 shadow-sm" aria-labelledby="final-title">
          <p className="font-title text-xs tracking-[0.2em] text-lavender-deep uppercase">The final door</p>
          <h2 id="final-title" className="font-script text-4xl">Almost there!</h2>
          <p className="mt-2">{final.prompt}</p>
          <AnswerBox key="final" label="Final password" hint={final.hint} onTry={tryFinal} />
        </section>
      )}

      {message && (
        <section className="rounded-2xl bg-white/70 p-8 text-center shadow-md" aria-live="polite">
          <p className="text-5xl" aria-hidden="true">🎉</p>
          <h2 className="mt-2 font-script text-5xl">
            <span className="swoosh">You did it!</span>
          </h2>
          <p className="mt-4 text-lg font-medium">{message}</p>
          <p className="mt-4 text-sm text-ink-soft">
            Don&apos;t forget to tap &quot;Adventure complete!&quot; on the card. 💜
          </p>
        </section>
      )}

      {solved.length > 0 && (
        <p className="mt-8 text-center">
          <button type="button" onClick={startOver} className="text-xs text-ink-soft underline">
            Start the trail over
          </button>
        </p>
      )}
    </div>
  );
}
