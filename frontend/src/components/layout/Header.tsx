
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Sprout, Menu, X, ArrowUpRight } from "lucide-react";

const navLinks = [
  { label: "Accueil", to: "/" },
  { label: "Nos services", to: "/services" },
  { label: "Cartographie", to: "/cartographie" },
  { label: "Données & prévisions", to: "/forecasts" },
  { label: "À propos", to: "/about" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-3"
          aria-label="Assaman-Suuf, accueil"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-800 text-white">
            <Sprout size={27} strokeWidth={1.8} />
          </span>

          <span className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-emerald-900 sm:text-xl">
              ASSAMAN-SUUF
            </span>
            <span className="text-[9px] font-semibold tracking-[0.16em] text-gray-500 sm:text-[10px]">
              AGRICULTURE · CLIMAT · DONNÉES
            </span>
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-6 lg:flex xl:gap-8"
        >
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap text-sm font-medium transition ${
                  isActive
                    ? "text-emerald-800"
                    : "text-gray-600 hover:text-emerald-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Boutons */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link
            to="/connexion"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Se connecter
          </Link>

          <Link
            to="/cartographie"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
          >
            Explorer la plateforme
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* Bouton menu mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 lg:hidden"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation mobile */}
      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Navigation mobile"
          className="border-t border-gray-100 bg-white px-4 py-4 shadow-lg lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-emerald-50 text-emerald-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              to="/connexion"
              onClick={closeMenu}
              className="mt-2 rounded-lg border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700"
            >
              Se connecter
            </Link>

            <Link
              to="/cartographie"
              onClick={closeMenu}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white"
            >
              Explorer la plateforme
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
