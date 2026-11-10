// Unlocks Riddle Trail stops in the browser. Each stop is encrypted with the
// previous answer, so a wrong answer simply can't open it.

export type Lock = { salt: string; iterations: number; variants: { iv: string; ct: string }[] };
export type Stop = { n: number; era: string; place: string; riddle: string; hint: string; lock: Lock };
export type Final = { prompt: string; hint: string; lock: Lock };
export type StopUnlocked = { letter: string; next?: Stop; final?: Final };

export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Tries an answer. Returns what's behind the lock, or null if it's wrong. */
export async function tryUnlock<T>(lock: Lock, answer: string): Promise<T | null> {
  const pw = new TextEncoder().encode(normalize(answer));
  if (!pw.length) return null;
  const base = await crypto.subtle.importKey("raw", pw, "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64(lock.salt), iterations: lock.iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  for (const v of lock.variants) {
    try {
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(v.iv) }, key, fromB64(v.ct));
      return JSON.parse(new TextDecoder().decode(plain)) as T;
    } catch {
      // not this one
    }
  }
  return null;
}
