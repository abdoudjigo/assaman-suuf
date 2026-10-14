import axios from "axios";
import type { DashboardFilters } from "../utils/agroAggregates";

/* =========================================================
   Client API du Dashboard
   Agrégats calculés côté FastAPI/Snowflake ; seules les petites
   tables de référence (zones, produits) sont paginées.
   ========================================================= */

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";

const PAGE_SIZE = 200;

const http = axios.create({
    baseURL: API_BASE_URL,
    headers: { Accept: "application/json" },
    timeout: 60000,
});

/* ---------- Types ---------- */

export type GroupBy = "total" | "annee" | "region" | "produit" | "categorie" | "systeme_production";

export type AgregatItem = {
    cle: string | number | null;
    nb_campagnes: number;
    production_t: number | null;
    superficie_ha: number | null;
    nb_campagnes_rendement: number;
    rendement_t_ha: number | null;
    nb_avec_climat: number;
    nb_climat_renseigne: number;
    couverture_climat_pct: number | null;
};

export type NuagePoint = {
    pluie_cumul_mm: number;
    rendement_t_ha: number;
    produit: string;
    region: string | null;
    annee: number | null;
};

export type NuageResponse = { total: number; data: NuagePoint[] };

export type ClimatAnnuelItem = {
    annee: number;
    pluie_cumul_mm: number | null;
    nb_stations_pluie: number;
    tavg_moyenne: number | null;
    nb_stations_temperature: number;
};

export type ZoneItem = { zone_key: string | null; region: string | null };

export type ProduitItem = { produit_key: string | null; produit: string | null; categorie: string | null };

export type StationItem = {
    station_key: string | null;
    station: string | null;
    station_nom: string | null;
    zone_key: string | null;
    region: string | null;
};

/** Ligne de /api/v1/agroclimat : une campagne enrichie du climat (seuls les champs utilisés sont typés). */
export type CampagneItem = {
    observation_id: string | null;
    region: string | null;
    produit: string | null;
    annee: number | null;
    systeme_production: string | null;
    superficie_ha: number | null;
    production_t: number | null;
    a_climat: boolean | null;
};

/** Ligne de /api/v1/climat : une observation station × mois. */
export type ClimatItem = {
    station_key: string | null;
    region: string | null;
    annee: number | null;
    mois: number | null;
    tavg: number | null;
    prcp_mm: number | null;
};

/* ---------- Routes ---------- */

// axios omet les paramètres undefined : un filtre vide n'est pas envoyé.
const filterParams = (filters: DashboardFilters) => ({
    annee: filters.annee ?? undefined,
    region: filters.region ?? undefined,
    produit: filters.produit ?? undefined,
    categorie: filters.categorie ?? undefined,
    systeme_production: filters.systeme ?? undefined,
});

export async function fetchAgregats(groupBy: GroupBy, filters: DashboardFilters, signal?: AbortSignal) {
    const response = await http.get<{ group_by: GroupBy; data: AgregatItem[] }>("/api/v1/agroclimat/agregats", {
        params: { group_by: groupBy, ...filterParams(filters) },
        signal,
    });
    return response.data.data;
}

export async function fetchNuage(filters: DashboardFilters, limite: number, signal?: AbortSignal) {
    const response = await http.get<NuageResponse>("/api/v1/agroclimat/nuage", {
        params: { limite, ...filterParams(filters) },
        signal,
    });
    return response.data;
}

export async function fetchClimatAnnuel(region: string | null, signal?: AbortSignal) {
    const response = await http.get<{ data: ClimatAnnuelItem[] }>("/api/v1/climat/annuel", {
        params: { region: region ?? undefined },
        signal,
    });
    return response.data.data;
}

type Paginated<T> = { data: T[]; pagination: { total_pages: number } };

/** Requêtes de pages simultanées au plus : chaque page déclenche un COUNT + SELECT Snowflake. */
const MAX_PAGES_PARALLELES = 6;

/** Charge toutes les pages d'une route paginée (200 lignes/page), dans l'ordre. */
export async function fetchAllPages<T>(path: string, signal?: AbortSignal): Promise<T[]> {
    const getPage = (page: number) =>
        http.get<Paginated<T>>(path, { params: { page, page_size: PAGE_SIZE }, signal }).then((r) => r.data);

    const first = await getPage(1);
    const totalPages = Math.max(1, first.pagination?.total_pages ?? 1);
    const pages: Paginated<T>[] = [first];

    let next = 2;
    const worker = async () => {
        while (next <= totalPages) {
            const page = next++;
            pages[page - 1] = await getPage(page);
        }
    };
    await Promise.all(Array.from({ length: Math.min(MAX_PAGES_PARALLELES, totalPages - 1) }, worker));

    return pages.flatMap((page) => page.data ?? []);
}

export function getApiErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
        if (typeof detail === "string") return detail;
        if (error.code === "ECONNABORTED") return "La requête a dépassé le délai d'attente autorisé.";
        if (!error.response) {
            return "Impossible de joindre l'API. Vérifie que le serveur FastAPI est démarré et que VITE_API_BASE_URL est correcte.";
        }
        if (error.response.status === 404) return "Route introuvable : l'API déployée n'expose peut-être pas encore les routes d'agrégats.";
        return `Erreur HTTP ${error.response.status}`;
    }
    return error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
}
