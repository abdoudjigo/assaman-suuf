
import {
  ArrowDown,
  ArrowRight,
  CloudRain,
  MapPinned,
  Sprout,
  TrendingUp,
} from "lucide-react";

import { Link } from "react-router-dom";
import AppNav from "../components/layout/AppNav";
import Footer from "../components/layout/Footer";
import heroImage from "../assets/hero.png";
import DashboardMap from "./DashboardMap";

const destinations = [
  {
    title: "Explorer les régions",
    description:
      "Comparez les indicateurs agricoles et climatiques sur la carte du Sénégal.",
    href: "#senegal-map",
    label: "Ouvrir la carte",
    icon: MapPinned,
    tone: "text-emerald-700 bg-emerald-50",
  },
  {
    title: "Suivre le climat",
    description:
      "Consultez les observations et les tendances météorologiques disponibles.",
    href: "/climate",
    label: "Voir le climat",
    icon: CloudRain,
    tone: "text-sky-700 bg-sky-50",
  },
  {
    title: "Estimer un rendement",
    description:
      "Explorez les possibilités d'estimation selon les conditions d'une campagne agricole.",
    href: "/prediction",
    label: "Explorer les estimations",
    icon: TrendingUp,
    tone: "text-amber-700 bg-amber-50",
  },
];

const cardClassName =
  "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

function DestinationCard({ destination }) {
  const {
    title,
    description,
    href,
    label,
    icon: Icon,
    tone,
  } = destination;

  const content = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}
        aria-hidden="true"
      >
        <Icon size={21} />
      </span>

      <span className="mt-4 block text-base font-bold text-slate-900">
        {title}
      </span>

      <span className="mt-1.5 block flex-1 text-sm leading-5 text-slate-600">
        {description}
      </span>

      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
        {label}
        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </>
  );

  if (href.startsWith("#")) {
    return (
      <a href={href} className={cardClassName}>
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className={cardClassName}>
      {content}
    </Link>
  );
}

function DashboardMain() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#f8faf6] text-slate-900">
      {/* En-tête */}
      {/* <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="Assaman-Suuf, accueil"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white"
              aria-hidden="true"
            >
              <Sprout size={21} />
            </span>

            <span>
              <span className="block text-sm font-extrabold tracking-tight">
                Assaman-Suuf
              </span>
              <span className="block text-xs text-slate-500">
                Agriculture et climat au Sénégal
              </span>
            </span>
          </Link>

          <AppNav className="max-w-full overflow-x-auto" />
        </div>
      </header> */}

      <main className="mx-auto max-w-[1440px] space-y-10 px-5 py-7 sm:px-8 sm:py-10">
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="relative isolate overflow-hidden rounded-[2rem] bg-[#edf4e8] px-6 py-9 sm:px-10 sm:py-12 lg:px-14"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-52 -z-10 h-44 w-44 rounded-full bg-amber-100/70 blur-3xl"
          />

          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 top-1/2 hidden w-56 -translate-y-1/2 object-contain opacity-90 md:block lg:right-16 lg:w-64"
          />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
              Plateforme agroclimatique · Sénégal
            </span>

            <h1
              id="hero-title"
              className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]"
            >
              Les données du terrain, plus simples à comprendre.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Retrouvez au même endroit les informations agricoles et
              climatiques du Sénégal. Comparez les régions, suivez les
              conditions météorologiques disponibles et préparez vos
              décisions de campagne.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#senegal-map"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Explorer les données
                <ArrowDown size={16} aria-hidden="true" />
              </a>

              <Link
                to="/prediction"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-900/15 bg-white/80 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Explorer les estimations
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Accès rapide aux fonctionnalités */}
        <section aria-labelledby="services-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
                Par où commencer ?
              </p>

              <h2
                id="services-title"
                className="mt-1 text-xl font-bold tracking-tight text-slate-900"
              >
                Choisissez votre besoin
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Explorez les outils disponibles sur la plateforme.
            </p>
          </div>

          <div className="grid items-stretch gap-3 md:grid-cols-3">
            {destinations.map((destination) => (
              <DestinationCard
                key={destination.title}
                destination={destination}
              />
            ))}
          </div>
        </section>

        {/* Carte interactive */}
        <section
          id="senegal-map"
          aria-labelledby="map-title"
          className="scroll-mt-6"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
                Vue territoriale
              </p>

              <h2
                id="map-title"
                className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
              >
                Explorer la carte du Sénégal
              </h2>

              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-600">
                Choisissez un indicateur et une année dans les filtres,
                puis sélectionnez une région pour consulter les détails
                disponibles.
              </p>
            </div>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              Carte interactive · Données par région
            </span>
          </div>

          <DashboardMap embedded />
        </section>
      </main>

      {/* Pied de page */}
      {/* <Footer /> */}
    </div>
  );
}

export default DashboardMain;
