
import {
  ArrowDown,
  ArrowRight,
  CloudRain,
  MapPinned,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";
import DashboardMap from "./DashboardMap";
import BrandSection from "../components/BrandSection";

interface Destination {
  title: string;
  description: string;
  href: string;
  label: string;
  icon: typeof MapPinned;
  tone: string;
}

const destinations: Destination[] = [
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

interface DestinationCardProps {
  destination: Destination;
}

function DestinationCard({ destination }: DestinationCardProps) {
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
    <div className="overflow-x-clip bg-[#f8faf6] text-slate-900">
      <main className="mx-auto w-full max-w-[1440px] space-y-10 px-5 py-7 sm:px-8 sm:py-10">
        {/* Section principale */}
        <BrandSection />

        {/* Accès rapide */}
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
          className="scroll-mt-24"
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
    </div>
  );
}

export default DashboardMain;
