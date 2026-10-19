import { useMemo, useState } from "react";
import { useIsFetching, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from "recharts";
import { CloudRain, Info, LayoutDashboard, RefreshCw, Ruler, Sprout, TrendingUp, Wheat } from "lucide-react";

import PageHeader from "../components/layout/PageHeader";
import { ChartCard, FilterBar, FilterSelect, KpiCard, type BlockStatus } from "../components/dashboard/DashboardBlocks";
import { useAgregats, useClimatAnnuel, useNuage, useProduits, useZones } from "../hooks/useDashboardData";
import { getApiErrorMessage, type AgregatItem, type NuagePoint } from "../services/dashboardApi";
import { EMPTY_FILTERS, fmt, isNum, pctChange, type DashboardFilters } from "../utils/agroAggregates";

/* =========================================================
   1. CONSTANTES D'AFFICHAGE
   ========================================================= */

const COLORS = {
    production: "#047857",
    rendement: "#2a78d6",
    pluie: "#2a78d6",
    temperature: "#eb6834",
    other: "#a8a29e",
    grid: "#e2e8f0",
    axis: "#64748b",
};

// Trois teintes au plus dans le nuage (lisibles pour les daltonismes courants) ; le reste → « Autres ».
const SCATTER_SLOTS = ["#2a78d6", "#eb6834", "#1baf7a"];
const MAX_SCATTER_POINTS = 4000;
const TOP_CULTURES = 12;

const AXIS_TICK = { fontSize: 11, fill: COLORS.axis };
const TOOLTIP_STYLE = { borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 };

const NO_AGREGATS: AgregatItem[] = [];

const uniqueSorted = <T extends string | number>(values: (T | null | undefined)[]) =>
    [...new Set(values.filter((v): v is T => v !== null && v !== undefined && v !== ""))].sort((a, b) =>
        typeof a === "number" && typeof b === "number" ? b - a : String(a).localeCompare(String(b), "fr")
    );

function statusOf<TData, TError>(query: UseQueryResult<TData, TError>, isEmpty: boolean, emptyMessage?: string): BlockStatus {
    if (query.isPending) return { kind: "loading" };
    if (query.isError) return { kind: "error", message: getApiErrorMessage(query.error), onRetry: () => query.refetch() };
    if (isEmpty) return { kind: "empty", message: emptyMessage };
    return { kind: "ready" };
}

/** Lignes agrégées → { name, production, rendement } (clé null déjà exclue par l'API). */
const toNamed = (rows: AgregatItem[]) =>
    rows.map((row) => ({ name: String(row.cle), production: row.production_t, rendement: row.rendement_t_ha }));

const topBy = <T extends Record<K, number | null>, K extends keyof T>(rows: T[], key: K, limit = Infinity) =>
    rows
        .filter((row) => isNum(row[key]))
        .sort((a, b) => (b[key] as number) - (a[key] as number))
        .slice(0, limit);

/* =========================================================
   2. GRAPHIQUES
   ========================================================= */

function YearLine({
    data,
    dataKey,
    label,
    unit,
    color,
    format,
    highlightYear,
}: {
    data: object[];
    dataKey: string;
    label: string;
    unit: string;
    color: string;
    format: (v: number) => string;
    highlightYear: number | null;
}) {
    return (
        <figure className="min-w-0">
            <figcaption className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="h-0.5 w-4 rounded" style={{ backgroundColor: color }} />
                {label} <span className="font-normal text-slate-400">({unit})</span>
            </figcaption>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={COLORS.grid} vertical={false} />
                    <XAxis dataKey="annee" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: COLORS.grid }} minTickGap={16} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => format(Number(v))} />
                    <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(year) => `Année ${year}`}
                        formatter={(value) => [`${format(Number(value))} ${unit}`, label]}
                    />
                    {highlightYear !== null && <ReferenceLine x={highlightYear} stroke={COLORS.axis} strokeDasharray="4 4" />}
                    {/* connectNulls=false : une année sans valeur reste un trou, jamais un zéro. */}
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </figure>
    );
}

function HorizontalBars({
    data,
    dataKey,
    label,
    unit,
    color,
    format,
}: {
    data: { name: string }[];
    dataKey: string;
    label: string;
    unit: string;
    color: string;
    format: (v: number) => string;
}) {
    return (
        <ResponsiveContainer width="100%" height={Math.max(140, data.length * 30 + 30)}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={4}>
                <CartesianGrid stroke={COLORS.grid} horizontal={false} />
                <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => format(Number(v))} />
                <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={132} interval={0} />
                <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [`${format(Number(value))} ${unit}`, label]}
                />
                <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
        </ResponsiveContainer>
    );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: { payload: NuagePoint }[] }) {
    const point = active ? payload?.[0]?.payload : undefined;
    if (!point) return null;
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
            <p className="font-semibold text-slate-900">{point.produit}</p>
            <p className="text-slate-500">
                {point.region ?? "Région inconnue"} · {point.annee ?? "—"}
            </p>
            <p className="mt-1 text-slate-700">Pluie cumulée : {fmt.int(point.pluie_cumul_mm)} mm</p>
            <p className="text-slate-700">Rendement : {fmt.dec2(point.rendement_t_ha)} t/ha</p>
        </div>
    );
}

/* =========================================================
   3. PAGE
   ========================================================= */

function Dashboard() {
    const queryClient = useQueryClient();
    const fetchingCount = useIsFetching({ queryKey: ["dashboard"] });

    const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS);
    const [regionMetric, setRegionMetric] = useState<"production" | "rendement">("production");

    const setFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) =>
        setFilters((current) => ({ ...current, [key]: value }));

    /* ---------- Requêtes (agrégats calculés par l'API, en cache par filtres) ---------- */

    const total = useAgregats("total", filters);
    const yearly = useAgregats("annee", { ...filters, annee: null }); // série : toutes années
    const cultures = useAgregats("produit", filters);
    const regions = useAgregats("region", filters);
    const nuage = useNuage(filters, MAX_SCATTER_POINTS);
    const climat = useClimatAnnuel(filters.region);

    // Référentiels non filtrés : options des filtres et couleurs stables du nuage.
    const allYears = useAgregats("annee", EMPTY_FILTERS);
    const allSystemes = useAgregats("systeme_production", EMPTY_FILTERS);
    const allCultures = useAgregats("produit", EMPTY_FILTERS);
    const zones = useZones();
    const produits = useProduits();

    /* ---------- Options des filtres ---------- */

    const options = useMemo(() => {
        const catalogue = produits.data?.length
            ? produits.data
            : (allCultures.data ?? NO_AGREGATS).map((row) => ({ produit: String(row.cle), categorie: null }));

        return {
            years: uniqueSorted((allYears.data ?? NO_AGREGATS).map((row) => (isNum(row.cle) ? row.cle : null))),
            regions: uniqueSorted(
                zones.data?.length ? zones.data.map((z) => z.region) : (regions.data ?? NO_AGREGATS).map((row) => String(row.cle))
            ),
            categories: uniqueSorted(catalogue.map((p) => p.categorie)),
            cultures: uniqueSorted(
                catalogue.filter((p) => filters.categorie === null || p.categorie === filters.categorie).map((p) => p.produit)
            ),
            systemes: uniqueSorted((allSystemes.data ?? NO_AGREGATS).map((row) => (row.cle === null ? null : String(row.cle)))),
            catalogue,
        };
    }, [produits.data, allCultures.data, allYears.data, allSystemes.data, zones.data, regions.data, filters.categorie]);

    /* ---------- Indicateurs ---------- */

    const view = useMemo(() => {
        const kpi = total.data?.[0];
        const years = (yearly.data ?? NO_AGREGATS).filter((row) => isNum(row.cle));
        const byYear = new Map(years.map((row) => [row.cle as number, row]));

        // Année de référence : l'année filtrée, sinon la dernière année avec production.
        const withProduction = years.filter((row) => isNum(row.production_t)).map((row) => row.cle as number);
        const refYear = filters.annee ?? (withProduction.length ? Math.max(...withProduction) : null);
        const current = refYear !== null ? byYear.get(refYear) : undefined;
        const previous = refYear !== null ? byYear.get(refYear - 1) : undefined;
        const keys = [...byYear.keys()];

        const cultureRows = toNamed(cultures.data ?? NO_AGREGATS);

        return {
            kpi,
            refYear,
            period: keys.length ? `${Math.min(...keys)}–${Math.max(...keys)}` : "",
            evolProduction: pctChange(current?.production_t, previous?.production_t),
            evolRendement: pctChange(current?.rendement_t_ha, previous?.rendement_t_ha),
            yearly: years.map((row) => ({ annee: row.cle, production: row.production_t, rendement: row.rendement_t_ha })),
            cultureProduction: topBy(cultureRows, "production", TOP_CULTURES),
            cultureRendement: topBy(cultureRows, "rendement", TOP_CULTURES),
        };
    }, [total.data, yearly.data, cultures.data, filters.annee]);

    const regionRanking = useMemo(
        () => topBy(toNamed(regions.data ?? NO_AGREGATS), regionMetric).map((r, index) => ({ ...r, name: `${index + 1}. ${r.name}` })),
        [regions.data, regionMetric]
    );

    // Couleur attachée à la culture (rang global par nombre de campagnes avec climat, stable quels que soient les filtres).
    const cultureColor = useMemo(() => {
        const top = topBy(
            (allCultures.data ?? NO_AGREGATS).map((row) => ({ name: String(row.cle), n: row.nb_avec_climat })),
            "n",
            SCATTER_SLOTS.length
        ).filter((row) => row.n > 0);
        return new Map(top.map((row, index) => [row.name, SCATTER_SLOTS[index]]));
    }, [allCultures.data]);

    const scatter = useMemo(() => {
        const groups = new Map<string, NuagePoint[]>();
        for (const point of nuage.data?.data ?? []) {
            const name = cultureColor.has(point.produit) || filters.produit ? point.produit : "Autres";
            const group = groups.get(name);
            if (group) group.push(point);
            else groups.set(name, [point]);
        }
        const series = [...groups]
            .map(([name, points]) => ({
                name,
                color: cultureColor.get(name) ?? (name === "Autres" ? COLORS.other : "#475569"),
                points,
            }))
            // « Autres » en premier pour qu'il soit dessiné sous les cultures colorées.
            .sort((a, b) => (a.name === "Autres" ? -1 : b.name === "Autres" ? 1 : a.name.localeCompare(b.name, "fr")));
        return { series, shown: nuage.data?.data.length ?? 0, total: nuage.data?.total ?? 0 };
    }, [nuage.data, cultureColor, filters.produit]);

    const climateYears = useMemo(
        () => (climat.data ?? []).map((row) => ({ annee: row.annee, pluie: row.pluie_cumul_mm, temperature: row.tavg_moyenne })),
        [climat.data]
    );

    /* ---------- États des blocs ---------- */

    const kpiStatus = statusOf(total, !view.kpi);
    const yearlyStatus = statusOf(yearly, !view.yearly.some((y) => isNum(y.production)));
    const cultureProdStatus = statusOf(cultures, view.cultureProduction.length === 0);
    const cultureRendStatus = statusOf(cultures, view.cultureRendement.length === 0);
    const regionStatus = statusOf(regions, regionRanking.length === 0);
    const scatterStatus = statusOf(nuage, scatter.shown === 0, "Aucune campagne avec pluie et rendement renseignés pour ces filtres.");
    const climateStatus = statusOf(
        climat,
        !climateYears.some((y) => isNum(y.pluie) || isNum(y.temperature)),
        "Aucune observation climatique exploitable pour ces filtres."
    );

    const coverage = {
        pct: view.kpi?.couverture_climat_pct ?? null,
        withClimate: view.kpi?.nb_avec_climat ?? 0,
        known: view.kpi?.nb_climat_renseigne ?? 0,
    };
    const activeFilters = Object.values(filters).some((v) => v !== null);
    const periodLabel = filters.annee !== null ? `Campagne ${filters.annee}` : `Cumul ${view.period}`;
    const evolutionTone = isNum(view.evolProduction) ? (view.evolProduction >= 0 ? "up" : "down") : "neutral";

    /* ---------- Interface ---------- */

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <PageHeader
                icon={LayoutDashboard}
                subtitle="Dashboard agroclimatique · Sénégal"
                actions={
                    <button
                        type="button"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["dashboard"] })}
                        title="Recharger les données depuis l'API"
                        aria-label="Recharger les données"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw size={16} className={fetchingCount > 0 ? "animate-spin" : ""} />
                    </button>
                }
            />

            <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
                {/* Filtres globaux */}
                <FilterBar
                    onReset={() => setFilters(EMPTY_FILTERS)}
                    canReset={activeFilters}
                    footer={
                        view.kpi && <>Périmètre : {fmt.int(view.kpi.nb_campagnes)} campagnes · agrégats calculés par /api/v1/agroclimat/agregats.</>
                    }
                >
                    <FilterSelect label="Année" value={filters.annee} options={options.years} allLabel="Toutes" onChange={(v) => setFilter("annee", v)} disabled={allYears.isPending} />
                    <FilterSelect label="Région" value={filters.region} options={options.regions} onChange={(v) => setFilter("region", v)} />
                    <FilterSelect
                        label="Catégorie"
                        value={filters.categorie}
                        options={options.categories}
                        onChange={(v) =>
                            setFilters((current) => ({
                                ...current,
                                categorie: v,
                                // La culture choisie doit appartenir à la nouvelle catégorie.
                                produit:
                                    v !== null && options.catalogue.some((p) => p.produit === current.produit && p.categorie !== v)
                                        ? null
                                        : current.produit,
                            }))
                        }
                    />
                    <FilterSelect label="Culture" value={filters.produit} options={options.cultures} onChange={(v) => setFilter("produit", v)} />
                    <FilterSelect label="Système de production" value={filters.systeme} options={options.systemes} allLabel="Tous" onChange={(v) => setFilter("systeme", v)} disabled={allSystemes.isPending} />
                </FilterBar>

                {/* KPI */}
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5" aria-label="Indicateurs clés">
                    <KpiCard label="Production" icon={Wheat} status={kpiStatus} value={fmt.compact(view.kpi?.production_t)} unit="t" hint={`${periodLabel} · ${fmt.int(view.kpi?.production_t)} t`} />
                    <KpiCard label="Superficie" icon={Ruler} status={kpiStatus} value={fmt.compact(view.kpi?.superficie_ha)} unit="ha" hint={`${periodLabel} · ${fmt.int(view.kpi?.superficie_ha)} ha`} />
                    <KpiCard
                        label="Rendement"
                        icon={Sprout}
                        status={kpiStatus}
                        value={fmt.dec2(view.kpi?.rendement_t_ha)}
                        unit="t/ha"
                        hint={`Σ production / Σ superficie · ${fmt.int(view.kpi?.nb_campagnes_rendement)} campagnes complètes`}
                    />
                    <KpiCard
                        label={`Évolution production vs N-1`}
                        icon={TrendingUp}
                        status={kpiStatus}
                        tone={evolutionTone}
                        value={fmt.pct(view.evolProduction, true)}
                        hint={
                            view.refYear !== null
                                ? `${view.refYear} vs ${view.refYear - 1} · rendement ${fmt.pct(view.evolRendement, true)}`
                                : "Aucune année de référence"
                        }
                    />
                    <KpiCard
                        label="Couverture climatique"
                        icon={CloudRain}
                        status={kpiStatus}
                        value={fmt.pct(coverage.pct)}
                        hint={`${fmt.int(coverage.withClimate)} / ${fmt.int(coverage.known)} campagnes avec données climat`}
                    />
                </section>

                {/* Séries annuelles */}
                <ChartCard
                    title="Production et rendement par année"
                    subtitle="Toutes années, filtres Région / Catégorie / Culture / Système appliqués. Ligne pointillée : année sélectionnée."
                    status={yearlyStatus}
                    busy={yearly.isPlaceholderData}
                >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <YearLine data={view.yearly} dataKey="production" label="Production" unit="t" color={COLORS.production} format={fmt.compact} highlightYear={filters.annee} />
                        <YearLine data={view.yearly} dataKey="rendement" label="Rendement" unit="t/ha" color={COLORS.rendement} format={fmt.dec2} highlightYear={filters.annee} />
                    </div>
                </ChartCard>

                {/* Cultures */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <ChartCard title="Production par culture" subtitle={`${periodLabel} · top ${TOP_CULTURES}`} status={cultureProdStatus} busy={cultures.isPlaceholderData}>
                        <HorizontalBars data={view.cultureProduction} dataKey="production" label="Production" unit="t" color={COLORS.production} format={fmt.compact} />
                    </ChartCard>
                    <ChartCard title="Rendement par culture" subtitle={`${periodLabel} · Σ production / Σ superficie · top ${TOP_CULTURES}`} status={cultureRendStatus} busy={cultures.isPlaceholderData}>
                        <HorizontalBars data={view.cultureRendement} dataKey="rendement" label="Rendement" unit="t/ha" color={COLORS.rendement} format={fmt.dec2} />
                    </ChartCard>
                </div>

                {/* Régions & climat */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <ChartCard
                        title="Classement des régions"
                        subtitle={periodLabel}
                        status={regionStatus}
                        busy={regions.isPlaceholderData}
                        actions={
                            <div className="flex rounded-xl border border-slate-200 p-0.5 text-xs" role="group" aria-label="Indicateur du classement">
                                {(["production", "rendement"] as const).map((metric) => (
                                    <button
                                        key={metric}
                                        type="button"
                                        aria-pressed={regionMetric === metric}
                                        onClick={() => setRegionMetric(metric)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                                            regionMetric === metric ? "bg-green-700 text-white" : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {metric}
                                    </button>
                                ))}
                            </div>
                        }
                        footer="Les campagnes sans région renseignée sont exclues du classement."
                    >
                        {regionMetric === "production" ? (
                            <HorizontalBars data={regionRanking} dataKey="production" label="Production" unit="t" color={COLORS.production} format={fmt.compact} />
                        ) : (
                            <HorizontalBars data={regionRanking} dataKey="rendement" label="Rendement" unit="t/ha" color={COLORS.rendement} format={fmt.dec2} />
                        )}
                    </ChartCard>

                    <ChartCard
                        title="Pluie et température par année"
                        subtitle={filters.region ? `Stations de la région ${filters.region}` : "Toutes les stations"}
                        status={climateStatus}
                        busy={climat.isPlaceholderData}
                        footer="Source /api/v1/climat/annuel. Seul le filtre Région s'applique (Culture, Catégorie et Système ne concernent pas les stations). Pluie : cumul annuel moyen des stations ayant leurs 12 mois renseignés ; température : moyenne des mois renseignés."
                    >
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            <YearLine data={climateYears} dataKey="pluie" label="Pluie cumulée" unit="mm" color={COLORS.pluie} format={fmt.int} highlightYear={filters.annee} />
                            <YearLine data={climateYears} dataKey="temperature" label="Température moyenne" unit="°C" color={COLORS.temperature} format={fmt.dec1} highlightYear={filters.annee} />
                        </div>
                    </ChartCard>
                </div>

                {/* Pluie × rendement */}
                <ChartCard
                    title="Pluie cumulée × rendement par culture"
                    subtitle={`${periodLabel} · une campagne = un point · campagnes avec données climat uniquement`}
                    status={scatterStatus}
                    busy={nuage.isPlaceholderData}
                    aside={
                        view.kpi && (
                            <aside className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 p-4 lg:w-64">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Couverture climatique</p>
                                <p className="mt-1 text-3xl font-bold text-amber-900">{fmt.pct(coverage.pct)}</p>
                                <p className="mt-1 text-xs leading-5 text-amber-900/80">
                                    {fmt.int(coverage.withClimate)} campagnes sur {fmt.int(coverage.known)} disposent de données climatiques. Le nuage ne
                                    représente que ce sous-ensemble, qui peut ne pas être représentatif.
                                </p>
                                {scatter.shown < scatter.total && (
                                    <p className="mt-2 text-[11px] text-amber-900/70">
                                        Échantillon affiché : {fmt.int(scatter.shown)} points sur {fmt.int(scatter.total)}.
                                    </p>
                                )}
                            </aside>
                        )
                    }
                    footer={
                        <span className="flex items-start gap-1.5">
                            <Info size={13} className="mt-0.5 shrink-0" />
                            Corrélation ≠ causalité : ce nuage montre une association entre pluie cumulée et rendement, pas un effet de la pluie sur le
                            rendement. D'autres facteurs (variétés, intrants, sols, irrigation, ravageurs) interviennent.
                        </span>
                    }
                >
                    <ResponsiveContainer width="100%" height={340}>
                        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                            <CartesianGrid stroke={COLORS.grid} />
                            <XAxis
                                type="number"
                                dataKey="pluie_cumul_mm"
                                name="Pluie cumulée"
                                tick={AXIS_TICK}
                                tickLine={false}
                                tickFormatter={(v) => fmt.int(Number(v))}
                                label={{ value: "Pluie cumulée (mm)", position: "insideBottom", offset: -4, fontSize: 11, fill: COLORS.axis }}
                                height={40}
                            />
                            <YAxis
                                type="number"
                                dataKey="rendement_t_ha"
                                name="Rendement"
                                tick={AXIS_TICK}
                                tickLine={false}
                                width={52}
                                tickFormatter={(v) => fmt.dec1(Number(v))}
                                label={{ value: "t/ha", angle: -90, position: "insideLeft", fontSize: 11, fill: COLORS.axis }}
                            />
                            <ZAxis range={[28, 28]} />
                            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                            <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 12 }} />
                            {scatter.series.map((s) => (
                                <Scatter key={s.name} name={s.name} data={s.points} fill={s.color} fillOpacity={0.6} isAnimationActive={false} />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartCard>
            </main>
        </div>
    );
}

export default Dashboard;
