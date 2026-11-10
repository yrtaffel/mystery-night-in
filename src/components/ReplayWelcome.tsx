"use client";

import { useState } from "react";
import BirthdayWelcome from "./BirthdayWelcome";

export default function ReplayWelcome() {
  const [signal, setSignal] = useState(0);
  return (
    <div className="mt-12 text-center">
      <button type="button" onClick={() => setSignal((n) => n + 1)} className="text-sm text-ink-soft underline">
        See the birthday message again 🎂
      </button>
      <BirthdayWelcome auto={false} openSignal={signal} />
    </div>
  );
}
