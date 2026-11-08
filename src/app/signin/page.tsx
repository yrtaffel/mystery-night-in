"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Sign-in: she types her email, gets an email with a link AND a 6-digit code.
// The code is the backup for phones, where links sometimes open in the wrong browser.
export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        // Only pre-added people (Atara + Yehudit) can sign in.
        shouldCreateUser: false,
      },
    });
    setBusy(false);
    if (error) setMessage(`Hmm, that didn't work. (${error.message})`);
    else setStep("code");
  }

  async function checkCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setMessage(`That code didn't work. Try again, or request a new email. (${error.message})`);
    else router.replace("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-center text-3xl font-bold">Atara&apos;s Mystery Night In</h1>
      <p className="text-center">Unknown adventure awaits!</p>

      {step === "email" ? (
        <form onSubmit={sendEmail} className="flex flex-col gap-3">
          <label htmlFor="email">Your email</label>
          <input
            id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border px-3 py-3 text-base"
          />
          <button disabled={busy} className="rounded bg-purple-400 px-4 py-3 font-bold text-white">
            {busy ? "Sending…" : "Send my magic link"}
          </button>
        </form>
      ) : (
        <form onSubmit={checkCode} className="flex flex-col gap-3">
          <p>Check your email! Tap the link, or type the code here:</p>
          <input
            inputMode="numeric" autoComplete="one-time-code" value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded border px-3 py-3 text-center text-2xl tracking-widest"
          />
          <button disabled={busy} className="rounded bg-purple-400 px-4 py-3 font-bold text-white">
            {busy ? "Checking…" : "Let me in"}
          </button>
          <button type="button" onClick={() => setStep("email")} className="text-sm underline">
            Use a different email
          </button>
        </form>
      )}

      {message && <p role="alert" className="text-center text-red-700">{message}</p>}
    </main>
  );
}
