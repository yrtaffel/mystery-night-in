"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ProgressRow = {
  card_number: number;
  scratched_at: string | null;
  completed_at: string | null;
  journal: string | null;
  photo_path: string | null;
};

type Fields = Partial<Omit<ProgressRow, "card_number">>;

const BUCKET = "photos";

const emptyRow = (card_number: number): ProgressRow => ({
  card_number, scratched_at: null, completed_at: null, journal: null, photo_path: null,
});
const DAY = 24 * 60 * 60 * 1000;
export const WEEK = 7 * DAY;

/** Days left in the gentle 1-week window (0 when the week is over). */
export function daysLeft(scratchedAt: string, now = Date.now()) {
  const remaining = new Date(scratchedAt).getTime() + WEEK - now;
  return remaining <= 0 ? 0 : Math.ceil(remaining / DAY);
}

/** Shrinks big phone photos before upload (saves space + makes pages fast). */
async function shrinkImage(file: File, maxSide = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file; // the browser couldn't read it; upload as-is
  }
}

/** Loads and saves this person's card progress, journal notes, and photos. */
export function useProgress() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Record<number, ProgressRow>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const signPhotos = useCallback(
    async (paths: string[]) => {
      if (!paths.length) return;
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 6);
      const next: Record<string, string> = {};
      for (const item of data ?? []) if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
      setPhotoUrls((u) => ({ ...u, ...next }));
    },
    [supabase],
  );

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? null);
      const { data, error } = await supabase
        .from("card_progress")
        .select("card_number, scratched_at, completed_at, journal, photo_path");
      if (error) {
        setProblem("Progress isn't saving right now. Changes may reset on refresh.");
      } else {
        const next: Record<number, ProgressRow> = {};
        for (const row of data ?? []) next[row.card_number] = row;
        setRows(next);
        await signPhotos((data ?? []).flatMap((r) => (r.photo_path ? [r.photo_path] : [])));
      }
      setLoaded(true);
    })();
  }, [supabase, signPhotos]);

  /** Saves some fields for one card (and updates the screen right away). */
  const save = useCallback(
    async (cardNumber: number, fields: Fields) => {
      setRows((r) => ({
        ...r,
        [cardNumber]: { ...emptyRow(cardNumber), ...r[cardNumber], ...fields },
      }));
      const { error } = await supabase.from("card_progress").upsert({
        user_id: userId ?? undefined,
        card_number: cardNumber,
        ...fields,
        updated_at: new Date().toISOString(),
      });
      if (error) setProblem("Hmm, that didn't save. Check your internet and try again?");
      return !error;
    },
    [supabase, userId],
  );

  const uploadPhoto = useCallback(
    async (cardNumber: number, file: File) => {
      if (!userId) return false;
      const blob = await shrinkImage(file);
      const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg");
      const path = `${userId}/card-${cardNumber}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: blob.type || file.type, upsert: false });
      if (error) {
        setProblem("That photo didn't upload. Try a different one, or try again later?");
        return false;
      }
      const old = rows[cardNumber]?.photo_path;
      await signPhotos([path]);
      const ok = await save(cardNumber, { photo_path: path });
      if (ok && old) await supabase.storage.from(BUCKET).remove([old]);
      return ok;
    },
    [supabase, userId, rows, save, signPhotos],
  );

  const removePhoto = useCallback(
    async (cardNumber: number) => {
      const old = rows[cardNumber]?.photo_path;
      const ok = await save(cardNumber, { photo_path: null });
      if (ok && old) await supabase.storage.from(BUCKET).remove([old]);
    },
    [supabase, rows, save],
  );

  return { rows, photoUrls, loaded, problem, save, uploadPhoto, removePhoto };
}
