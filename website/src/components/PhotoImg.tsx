import { useState } from "react";

/**
 * <img> with a soft shimmer while loading and a graceful fallback if the
 * source fails (dead link, offline, etc.) — never shows a broken-image icon.
 */
export default function PhotoImg({
  src,
  alt,
  className = "",
  imgClassName = "",
  ratio,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  ratio?: string; // e.g. "aspect-[4/3]"
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${ratio ?? ""} ${className}`}>
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-stone-100 via-stone-200 to-stone-100" />
      )}
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-100 text-emerald-700">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-all duration-700 ${
            loaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-sm"
          } ${imgClassName}`}
        />
      )}
    </div>
  );
}
