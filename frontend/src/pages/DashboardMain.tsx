import { ArrowDown, ArrowRight, CloudRain, MapPinned, Sprout, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import AppNav from "../components/layout/AppNav";
import heroImage from "../assets/hero.png";
import DashboardMap from "./DashboardMap";

const destinations = [
    {
        title: "Explorer les régions",
        description: "Comparez les indicateurs agricoles et climatiques sur la carte du Sénégal.",
        href: "#senegal-map",
        label: "Ouvrir la carte",
        icon: MapPinned,
        tone: "text-emerald-700 bg-emerald-50",
    },
    {
        title: "Suivre le climat",
        description: "Consultez les observations et les tendances météo disponibles.",
        href: "/climate",
        label: "Voir le climat",
        icon: CloudRain,
        tone: "text-sky-700 bg-sky-50",
    },
    {
        title: "Estimer un rendement",
        description: "Lancez une estimation à partir des conditions d'une campagne.",
        href: "/prediction",
        label: "Faire une prédiction",
        icon: TrendingUp,
        tone: "text-amber-700 bg-amber-50",
    },
];

function DashboardMain() {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[#f8faf6] text-slate-900">
            <header className="border-b border-slate-200/80 bg-white">
                <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
                    <Link to="/" className="flex items-center gap-3" aria-label="Assaman-Suuf, accueil">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                            <Sprout size={21} />
                        </span>
                        <span>
                            <span className="block text-sm font-extrabold tracking-tight">Assaman-Suuf</span>
                            <span className="block text-xs text-slate-500">Agriculture et climat au Sénégal</span>
                        </span>
                    </Link>
                    <AppNav className="max-w-full overflow-x-auto" />
                </div>
            </header>

            <main className="mx-auto max-w-[1440px] space-y-10 px-5 py-7 sm:px-8 sm:py-10">
                <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#edf4e8] px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
                    <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-52 -z-10 h-44 w-44 rounded-full bg-amber-100/70 blur-3xl" />
                    <img
                        src={heroImage}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-2 top-1/2 hidden w-56 -translate-y-1/2 opacity-90 md:block lg:right-16 lg:w-64"
                    />
                    <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                            {/* <span className="h-2 w-2 rounded-full bg-emerald-600" /> */}
                            Plateforme agroclimatique · Sénégal
                        </span>
                        <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
                            Les données du terrain, plus simples à comprendre.
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                            Retrouvez au même endroit les informations agricoles et climatiques du Sénégal.
                            Comparez les régions, suivez les conditions météo et préparez vos décisions de campagne.
                        </p>
                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            <a
                                href="#senegal-map"
                                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                            >
                                Explorer les données
                                <ArrowDown size={16} />
                            </a>
                            <Link
                                to="/prediction"
                                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-900/15 bg-white/80 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                            >
                                Estimer un rendement
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="services-title">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Par où commencer ?</p>
                            <h2 id="services-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                                Choisissez votre besoin
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500">Trois outils pour passer des données à l’action.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        {destinations.map(({ title, description, href, label, icon: Icon, tone }) => {
                            const content = (
                                <>
                                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
                                        <Icon size={21} />
                                    </span>
                                    <span className="mt-4 block text-base font-bold text-slate-900">{title}</span>
                                    <span className="mt-1.5 block min-h-10 text-sm leading-5 text-slate-600">{description}</span>
                                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                                        {label}
                                        <ArrowRight size={15} />
                                    </span>
                                </>
                            );
                            const className = "group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

                            return href.startsWith("#") ? (
                                <a key={title} href={href} className={className}>{content}</a>
                            ) : (
                                <Link key={title} to={href} className={className}>{content}</Link>
                            );
                        })}
                    </div>
                </section>

                <section id="senegal-map" aria-labelledby="map-title" className="scroll-mt-6">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Vue territoriale</p>
                            <h2 id="map-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                Explorer la carte du Sénégal
                            </h2>
                            <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-600">
                                Choisissez un indicateur et une année dans « Filtres », puis sélectionnez une région pour consulter ses détails.
                            </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                            Carte interactive · données par région
                        </span>
                    </div>
                    <DashboardMap embedded />
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-slate-500 sm:px-8">
                    <span>Assaman-Suuf · Aide à la décision agroclimatique</span>
                    <Link to="/supervision" className="font-semibold text-emerald-800 hover:text-emerald-950">
                        Accéder à la supervision technique
                    </Link>
                </div>
            </footer>
        </div>
    );
}

export default DashboardMain;
