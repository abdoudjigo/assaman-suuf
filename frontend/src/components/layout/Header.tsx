import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Sprout,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";

const navLinks = [
  { label: "Accueil", to: "/", end: true },
  { label: "La plateforme", to: "/cartographie", end: false },
  { label: "Services", to: "/services", end: false },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="relative z-50 bg-emerald-950 text-white">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="flex min-h-[88px] items-center justify-between gap-4 border-b border-white/15 sm:gap-5">
          {/* Logo et identité de la marque */}
          <Link
            to="/"
            onClick={closeMenu}
            aria-label="Assaman-Suuf, accueil"
            className="flex shrink-0 items-center gap-2.5 sm:gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center text-lime-300 sm:h-11 sm:w-11">
              <Sprout size={39} strokeWidth={1.8} />
            </span>

            <span className="flex flex-col">
              <span className="text-base font-extrabold tracking-[0.04em] sm:text-xl">
                ASSAMAN-SUUF
              </span>

              <span className="mt-0.5 whitespace-nowrap text-[8px] font-medium tracking-[0.13em] text-white/75 sm:text-[10px] sm:tracking-[0.2em]">
                AGRICULTURE · CLIMAT · DONNÉES
              </span>
            </span>
          </Link>

          {/* Navigation principale */}
          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-xl lg:flex"
          >
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-all duration-200 xl:px-5",
                    isActive
                      ? "bg-lime-300 font-semibold text-emerald-950 shadow-sm"
                      : "font-medium text-white/85 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}

            <a
              href="#fonctionnalites"
              className="whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white xl:px-5"
            >
              Fonctionnalités
            </a>

            <a
              href="#notre-mission"
              className="whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white xl:px-5"
            >
              À propos
            </a>
          </nav>

          {/* Action principale et menu mobile */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/cartographie"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-3.5 py-3 text-xs font-semibold text-emerald-950 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-lime-200 sm:px-5 sm:text-sm"
            >
              <span className="sm:hidden">Explorer</span>
              <span className="hidden sm:inline">
                Explorer la plateforme
              </span>

              <ArrowUpRight
                size={17}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 lg:hidden"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Navigation mobile */}
        <div
          id="mobile-navigation"
          className={`grid transition-[grid-template-rows,opacity] duration-300 lg:hidden ${
            menuOpen
              ? "grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0"
          }`}
          aria-hidden={!menuOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <nav
              aria-label="Navigation mobile"
              className="space-y-1 py-4"
            >
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  tabIndex={menuOpen ? 0 : -1}
                  className={({ isActive }) =>
                    [
                      "flex items-center rounded-xl px-4 py-3.5 text-sm transition",
                      isActive
                        ? "bg-lime-300 font-semibold text-emerald-950"
                        : "text-white/85 hover:bg-white/10 hover:text-white",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <a
                href="#fonctionnalites"
                onClick={closeMenu}
                tabIndex={menuOpen ? 0 : -1}
                className="block rounded-xl px-4 py-3.5 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Fonctionnalités
              </a>

              <a
                href="#notre-mission"
                onClick={closeMenu}
                tabIndex={menuOpen ? 0 : -1}
                className="block rounded-xl px-4 py-3.5 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                À propos
              </a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;