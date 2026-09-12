/**
 * Small hand-drawn outline icon set (no icon library dependency -- this repo
 * has no network access guarantee at build time on the front-desk machine,
 * so everything stays hand-rolled SVG rather than pulling in lucide-react or
 * similar). Deliberately generic/geometric shapes, sized to sit inside the
 * StatCard icon badge. All accept a className for sizing/color via
 * currentColor.
 */
import type { SVGProps } from "react";

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function IconArrival(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
      <path d="M9 15l2.5 2.5L15.5 13" />
    </Base>
  );
}

export function IconDeparture(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
      <path d="M9.5 13.5h6M13 11l2.5 2.5L13 16" />
    </Base>
  );
}

export function IconBed(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
      <path d="M3 17h18" />
      <path d="M3 19v2M21 19v2" />
      <path d="M6 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3" />
    </Base>
  );
}

export function IconAlert(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconReceiptX(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
      <path d="M9.5 10.5l3 3M12.5 10.5l-3 3" />
    </Base>
  );
}

export function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </Base>
  );
}

export function IconRefund(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 12a8 8 0 1 1 2.5 5.8" />
      <path d="M4 12V7M4 12h5" />
    </Base>
  );
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </Base>
  );
}

export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </Base>
  );
}
