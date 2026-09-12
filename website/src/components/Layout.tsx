import { Link, Outlet, useLocation } from "react-router-dom";
import logo from "@/assets/logo.webp";

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
            <Link to="/" className="flex items-center">
              <img src={logo} alt="The Wellness Lodge" className="h-12 w-auto" />
            </Link>
            <Link
              to="/book"
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Book Now
            </Link>
          </div>

          <Link to="/" className="hidden items-center justify-center sm:flex">
            <img src={logo} alt="The Wellness Lodge" className="h-20 w-auto" />
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

      <footer className="mt-16 bg-[#06170f] text-emerald-100/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <img src={logo} alt="The Wellness Lodge" className="h-14 w-auto brightness-0 invert" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Comfortable lodging, car rental, function hall and event hire in Papua New Guinea.
              Rest. Recharge. Reconnect.
            </p>
            <div className="mt-5 flex gap-3">
              {["facebook", "instagram"].map((s) => (
                <span
                  key={s}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-emerald-200/70"
                  aria-hidden="true"
                >
                  {s === "facebook" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8.5H16l.5-3.2h-3V7.2c0-.9.3-1.5 1.6-1.5H16.6V2.8C16.3 2.8 15.3 2.7 14.2 2.7c-2.3 0-3.9 1.4-3.9 4v2.6H7.8v3.2h2.5V21h3.2Z"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>
                  )}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Explore</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Lodge desk</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>Contact details: to be confirmed</li>
              <li>All rates shown in PGK (Kina)</li>
              <li>
                <Link to="/policies" className="transition hover:text-white">
                  Policies &amp; FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-emerald-200/60 md:flex-row md:items-center md:justify-between">
            <p>&copy; {year} Wellness Lodge. All rights reserved.</p>
            <p>Payments by bank transfer or pay at front desk.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
