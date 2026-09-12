import { useEffect } from "react";

/**
 * Full-screen photo viewer for a room category's gallery -- opened from
 * RoomThumb (drawer hero, room picker cards). Escape/Arrow keys navigate;
 * clicking the backdrop closes, clicking the image or the prev/next
 * controls does not.
 */
export default function RoomPhotoLightbox({
  images,
  index,
  title,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  title?: string;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndexChange]);

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      {title && <p className="mb-3 font-display text-sm font-medium text-white/80">{title}</p>}
      <img
        src={images[index]}
        alt=""
        className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="mt-4 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
            className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            ‹ Prev
          </button>
          <span className="text-sm text-white/70">
            {index + 1} / {images.length}
          </span>
          <button
            onClick={() => onIndexChange((index + 1) % images.length)}
            className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            Next ›
          </button>
        </div>
      )}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        ✕
      </button>
    </div>
  );
}
