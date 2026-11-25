"use client";

import { useEffect, useRef } from "react";

type Props = {
  url: string | null; // open when set
  caption?: string;
  onClose: () => void;
  children?: React.ReactNode; // optional extra buttons under the photo
};

/** Shows a photo full size (nothing cropped) in a pop-up. */
export default function PhotoLightbox({ url, caption, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (url && !d.open) d.showModal();
    if (!url && d.open) d.close();
  }, [url]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // tap outside the photo to close
      }}
      aria-label={caption ? `Photo: ${caption}` : "Photo"}
      className="m-auto max-h-[94dvh] w-[min(94vw,40rem)] overflow-visible bg-transparent p-0"
    >
      {url && (
        <div className="relative rounded-md bg-white p-2 pb-3 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-lg text-white shadow-md"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- private, signed photo URL */}
          <img src={url} alt={caption ?? ""} className="mx-auto max-h-[78dvh] w-auto max-w-full object-contain" />
          {caption && <p className="mt-2 text-center font-title text-sm tracking-wide">{caption}</p>}
          {children && <div className="mt-2 flex justify-center gap-4 text-sm">{children}</div>}
        </div>
      )}
    </dialog>
  );
}
