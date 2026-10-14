import { useMemo, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceDot,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    CircleAlert,
    CloudRain,
    FlaskConical,
    Info,
    Play,
    Ruler,
    Sprout,
    Target,
    TriangleAlert,
    Wheat,
} from "lucide-react";

import PageHeader from "../components/layout/PageHeader";
import { ChartCard, FilterBar, FilterSelect, KpiCard, NumberField, type BlockStatus } from "../components/dashboard/DashboardBlocks";
import { useAgregats } from "../hooks/useDashboardData";
import { PLUIES_SCENARIO, usePredictionOptions, useScenarioPluie, useSimulation } from "../hooks/usePrediction";
import { PredictionError, type ClimatSource, type SimulationOptions, type SimulationRequest } from "../types/prediction";
import { EMPTY_FILTERS, fmt, isNum, pctChange } from "../utils/agroAggregates";

/* =========================================================
   1. CONSTANTES
   ========================================================= */

const COLORS = {
    prediction: "#2a78d6",
    observe: "#047857",
    reference: "#64748b",
    grid: "#e2e8f0",
};

const AXIS_TICK = { fontSize: 11, fill: COLORS.reference };
const TOOLTIP_STYLE = { borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 };

const SOURCE_LABEL: Record<ClimatSource, string> = {
    saisie_utilisateur: "Scénario saisi",
    observe: "Climat observé (GalsenAPI)",
    normale_region: "Normale de la région",
};

// Dernière année d'entraînement du modèle (voir ml/service_prediction.py).
const ANNEE_FIN_DONNEES = 2015;

type Draft = {
    produit: string;
    region: string;
    superficie_ha: string;
    annee: string;
    saison: string;
    systeme_production: string;
    pluie_cumul_mm: string;
    tavg_moyenne: string;
};

const INITIAL_DRAFT: Draft = {
    produit: "Mil",
    region: "Kaolack",
    superficie_ha: "1000",
    annee: String(ANNEE_FIN_DONNEES),
    saison: "Principale",
    systeme_production: "Pluvial",
    pluie_cumul_mm: "",
    tavg_moyenne: "",
};

type DraftErrors = Partial<Record<keyof Draft, string>>;

/* =========================================================
   2. VALIDATION (mêmes bornes que schemas/predictions.py)
   ========================================================= */

const parseOptional = (value: string): number | null => (value.trim() === "" ? null : Number(value));

function validate(draft: Draft, options: SimulationOptions | undefined): { request: SimulationRequest | null; errors: DraftErrors } {
    const errors: DraftErrors = {};
    const superficie = Number(draft.superficie_ha);
    const annee = Number(draft.annee);
    const pluie = parseOptional(draft.pluie_cumul_mm);
    const tavg = parseOptional(draft.tavg_moyenne);

    if (draft.superficie_ha.trim() === "" || !Number.isFinite(superficie) || superficie <= 0) {
        errors.superficie_ha = "Superficie strictement positive requise.";
    }
    if (!Number.isInteger(annee) || annee < 1960 || annee > 2100) errors.annee = "Année entière entre 1960 et 2100.";
    if (pluie !== null && (!Number.isFinite(pluie) || pluie < 0)) errors.pluie_cumul_mm = "Pluie positive ou vide.";
    if (tavg !== null && !Number.isFinite(tavg)) errors.tavg_moyenne = "Température invalide.";

    for (const key of ["produit", "region", "saison", "systeme_production"] as const) {
        if (options && !options[key].includes(draft[key])) errors[key] = "Valeur non proposée par le modèle.";
    }

    if (Object.keys(errors).length) return { request: null, errors };

    return {
        errors,
        request: {
            produit: draft.produit,
            region: draft.region,
            superficie_ha: superficie,
            annee,
            saison: draft.saison,
            systeme_production: draft.systeme_production,
            pluie_cumul_mm: pluie,
            tavg_moyenne: tavg,
        },
    };
}

const errorMessage = (error: unknown) =>
    error instanceof PredictionError || error instanceof Error ? error.message : "Erreur inconnue.";

function statusOf(query: UseQueryResult<unknown>, isEmpty = false, emptyMessage?: string): BlockStatus {
    if (query.isPending) return { kind: "loading" };
    if (query.isError) return { kind: "error", message: errorMessage(query.error), onRetry: () => query.refetch() };
    if (isEmpty) return { kind: "empty", message: emptyMessage };
    return { kind: "ready" };
}

/* =========================================================
   3. PAGE
   ========================================================= */

function Prediction() {
    const optionsQuery = usePredictionOptions();
    const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
    const [errors, setErrors] = useState<DraftErrors>({});
    const [submitted, setSubmitted] = useState<SimulationRequest | null>(null);

    const simulation = useSimulation(submitted);
    const result = simulation.data;
    // Courbe lancée seulement si la campagne elle-même est acceptée par le modèle. On fige
    // la température réellement utilisée (observée ou normale) pour que seule la pluie varie.
    const scenario = useScenarioPluie(
        result && submitted ? { ...submitted, tavg_moyenne: submitted.tavg_moyenne ?? result.climat.tavg_moyenne } : null
    );

    // Rendement observé région × culture (route d'agrégats du Dashboard, données réelles).
    const observed = useAgregats("annee", { ...EMPTY_FILTERS, region: submitted?.region ?? null, produit: submitted?.produit ?? null });

    const set = (key: keyof Draft) => (value: string | null) => setDraft((current) => ({ ...current, [key]: value ?? "" }));

    function submit() {
        const { request, errors: nextErrors } = validate(draft, optionsQuery.data);
        setErrors(nextErrors);
        if (request) setSubmitted(request);
    }

    const options = optionsQuery.data;
    const rejected = simulation.error instanceof PredictionError && simulation.error.status === 422;

    const observedSeries = useMemo(
        () =>
            (observed.data ?? [])
                .filter((row) => isNum(row.cle) && isNum(row.rendement_t_ha))
                .map((row) => ({ annee: row.cle as number, rendement: row.rendement_t_ha })),
        [observed.data]
    );

    const ecartHistorique = pctChange(result?.rendement_t_ha, result?.reperes.rendement_moyen_historique_t_ha);
    const resultStatus: BlockStatus = submitted === null ? { kind: "empty" } : statusOf(simulation);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <PageHeader icon={FlaskConical} subtitle="Rendement & prédiction · Sénégal" />

            <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
                {/* Formulaire */}
                <FilterBar
                    onSubmit={submit}
                    onReset={() => {
                        setDraft(INITIAL_DRAFT);
                        setErrors({});
                    }}
                    canReset={JSON.stringify(draft) !== JSON.stringify(INITIAL_DRAFT)}
                    gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    actions={
                        <button
                            type="submit"
                            disabled={optionsQuery.isPending || optionsQuery.isError}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                            <Play size={14} /> <span className="text-xs">Simuler</span>
                        </button>
                    }
                    footer={
                        optionsQuery.isError ? (
                            <span className="text-red-700">Options du modèle indisponibles : {errorMessage(optionsQuery.error)}</span>
                        ) : (
                            <>Pluie et température facultatives : laissées vides, le modèle utilise le climat observé de la campagne, sinon la normale de la région.</>
                        )
                    }
                >
                    <FilterSelect label="Culture" value={draft.produit} options={options?.produit ?? []} allLabel={null} onChange={set("produit")} disabled={!options} />
                    <FilterSelect label="Région" value={draft.region} options={options?.region ?? []} allLabel={null} onChange={set("region")} disabled={!options} />
                    <NumberField label="Superficie" unit="ha" value={draft.superficie_ha} onChange={set("superficie_ha")} error={errors.superficie_ha} />
                    <NumberField
                        label="Année"
                        value={draft.annee}
                        step="1"
                        onChange={set("annee")}
                        error={errors.annee}
                        hint={`Données d'entraînement jusqu'en ${ANNEE_FIN_DONNEES}`}
                    />
                    <FilterSelect label="Saison" value={draft.saison} options={options?.saison ?? []} allLabel={null} onChange={set("saison")} disabled={!options} />
                    <FilterSelect
                        label="Système de production"
                        value={draft.systeme_production}
                        options={options?.systeme_production ?? []}
                        allLabel={null}
                        onChange={set("systeme_production")}
                        disabled={!options}
                    />
                    <NumberField
                        label="Pluie cumulée (et si…)"
                        unit="mm"
                        placeholder="Observée / normale"
                        value={draft.pluie_cumul_mm}
                        onChange={set("pluie_cumul_mm")}
                        error={errors.pluie_cumul_mm}
                    />
                    <NumberField
                        label="Température moyenne (et si…)"
                        unit="°C"
                        placeholder="Observée / normale"
                        value={draft.tavg_moyenne}
                        onChange={set("tavg_moyenne")}
                        error={errors.tavg_moyenne}
                    />
                </FilterBar>

                {/* Paramètre refusé par le modèle (422) */}
                {rejected && (
                    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
                        <CircleAlert size={18} className="mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-bold">Simulation refusée par le modèle</p>
                            <p className="mt-1 text-xs leading-5">{errorMessage(simulation.error)}</p>
                        </div>
                    </div>
                )}

                {/* Avertissements */}
                {result && result.avertissements.length > 0 && (
                    <section role="status" aria-label="Avertissements" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                        <p className="flex items-center gap-2 text-sm font-bold">
                            <TriangleAlert size={18} /> {result.avertissements.length} avertissement{result.avertissements.length > 1 ? "s" : ""} sur la fiabilité
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-6 text-xs leading-5">
                            {result.avertissements.map((message) => (
                                <li key={message}>{message}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Résultat */}
                {submitted === null ? (
                    <ChartCard title="Résultat" status={{ kind: "empty", message: "Renseigne la campagne puis lance la simulation." }} />
                ) : (
                    !rejected && (
                        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Résultat de la simulation">
                            <KpiCard
                                label="Rendement prédit"
                                icon={Sprout}
                                status={resultStatus}
                                value={fmt.dec2(result?.rendement_t_ha)}
                                unit="t/ha"
                                hint={
                                    isNum(result?.reperes.erreur_moyenne_test_t_ha)
                                        ? `Erreur moyenne en test : ± ${fmt.dec2(result.reperes.erreur_moyenne_test_t_ha)} t/ha`
                                        : "Erreur de test non disponible"
                                }
                            />
                            <KpiCard
                                label="Production estimée"
                                icon={Wheat}
                                status={resultStatus}
                                value={fmt.int(result?.production_t)}
                                unit="t"
                                hint={`Sur ${fmt.int(submitted.superficie_ha)} ha`}
                            />
                            <KpiCard
                                label="Climat utilisé"
                                icon={CloudRain}
                                status={resultStatus}
                                value={fmt.int(result?.climat.pluie_cumul_mm)}
                                unit="mm"
                                hint={
                                    result && (
                                        <>
                                            {SOURCE_LABEL[result.climat.source]} · {fmt.dec1(result.climat.tavg_moyenne)} °C · station {result.climat.station_utilisee}
                                        </>
                                    )
                                }
                            />
                            <KpiCard
                                label="Pluie normale (région, saison)"
                                icon={Ruler}
                                status={resultStatus}
                                value={fmt.int(result?.climat.pluie_normale_mm)}
                                unit="mm"
                                hint={result && <>Modèle {result.modele_version}</>}
                            />
                        </section>
                    )
                )}

                {submitted !== null && !rejected && (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* Scénarios de pluie */}
                        <ChartCard
                            title="Rendement prédit selon la pluie"
                            subtitle={`${submitted.produit} · ${submitted.region} · ${submitted.annee} · 200 → 1 000 mm, pas de 50 mm`}
                            status={
                                result === undefined
                                    ? resultStatus
                                    : scenario.isPending
                                      ? { kind: "loading" }
                                      : scenario.error
                                        ? { kind: "error", message: errorMessage(scenario.error) }
                                        : { kind: "ready" }
                            }
                            footer={
                                <span className="flex items-start gap-1.5">
                                    <Info size={13} className="mt-0.5 shrink-0" />
                                    Réponse du modèle à la seule pluie, les autres paramètres restant fixés ({PLUIES_SCENARIO.length} simulations). Ligne
                                    pointillée : pluie normale ; point : climat utilisé ci-dessus.
                                </span>
                            }
                        >
                            {result && (
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={scenario.points} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
                                        <CartesianGrid stroke={COLORS.grid} vertical={false} />
                                        <XAxis
                                            type="number"
                                            dataKey="pluie"
                                            domain={[200, 1000]}
                                            ticks={[200, 400, 600, 800, 1000]}
                                            tick={AXIS_TICK}
                                            tickLine={false}
                                            label={{ value: "Pluie cumulée (mm)", position: "insideBottom", offset: -4, fontSize: 11, fill: COLORS.reference }}
                                            height={40}
                                        />
                                        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => fmt.dec1(Number(v))} />
                                        <Tooltip
                                            contentStyle={TOOLTIP_STYLE}
                                            labelFormatter={(pluie) => `Pluie ${fmt.int(Number(pluie))} mm`}
                                            formatter={(value) => [`${fmt.dec2(Number(value))} t/ha`, "Rendement prédit"]}
                                        />
                                        <ReferenceLine
                                            x={result.climat.pluie_normale_mm}
                                            stroke={COLORS.reference}
                                            strokeDasharray="4 4"
                                            label={{ value: "normale", position: "top", fontSize: 11, fill: COLORS.reference }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="rendement"
                                            stroke={COLORS.prediction}
                                            strokeWidth={2}
                                            dot={{ r: 2 }}
                                            activeDot={{ r: 4 }}
                                            connectNulls={false}
                                            isAnimationActive={false}
                                        />
                                        {result.climat.pluie_cumul_mm >= 200 && result.climat.pluie_cumul_mm <= 1000 && (
                                            <ReferenceDot
                                                x={result.climat.pluie_cumul_mm}
                                                y={result.rendement_t_ha}
                                                r={6}
                                                fill={COLORS.prediction}
                                                stroke="#fff"
                                                strokeWidth={2}
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        {/* Rendement observé */}
                        <ChartCard
                            title="Rendement observé"
                            subtitle={`${submitted.produit} · ${submitted.region} · toutes saisons et systèmes (Σ production / Σ superficie)`}
                            status={statusOf(observed, observedSeries.length === 0, "Aucun rendement observé pour cette culture dans cette région.")}
                            busy={observed.isPlaceholderData}
                            actions={
                                result && (
                                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
                                        <p className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                                            <Target size={12} /> Prédiction vs moyenne historique
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {fmt.dec2(result.rendement_t_ha)} vs {fmt.dec2(result.reperes.rendement_moyen_historique_t_ha)} t/ha
                                            <span className={`ml-2 ${isNum(ecartHistorique) && ecartHistorique < 0 ? "text-red-700" : "text-emerald-700"}`}>
                                                {fmt.pct(ecartHistorique, true)}
                                            </span>
                                        </p>
                                    </div>
                                )
                            }
                            footer="Moyenne historique : repère du modèle (région × culture). Courbe : rendements observés par année via /api/v1/agroclimat/agregats."
                        >
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={observedSeries} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                                    <CartesianGrid stroke={COLORS.grid} vertical={false} />
                                    <XAxis dataKey="annee" type="number" domain={["dataMin", "dataMax"]} tick={AXIS_TICK} tickLine={false} />
                                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => fmt.dec1(Number(v))} />
                                    <Tooltip
                                        contentStyle={TOOLTIP_STYLE}
                                        labelFormatter={(annee) => `Année ${annee}`}
                                        formatter={(value) => [`${fmt.dec2(Number(value))} t/ha`, "Rendement observé"]}
                                    />
                                    {result && isNum(result.reperes.rendement_moyen_historique_t_ha) && (
                                        <ReferenceLine
                                            y={result.reperes.rendement_moyen_historique_t_ha}
                                            stroke={COLORS.reference}
                                            strokeDasharray="4 4"
                                            label={{ value: "moyenne historique", position: "insideTopLeft", fontSize: 11, fill: COLORS.reference }}
                                        />
                                    )}
                                    {result && (
                                        <ReferenceLine
                                            y={result.rendement_t_ha}
                                            stroke={COLORS.prediction}
                                            strokeWidth={2}
                                            label={{ value: "prédiction", position: "insideTopRight", fontSize: 11, fill: COLORS.prediction }}
                                        />
                                    )}
                                    <Line
                                        type="monotone"
                                        dataKey="rendement"
                                        stroke={COLORS.observe}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                        connectNulls={false}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Prediction;
