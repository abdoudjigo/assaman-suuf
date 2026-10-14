import { useEffect, useState } from "react";
import { normaliserRegion as norm } from "../utils/regions";

const API = import.meta.env.VITE_API_BASE_URL ?? "";

export type ZoneValue = { rainfall: number; temperature: number; ndvi: number; drought: number };
export type ZoneValues = Record<string, ZoneValue>;

export type ZoneSummary = {
    source: "api" | "demo";
    updatedAt: string;
    kpis: ZoneValue & { waterStress: number };
    crops: { name: string; yield: number; national: number }[]; // t/ha
    rainfallMonthly: number[]; // 12 valeurs en mm
    history: { year: number; value: number }[]; // rendement de la culture principale
    alerts: { level: "low" | "medium" | "high"; text: string }[];
};

/* Valeurs indicatives, utilisées tant que l'API ne répond pas. */
export const DEMO_VALUES: ZoneValues = {
    "Saint-Louis": { rainfall: 280, temperature: 29.5, ndvi: 0.32, drought: 55 },
    Louga: { rainfall: 330, temperature: 29.8, ndvi: 0.28, drought: 70 },
    Matam: { rainfall: 400, temperature: 31, ndvi: 0.31, drought: 62 },
    Dakar: { rainfall: 420, temperature: 27.5, ndvi: 0.22, drought: 35 },
    Thiès: { rainfall: 500, temperature: 28, ndvi: 0.35, drought: 48 },
    Diourbel: { rainfall: 470, temperature: 29, ndvi: 0.33, drought: 58 },
    Fatick: { rainfall: 580, temperature: 28.8, ndvi: 0.42, drought: 42 },
    Kaolack: { rainfall: 640, temperature: 29, ndvi: 0.46, drought: 38 },
    Kaffrine: { rainfall: 700, temperature: 29.2, ndvi: 0.5, drought: 36 },
    Tambacounda: { rainfall: 760, temperature: 30.5, ndvi: 0.52, drought: 40 },
    Kédougou: { rainfall: 1050, temperature: 29.5, ndvi: 0.68, drought: 18 },
    Kolda: { rainfall: 950, temperature: 28.5, ndvi: 0.66, drought: 20 },
    Sédhiou: { rainfall: 1000, temperature: 28, ndvi: 0.67, drought: 18 },
    Ziguinchor: { rainfall: 1150, temperature: 27.6, ndvi: 0.7, drought: 14 },
};

/* Accepte /api/v1/zones sous forme de tableau [{name, rainfall, ...}] ou d'objet {nom: {...}}. */
export function toZoneValues(payload: unknown): ZoneValues {
    if (Array.isArray(payload) && payload.length && payload.every((p) => p && typeof p === "object" && "name" in p)) {
        return Object.fromEntries(payload.map((p: any) => [p.name, p as ZoneValue]));
    }
    if (payload && typeof payload === "object" && !Array.isArray(payload) && Object.keys(payload).length) return payload as ZoneValues;
    return DEMO_VALUES;
}

const W = [0, 0, 0, 0.002, 0.012, 0.07, 0.19, 0.31, 0.26, 0.12, 0.03, 0.004];
const NATIONAL: Record<string, number> = { Arachide: 1.05, Mil: 0.8, Maïs: 2.2, Riz: 3 };

function demoSummary(zone: string): ZoneSummary {
    const v = Object.entries(DEMO_VALUES).find(([k]) => norm(k) === norm(zone))?.[1] ?? { rainfall: 600, temperature: 29, ndvi: 0.45, drought: 40 };
    const k = Math.min(1.3, v.rainfall / 600);
    const crops = Object.entries(NATIONAL).map(([name, national]) => ({ name, national, yield: +(national * (0.7 + 0.5 * k)).toFixed(2) }));
    const main = crops[0].yield;
    const alerts: ZoneSummary["alerts"] = [];
    if (v.drought >= 60) alerts.push({ level: "high", text: "Risque de sécheresse élevé : privilégier les variétés à cycle court." });
    else if (v.drought >= 35) alerts.push({ level: "medium", text: "Risque de sécheresse modéré : suivre les cumuls décadaires." });
    if (v.temperature >= 31) alerts.push({ level: "medium", text: "Stress thermique possible en phase de floraison." });
    if (!alerts.length) alerts.push({ level: "low", text: "Aucune alerte active sur la zone." });
    return {
        source: "demo",
        updatedAt: new Date().toISOString(),
        kpis: { ...v, waterStress: Math.round(v.drought * 0.9) },
        crops,
        rainfallMonthly: W.map((w) => Math.round(w * v.rainfall)),
        history: [[2022, 0.94], [2023, 0.88], [2024, 1.07], [2025, 1]].map(([year, f]) => ({ year, value: +(main * f).toFixed(2) })),
        alerts,
    };
}

/* Résumé d'une zone, rafraîchi toutes les `refreshMs` (en pause si l'onglet est masqué).
 * Endpoint attendu : GET /api/v1/zones/{nom}/summary -> ZoneSummary (sans "source"). */
export function useZoneSummary(zone: string | null, refreshMs = 60_000) {
    const [data, setData] = useState<ZoneSummary | null>(null);

    useEffect(() => {
        if (!zone) { setData(null); return; }
        const ctrl = new AbortController();
        const load = async () => {
            try {
                const r = await fetch(`${API}/api/v1/zones/${encodeURIComponent(zone)}/summary`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
                if (!r.ok) throw new Error(String(r.status));
                setData({ ...(await r.json()), source: "api" });
            } catch {
                if (!ctrl.signal.aborted) setData(demoSummary(zone));
            }
        };
        load();
        const id = setInterval(() => { if (!document.hidden) load(); }, refreshMs);
        return () => { ctrl.abort(); clearInterval(id); };
    }, [zone, refreshMs]);

    return data;
}
