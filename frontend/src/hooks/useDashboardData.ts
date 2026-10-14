import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
    fetchAgregats,
    fetchAllPages,
    fetchClimatAnnuel,
    fetchNuage,
    type GroupBy,
    type ProduitItem,
    type ZoneItem,
} from "../services/dashboardApi";
import type { DashboardFilters } from "../utils/agroAggregates";

/* Les données changent au rythme des pipelines (quotidien) : chaque
 * combinaison de filtres est mise en cache pour la session. Pendant un
 * changement de filtre, l'ancien résultat reste affiché (placeholderData). */
const CACHE = { staleTime: 60 * 60_000, gcTime: 2 * 60 * 60_000, retry: 1, placeholderData: keepPreviousData } as const;

export const useAgregats = (groupBy: GroupBy, filters: DashboardFilters) =>
    useQuery({
        queryKey: ["dashboard", "agregats", groupBy, filters],
        queryFn: ({ signal }) => fetchAgregats(groupBy, filters, signal),
        ...CACHE,
    });

export const useNuage = (filters: DashboardFilters, limite: number) =>
    useQuery({
        queryKey: ["dashboard", "nuage", filters, limite],
        queryFn: ({ signal }) => fetchNuage(filters, limite, signal),
        ...CACHE,
    });

export const useClimatAnnuel = (region: string | null) =>
    useQuery({
        queryKey: ["dashboard", "climat-annuel", region],
        queryFn: ({ signal }) => fetchClimatAnnuel(region, signal),
        ...CACHE,
    });

export const useZones = () =>
    useQuery({
        queryKey: ["dashboard", "zones"],
        queryFn: ({ signal }) => fetchAllPages<ZoneItem>("/api/v1/zones", signal),
        ...CACHE,
    });

export const useProduits = () =>
    useQuery({
        queryKey: ["dashboard", "produits"],
        queryFn: ({ signal }) => fetchAllPages<ProduitItem>("/api/v1/produits", signal),
        ...CACHE,
    });
