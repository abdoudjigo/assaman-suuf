import { useCallback, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import {
    fetchAllPages,
    fetchCampagnesCarte,
    fetchClimatCarte,
    getApiErrorMessage,
    fetchOptionsCarte,
    retryApiDelay,
    retryApiRequest,
    type StationItem,
} from "../services/dashboardApi";
import { useZones } from "./useDashboardData";
import type { BlockStatus } from "../components/dashboard/DashboardBlocks";
import { getIndicateur, INDICATEURS, type Indicateur } from "../config/mapIndicators";
import {
    anneesAvecDonnees,
    construireEchelle,
    couvertureClimat,
    evolution,
    indexerCampagnesCarte,
    indexerClimatCarte,
    statsRegions,
    valeurIndicateur,
    type CarteFiltres,
    type SourcesCarte,
} from "../utils/cartographieAggregates";
import { estRegionConnue, normaliserRegion } from "../utils/regions";

/* Les agrégats compacts de carte sont chargés une fois par session et gardés
 * en cache ; pendant un changement de filtre, les résultats précédents restent visibles. */
const CACHE_SESSION = {
    staleTime: Infinity,
    gcTime: Infinity,
    retry: retryApiRequest,
    retryDelay: retryApiDelay,
    placeholderData: keepPreviousData,
} as const;

export type RegionsGeo = FeatureCollection<Polygon | MultiPolygon, { code: string; nom: string }>;

const GEOJSON_REGIONS = "/data/senegal-regions.geojson";

export const useRegionsGeo = () =>
    useQuery({
        queryKey: ["cartographie", "regions-geo"],
        queryFn: async ({ signal }) => {
            const response = await fetch(GEOJSON_REGIONS, { signal });
            if (!response.ok) throw new Error(`Tracés des régions introuvables (${GEOJSON_REGIONS}, HTTP ${response.status}).`);
            return (await response.json()) as RegionsGeo;
        },
        ...CACHE_SESSION,
    });

export const useCampagnes = (produit: string | null, systeme: string | null) =>
    useQuery({
        queryKey: ["cartographie", "agroclimat", produit, systeme],
        queryFn: ({ signal }) => fetchCampagnesCarte(produit, systeme, signal),
        ...CACHE_SESSION,
    });

export const useClimatObservations = () =>
    useQuery({
        queryKey: ["cartographie", "climat"],
        queryFn: ({ signal }) => fetchClimatCarte(signal),
        ...CACHE_SESSION,
    });

export const useOptionsCarte = () =>
    useQuery({
        queryKey: ["cartographie", "options"],
        queryFn: ({ signal }) => fetchOptionsCarte(signal),
        ...CACHE_SESSION,
    });

export const useStations = () =>
    useQuery({
        queryKey: ["cartographie", "stations"],
        queryFn: ({ signal }) => fetchAllPages<StationItem>("/api/v1/stations", signal),
        ...CACHE_SESSION,
    });

export function statutRequete(query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
}): BlockStatus {
    if (query.isPending) return { kind: "loading" };
    if (query.isError) return { kind: "error", message: getApiErrorMessage(query.error), onRetry: () => query.refetch() };
    return { kind: "ready" };
}

export type LigneDetail = { indicateur: Indicateur; valeur: number | null; valeurN1: number | null; evolution: number | null };

export function useCartographie(filtres: CarteFiltres) {
    const indicateur = getIndicateur(filtres.indicateur);
    const climatique = indicateur.famille === "climat";

    const produitFiltre = climatique ? null : filtres.produit;
    const systemeFiltre = climatique ? null : filtres.systeme;
    const campagnes = useCampagnes(produitFiltre, systemeFiltre);
    const climat = useClimatObservations();
    const stations = useStations();
    const zones = useZones();
    const optionsCarte = useOptionsCarte();

    const campIdx = useMemo(
        () => (campagnes.data ? indexerCampagnesCarte(campagnes.data) : null),
        [campagnes.data],
    );
    const climIdx = useMemo(() => (climat.data ? indexerClimatCarte(climat.data) : null), [climat.data]);

    const sources: SourcesCarte = useMemo(
        () => ({ campagnes: campIdx?.index ?? null, climat: climIdx?.index ?? null, normalePluie: climIdx?.normalePluie ?? null }),
        [campIdx, climIdx],
    );

    const anneesIndicateur = useMemo(
        () => (indicateur.disponible ? anneesAvecDonnees(indicateur.id, sources) : []),
        [indicateur, sources],
    );
    const annee = filtres.annee ?? anneesIndicateur[0] ?? null;

    const regions = useMemo(
        () => (annee !== null && indicateur.disponible ? statsRegions(indicateur.id, sources, annee) : null),
        [indicateur, sources, annee],
    );
    const echelle = useMemo(
        () => construireEchelle(indicateur, regions ? [...regions.values()].map((r) => r.valeur) : []),
        [indicateur, regions],
    );
    const couverture = useMemo(() => (annee !== null ? couvertureClimat(sources, annee) : null), [sources, annee]);

    const options = useMemo(() => {
        const annees = new Set<number>();
        campagnes.data?.forEach((r) => annees.add(r.annee));
        climat.data?.forEach((r) => annees.add(r.annee));
        return {
            annees: [...annees].sort((a, b) => b - a),
            produits: optionsCarte.data?.produits ?? [],
            systemes: optionsCarte.data?.systemes ?? [],
        };
    }, [campagnes.data, climat.data, optionsCarte.data]);

    const stationsParRegion = useMemo(() => {
        const parRegion = new Map<string, StationItem[]>();
        for (const station of stations.data ?? []) {
            const cle = normaliserRegion(station.region);
            parRegion.set(cle, [...(parRegion.get(cle) ?? []), station]);
        }
        return parRegion;
    }, [stations.data]);

    /** Noms de région renvoyés par l'API qui ne correspondent à aucune des 14 régions du GeoJSON. */
    const nonApparies = useMemo(() => {
        const noms = new Set<string>([...(campIdx?.nonApparies ?? []), ...(climIdx?.nonApparies ?? [])]);
        for (const row of [...(zones.data ?? []), ...(stations.data ?? [])]) {
            if (row.region && !estRegionConnue(normaliserRegion(row.region))) noms.add(row.region);
        }
        return [...noms].sort();
    }, [campIdx, climIdx, zones.data, stations.data]);

    /** Tous les indicateurs disponibles d'une région pour l'année affichée, avec l'évolution vs N-1. */
    const detailRegion = useCallback(
        (cle: string): LigneDetail[] =>
            annee === null
                ? []
                : INDICATEURS.filter((i) => i.disponible).map((i) => {
                    const valeur = valeurIndicateur(i.id, sources, cle, annee);
                    const valeurN1 = valeurIndicateur(i.id, sources, cle, annee - 1);
                    return { indicateur: i, valeur, valeurN1, evolution: evolution(i, valeur, valeurN1) };
                }),
        [sources, annee],
    );

    const requetePrincipale = climatique ? climat : campagnes;
    let statut: BlockStatus = statutRequete(requetePrincipale);
    if (statut.kind === "ready" && regions && [...regions.values()].every((r) => r.valeur === null)) {
        statut = { kind: "empty", message: `Aucune donnée « ${indicateur.label} » pour ${annee} avec ces filtres.` };
    }
    if (statut.kind === "ready" && annee === null) statut = { kind: "empty", message: `Aucune donnée « ${indicateur.label} » disponible.` };

    return {
        indicateur,
        annee,
        anneesIndicateur,
        regions,
        echelle,
        couverture,
        options,
        statut,
        statutOptions: statutRequete(optionsCarte),
        statutStations: statutRequete(stations),
        stationsParRegion,
        nonApparies,
        detailRegion,
    };
}

export type Cartographie = ReturnType<typeof useCartographie>;
