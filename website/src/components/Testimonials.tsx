import { useEffect, useState } from "react";
import { SampleTag } from "./ui";

export interface Testimonial {
  quote: string;
  name: string;
  detail: string;
  rating: number; // 1-5
}

/** SAMPLE CONTENT — replace with real guest reviews once the lodge has them. */
export const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    quote: "The kind of quiet you don't realise you needed. We're already planning our next stay.",
    name: "Grace M.",
    detail: "Family Suite · Port Moresby",
    rating: 5,
  },
  {
    quote: "Our wedding reception was better than we imagined — the events team handled everything.",
    name: "Daniel & Ruth K.",
    detail: "Full-Day Wedding Package",
    rating: 5,
  },
  {
    quote: "Comfortable rooms, genuinely good food, and the car rental made the whole trip easy.",
    name: "Peter T.",
    detail: "Deluxe Room · Business trip",
    rating: 5,
  },
  {
    quote: "Booked by bank transfer, front desk confirmed it same day. Smooth from start to finish.",
    name: "Amelia S.",
    detail: "Garden View Room",
    rating: 4,
  },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < n ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.6L12 17l-5.9 3.4 1.3-6.6-4.9-4.5 6.6-.7L12 2.5Z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({ items = SAMPLE_TESTIMONIALS }: { items?: Testimonial[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  const t = items[index];

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="flex justify-center">
        <SampleTag />
      </div>
      <div className="relative mt-6 min-h-[168px] sm:min-h-[140px]">
        <div key={index} className="animate-[fadein_0.5s_ease]">
          <Stars n={t.rating} />
          <p className="mt-4 font-serif text-xl leading-relaxed text-stone-800 italic sm:text-2xl">
            &ldquo;{t.quote}&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold text-stone-900">{t.name}</p>
          <p className="text-xs text-stone-500">{t.detail}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Show testimonial ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-emerald-700" : "w-2 bg-stone-300 hover:bg-stone-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
