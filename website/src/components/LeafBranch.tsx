/**
 * Decorative botanical branch illustration used on the homepage hero.
 * Hand-drawn SVG (no external asset/library) so it stays crisp at any size
 * and costs nothing to host. Purely decorative — hidden from assistive tech.
 */
export default function LeafBranch({ className = "" }: { className?: string }) {
  const leaf = (cx: number, cy: number, rot: number, scale: number) => (
    <path
      d="M0 0C-14 -6 -22 -20 -18 -34C-14 -48 -2 -56 0 -58C2 -56 14 -48 18 -34C22 -20 14 -6 0 0Z"
      transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${scale})`}
      fill="url(#leafGradient)"
    />
  );

  return (
    <svg
      viewBox="0 0 220 420"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="leafGradient" x1="0" y1="-58" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d9f2d1" stopOpacity="0.95" />
          <stop offset="1" stopColor="#6fa66a" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="stemGradient" x1="110" y1="10" x2="110" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fbf88" />
          <stop offset="1" stopColor="#4f7a4a" />
        </linearGradient>
      </defs>

      <path
        d="M110 15C118 90 96 160 108 230C118 300 100 350 112 408"
        stroke="url(#stemGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {leaf(88, 70, -35, 0.6)}
      {leaf(130, 95, 40, 0.68)}
      {leaf(84, 140, -32, 0.78)}
      {leaf(134, 168, 38, 0.85)}
      {leaf(86, 210, -30, 0.95)}
      {leaf(132, 245, 36, 1)}
      {leaf(90, 280, -28, 1.05)}
      {leaf(128, 320, 34, 1.05)}
      {leaf(96, 355, -26, 1.1)}
      {leaf(120, 395, 30, 1.1)}
    </svg>
  );
}
