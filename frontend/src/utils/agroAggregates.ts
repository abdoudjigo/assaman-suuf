/* =========================================================
   Filtres et formatage du Dashboard
   Les agrégats sont calculés côté API (/api/v1/agroclimat/agregats,
   /nuage, /api/v1/climat/annuel) : rendement = Σ production / Σ superficie,
   null ignoré et jamais converti en 0. Le client ne fait qu'afficher.
   ========================================================= */

export const isNum = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

export type DashboardFilters = {
    annee: number | null;
    region: string | null;
    categorie: string | null;
    produit: string | null;
    systeme: string | null;
};

export const EMPTY_FILTERS: DashboardFilters = {
    annee: null,
    region: null,
    categorie: null,
    produit: null,
    systeme: null,
};

export const pctChange = (current: number | null | undefined, previous: number | null | undefined): number | null =>
    isNum(current) && isNum(previous) && previous !== 0 ? ((current - previous) / previous) * 100 : null;

/* ---------- Formatage ---------- */

const nf = (digits: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const NF0 = nf(0);
const NF1 = nf(1);
const NF2 = nf(2);
const COMPACT = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

export const fmt = {
    int: (v: number | null | undefined) => (isNum(v) ? NF0.format(v) : "—"),
    dec1: (v: number | null | undefined) => (isNum(v) ? NF1.format(v) : "—"),
    dec2: (v: number | null | undefined) => (isNum(v) ? NF2.format(v) : "—"),
    compact: (v: number | null | undefined) => (isNum(v) ? COMPACT.format(v) : "—"),
    pct: (v: number | null | undefined, signed = false) =>
        isNum(v) ? `${signed && v > 0 ? "+" : ""}${NF1.format(v)} %` : "—",
};
