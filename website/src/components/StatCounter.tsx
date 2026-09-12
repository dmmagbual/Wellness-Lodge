import { useEffect, useRef, useState, type ReactNode } from "react";

/** Counts up from 0 to `value` once it scrolls into view. */
export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  label,
  icon,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1200;
        function tick(now: number) {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setN(Math.round(value * eased));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      {icon && (
        <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-emerald-200">
          {icon}
        </span>
      )}
      <p className="font-serif text-3xl font-bold text-white md:text-4xl">
        {prefix}
        {n.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1 text-xs font-medium tracking-wide text-emerald-200/80 uppercase">{label}</p>
    </div>
  );
}
