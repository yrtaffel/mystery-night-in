"use client";

import { createClient } from "@/lib/supabase/client";
import type { Action, GameState } from "@/lib/magnets";

export type Msg = { kind: "action"; action: Action } | { kind: "state"; state: GameState } | { kind: "hello" };

export type Transport = { send: (msg: Msg) => void; close: () => void };

/**
 * Live connection for one game room. Uses Supabase Realtime broadcast,
 * so guests don't need an account. (In local development, `?localtest`
 * uses the browser's own tab-to-tab channel instead, for testing.)
 */
export function connect(code: string, onMsg: (m: Msg) => void, onReady: () => void): Transport {
  let local = false;
  if (process.env.NODE_ENV === "development") {
    try {
      local = new URLSearchParams(window.location.search).has("localtest") || !!localStorage.getItem("magnets-localtest");
    } catch {
      // ignore
    }
  }

  if (local) {
    const bc = new BroadcastChannel(`magnets-${code}`);
    bc.onmessage = (e) => onMsg(e.data as Msg);
    setTimeout(onReady, 0);
    return { send: (m) => bc.postMessage(m), close: () => bc.close() };
  }

  const supabase = createClient();
  const channel = supabase.channel(`magnets-${code}`, { config: { broadcast: { self: false } } });
  channel
    .on("broadcast", { event: "msg" }, ({ payload }) => onMsg(payload as Msg))
    .subscribe((status) => {
      if (status === "SUBSCRIBED") onReady();
    });
  return {
    send: (m) => void channel.send({ type: "broadcast", event: "msg", payload: m }),
    close: () => void supabase.removeChannel(channel),
  };
}
