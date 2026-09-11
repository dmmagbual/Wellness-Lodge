import { Link, Outlet, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms & Rates" },
  { href: "/services", label: "Services" },
  { href: "/past-events", label: "Past Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const SERVICE_PATHS = ["/car-rental", "/function-hall", "/restaurant-cafe"];

const FOOTER_LINKS = [
  { href: "/rooms", label: "Rooms & Rates" },
  { href: "/car-rental", label: "Car Rental" },
  { href: "/function-hall", label: "Function Hall" },
  { href: "/restaurant-cafe", label: "Restaurant & Cafe" },
  { href: "/past-events", label: "Past Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function LeafMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-emerald-700">
      <path d="M12 3C7 7 4.5 11 4.5 15a7.5 7.5 0 0 0 15 0c0-4-2.5-8-7.5-12Z" fill="currentColor" opacity="0.9" />
      <path d="M12 8v11M12 12l-3.2-2M12 14.5l3.2-2" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function NavItem({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      to={href}
      className={`relative whitespace-nowrap px-1 py-1 text-sm font-medium tracking-wide transition-colors ${
        isActive ? "text-stone-900" : "text-stone-500 hover:text-stone-900"
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-1 left-0 h-px w-full bg-stone-900 transition-opacity ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
    </Link>
  );
}

export default function Layout() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 antialiased flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-emerald-700 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <Link to="/" className="flex items-center gap-2">
              <LeafMark />
              <span className="font-serif text-lg font-semibold tracking-tight">Wellness Lodge</span>
            </Link>
            <Link
              to="/book"
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Book Now
            </Link>
          </div>

          <Link to="/" className="hidden items-center justify-center gap-2.5 sm:flex">
            <LeafMark />
            <span className="font-serif text-2xl font-semibold tracking-tight">Wellness Lodge</span>
          </Link>

          <nav
            className="mt-3 hidden items-center justify-center gap-8 sm:flex"
            aria-label="Primary"
          >
            {NAV_LINKS.map((l) => {
              const isActive =
                l.href === "/"
                  ? pathname === "/"
                  : pathname === l.href || (l.href === "/services" && SERVICE_PATHS.includes(pathname));
              return <NavItem key={l.href} href={l.href} label={l.label} isActive={isActive} />;
            })}
            <span className="h-4 w-px bg-stone-200" />
            <Link
              to="/booking-lookup"
              className="text-sm font-medium whitespace-nowrap text-stone-500 hover:text-stone-900"
            >
              Find my booking
            </Link>
            <Link
              to="/book"
              className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Book Now
            </Link>
          </nav>
        </div>

        <nav className="flex gap-4 overflow-x-auto border-t border-stone-100 px-4 py-2.5 sm:hidden" aria-label="Primary mobile">
          {NAV_LINKS.map((l) => {
            const isActive =
              l.href === "/"
                ? pathname === "/"
                : pathname === l.href || (l.href === "/services" && SERVICE_PATHS.includes(pathname));
            return <NavItem key={l.href} href={l.href} label={l.label} isActive={isActive} />;
          })}
        </nav>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <LeafMark />
              <p className="font-serif text-lg font-semibold">Wellness Lodge</p>
            </div>
            <p className="mt-2 max-w-sm text-sm text-stone-600">
              Comfortable lodging, car rental, function hall and event hire in Papua New Guinea.
              Rest. Recharge. Reconnect.
            </p>
          </div>
          <div>
            <p className="font-semibold">Explore</p>
            <ul className="mt-2 space-y-1 text-sm">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-stone-600 hover:text-emerald-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Lodge desk</p>
            <ul className="mt-2 space-y-1 text-sm text-stone-600">
              <li>Contact details: to be confirmed</li>
              <li>All rates shown in PGK (Kina)</li>
              <li>
                <Link to="/policies" className="hover:text-emerald-700">
                  Policies &amp; FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-100">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-stone-500 md:flex-row md:items-center md:justify-between">
            <p>&copy; {year} Wellness Lodge. All rights reserved.</p>
            <p>Payments by bank transfer or pay at front desk.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
