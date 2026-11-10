"use client";

import { createClient } from "@/lib/supabase/client";
export type Transport<M = unknown> = { send: (msg: M) => void; close: () => void };

/**
 * Live connection for one game room (Fridge Magnets, Would You Rather). Uses Supabase Realtime broadcast,
 * so guests don't need an account. (In local development, `?localtest`
 * uses the browser's own tab-to-tab channel instead, for testing.)
 */
export function connect<M>(room: string, onMsg: (m: M) => void, onReady: () => void): Transport<M> {
  let local = false;
  if (process.env.NODE_ENV === "development") {
    try {
      local = new URLSearchParams(window.location.search).has("localtest") || !!localStorage.getItem("magnets-localtest");
    } catch {
      // ignore
    }
  }

  if (local) {
    const bc = new BroadcastChannel(room);
    bc.onmessage = (e) => onMsg(e.data as M);
    setTimeout(onReady, 0);
    return { send: (m) => bc.postMessage(m), close: () => bc.close() };
  }

  const supabase = createClient();
  const channel = supabase.channel(room, { config: { broadcast: { self: false } } });
  channel
    .on("broadcast", { event: "msg" }, ({ payload }) => onMsg(payload as M))
    .subscribe((status) => {
      if (status === "SUBSCRIBED") onReady();
    });
  return {
    send: (m) => void channel.send({ type: "broadcast", event: "msg", payload: m }),
    close: () => void supabase.removeChannel(channel),
  };
}
