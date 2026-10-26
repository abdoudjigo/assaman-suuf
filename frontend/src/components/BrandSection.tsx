
import { Link } from "react-router-dom";
import {
  Sprout,
  ArrowRight,
  ArrowUpRight,
  MapPinned,
  CloudSun,
  Satellite,
} from "lucide-react";

function BrandSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f5f7ef]">
      {/* Décoration d'arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
        {/* Contenu principal */}
        <div className="flex flex-col items-start">
          {/* Identité de marque */}
          <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white">
              <Sprout size={27} strokeWidth={1.8} />
            </span>

            <span className="flex flex-col gap-1">
              <span className="text-lg font-extrabold tracking-tight text-emerald-950 sm:text-xl">
                ASSAMAN-SUUF
              </span>
              <span className="text-[10px] font-semibold tracking-[0.16em] text-gray-500">
                AGRICULTURE · CLIMAT · DONNÉES
              </span>
            </span>
          </div>

          {/* Accroche */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            La donnée au service des territoires
          </div>

          <h1 className="max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
            Comprendre le climat.
            <span className="mt-2 block text-emerald-800">
              Cultiver l’avenir.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
            Assaman-Suuf rassemble les données agroclimatiques et
            géographiques pour mieux comprendre les dynamiques agricoles,
            suivre les territoires et éclairer les décisions au Sénégal.
          </p>

          {/* Boutons d'action */}
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/cartographie"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-emerald-800 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Explorer la plateforme
              <ArrowUpRight size={18} />
            </Link>

            <a
              href="#notre-mission"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Découvrir notre mission
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Domaines d'expertise */}
          <div className="mt-10 grid w-full grid-cols-3 gap-3 border-t border-emerald-100 pt-6">
            <div className="flex flex-col gap-2">
              <CloudSun size={23} className="text-emerald-800" />
              <span className="text-sm font-semibold text-gray-900">
                Climat
              </span>
              <span className="text-xs leading-5 text-gray-500">
                Données climatiques
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <MapPinned size={23} className="text-emerald-800" />
              <span className="text-sm font-semibold text-gray-900">
                Territoires
              </span>
              <span className="text-xs leading-5 text-gray-500">
                Cartographie
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Satellite size={23} className="text-emerald-800" />
              <span className="text-sm font-semibold text-gray-900">
                Agriculture
              </span>
              <span className="text-xs leading-5 text-gray-500">
                Suivi des cultures
              </span>
            </div>
          </div>
        </div>

        {/* Illustration visuelle */}
        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="absolute -inset-4 rounded-[2rem] bg-emerald-200/40 blur-2xl" />

          <div className="relative overflow-hidden rounded-3xl border border-white bg-emerald-950 shadow-2xl">
            <img
              src="/images/assaman-suuf_hero.jpg"
              alt="Paysage agricole représentatif des territoires du Sénégal"
              className="h-[360px] w-full object-cover sm:h-[460px]"
              loading="eager"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                <MapPinned size={15} />
                Sénégal · Territoires agricoles
              </span>

              <h2 className="mt-4 max-w-md text-2xl font-semibold leading-tight text-white sm:text-3xl">
                Des données pour mieux comprendre notre environnement.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                Explorer les territoires, observer les évolutions et
                préparer des décisions adaptées aux réalités du terrain.
              </p>
            </div>
          </div>

          {/* Carte de marque flottante */}
          <div className="absolute -left-3 top-8 flex items-center gap-3 rounded-2xl border border-white bg-white/95 p-3 shadow-lg sm:-left-6 sm:p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Sprout size={22} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-900">
                Agriculture durable
              </span>
              <span className="text-xs text-gray-500">
                Observer · Comprendre · Agir
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandSection;
