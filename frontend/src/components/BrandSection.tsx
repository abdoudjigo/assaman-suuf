import { Link } from "react-router-dom";
import {
  Sprout,
  ArrowRight,
  ArrowUpRight,
  MapPinned,
  CloudRain,
  Satellite,
  Thermometer,
  Leaf,
  Play,
  Droplets,
  TrendingUp,
} from "lucide-react";

function BrandSection() {
  return (
    <section className="relative isolate min-h-[720px] overflow-hidden bg-[#062d24] text-white sm:min-h-[780px]">
      {/* Image de fond : à placer dans public/images/assaman-suuf_hero.jpg */}
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/assaman-suuf_hero.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
      </div>

      {/* Voile sombre pour garantir la lisibilité */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#031e19]/95 via-[#062d24]/70 to-[#062d24]/15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[#031b14]/90 via-transparent to-[#062d24]/35"
      />

      {/* Décoration lumineuse */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-24 -z-10 h-96 w-96 rounded-full bg-emerald-400/15 blur-[100px]"
      />

      {/* Navigation visuelle de la marque */}
      {/* <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <div className="flex min-h-[88px] items-center justify-between gap-5 border-b border-white/15">
          <Link
            to="/"
            aria-label="Assaman-Suuf, accueil"
            className="flex shrink-0 items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center text-lime-300">
              <Sprout size={39} strokeWidth={1.8} />
            </span>

            <span className="flex flex-col">
              <span className="text-lg font-extrabold tracking-[0.04em] sm:text-xl">
                ASSAMAN-SUUF
              </span>
              <span className="mt-0.5 text-[9px] font-medium tracking-[0.2em] text-white/75 sm:text-[10px]">
                AGRICULTURE · CLIMAT · DONNÉES
              </span>
            </span>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-xl lg:flex"
          >
            <Link
              to="/"
              className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-emerald-950"
            >
              Accueil
            </Link>
            <Link
              to="/cartographie"
              className="rounded-full px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              La plateforme
            </Link>
            <Link
              to="/services"
              className="rounded-full px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Services
            </Link>
            <a
              href="#fonctionnalites"
              className="rounded-full px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Fonctionnalités
            </a>
            <a
              href="#notre-mission"
              className="rounded-full px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              À propos
            </a>
          </nav>

          <Link
            to="/cartographie"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-semibold text-emerald-950 shadow-lg transition hover:bg-lime-200 sm:px-5 sm:text-sm"
          >
            <span className="hidden sm:inline">Explorer la plateforme</span>
            <span className="sm:hidden">Explorer</span>
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div> */}

      {/* Contenu principal */}
      <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-12 lg:pb-28 lg:pt-24">
        {/* Texte d'introduction */}
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-950/35 px-4 py-2 text-xs font-medium text-emerald-50 shadow-sm backdrop-blur-md sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.8)]" />
            Des données pour une agriculture durable
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
            Comprendre le climat.
            <span className="mt-2 block bg-gradient-to-r from-lime-200 via-emerald-300 to-green-400 bg-clip-text text-transparent">
              Cultiver l’avenir.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
            Assaman-Suuf rassemble les données agroclimatiques, la
            cartographie et les outils d’aide à la décision pour mieux
            comprendre les territoires et anticiper les risques agricoles
            au Sénégal.
          </p>

          {/* Actions principales */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/cartographie"
              className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-lime-300 to-emerald-300 px-6 py-3.5 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-950/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
            >
              Explorer la plateforme
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-950 text-white transition-transform group-hover:rotate-45">
                <ArrowUpRight size={16} />
              </span>
            </Link>

            <a
              href="#notre-mission"
              className="inline-flex min-h-13 items-center justify-center gap-3 rounded-full border border-white/35 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-white/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
            >
              Découvrir notre mission
              <ArrowRight size={17} />
            </a>
          </div>

          {/* Indicateurs de domaines */}
          <div
            id="fonctionnalites"
            className="mt-12 grid grid-cols-1 gap-4 border-t border-white/20 pt-6 sm:grid-cols-3 sm:gap-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-lime-200">
                <CloudRain size={22} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">Climat</h2>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Précipitations, températures et prévisions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-lime-200">
                <MapPinned size={22} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Territoires
                </h2>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Cartographie interactive du Sénégal
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/15 text-lime-200">
                <Satellite size={22} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Agriculture
                </h2>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  État des cultures et risques agricoles
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Éléments visuels à droite */}
        <div className="relative mx-auto min-h-[390px] w-full max-w-xl lg:min-h-[510px]">
          {/* Carte agroclimatique flottante */}
          <div className="absolute right-0 top-3 z-10 w-52 rounded-2xl border border-white/25 bg-emerald-950/45 p-4 shadow-xl backdrop-blur-xl sm:right-1 sm:w-60">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Données agroclimatiques
              </span>
              <TrendingUp size={17} className="text-lime-300" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CloudRain size={17} className="text-sky-200" />
                <span className="flex-1 text-xs text-white/90">
                  Pluviométrie
                </span>
                <span className="text-[10px] text-emerald-200">Suivi</span>
              </div>
              <div className="flex items-center gap-3">
                <Leaf size={17} className="text-lime-200" />
                <span className="flex-1 text-xs text-white/90">
                  Végétation
                </span>
                <span className="text-[10px] text-emerald-200">Suivi</span>
              </div>
              <div className="flex items-center gap-3">
                <Thermometer size={17} className="text-orange-200" />
                <span className="flex-1 text-xs text-white/90">
                  Température
                </span>
                <span className="text-[10px] text-emerald-200">Suivi</span>
              </div>
              <div className="flex items-center gap-3">
                <Droplets size={17} className="text-cyan-200" />
                <span className="flex-1 text-xs text-white/90">
                  Ressources en eau
                </span>
                <span className="text-[10px] text-emerald-200">Suivi</span>
              </div>
            </div>
          </div>

          {/* Carte d'innovation */}
          <div className="absolute bottom-0 left-0 z-20 w-[85%] overflow-hidden rounded-3xl border border-white/25 bg-emerald-950/55 shadow-2xl backdrop-blur-xl sm:w-[78%]">
            <div className="relative h-48 overflow-hidden sm:h-56">
              <img
                src="/images/assaman-suuf_hero.jpg"
                alt="Illustration des technologies agricoles au service des territoires"
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent" />

              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/25 bg-emerald-950/50 px-3 py-1.5 text-xs text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-lime-300" />
                Agriculture · Données · Innovation
              </div>

              <Link
                to="/cartographie"
                aria-label="Découvrir la cartographie interactive"
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-lime-300 text-emerald-950 shadow-lg transition hover:scale-105 hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Play size={18} fill="currentColor" />
              </Link>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-lime-200">
                    Notre ambition
                  </p>
                  <h2 className="mt-2 text-lg font-bold text-white sm:text-xl">
                    L’intelligence agroclimatique au Sénégal
                  </h2>
                </div>
                <ArrowUpRight
                  size={21}
                  className="mt-1 shrink-0 text-lime-200"
                />
              </div>

              <p className="mt-2 text-sm leading-6 text-white/70">
                Observer les évolutions, anticiper les risques et soutenir
                des décisions adaptées aux réalités du terrain.
              </p>
            </div>
          </div>

          {/* Badge flottant */}
          <div className="absolute bottom-7 right-0 z-30 hidden items-center gap-3 rounded-2xl border border-white/25 bg-white/95 p-3 text-emerald-950 shadow-xl sm:flex sm:p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-100 text-emerald-800">
              <Sprout size={22} />
            </span>
            <div>
              <p className="text-sm font-bold">Agriculture durable</p>
              <p className="mt-1 text-xs text-gray-500">
                Observer · Comprendre · Agir
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandSection;