import { useCallback, useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import {
    fetchAllPages,
    getApiErrorMessage,
    type CampagneItem,
    type ClimatItem,
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
    indexerCampagnes,
    indexerClimat,
    statsRegions,
    valeurIndicateur,
    type CarteFiltres,
    type SourcesCarte,
} from "../utils/cartographieAggregates";
import { estRegionConnue, normaliserRegion } from "../utils/regions";

/* Les routes brutes sont chargées en entier une seule fois par session
 * (toutes les pages), puis filtrées et agrégées côté client. */
const CACHE_SESSION = { staleTime: Infinity, gcTime: Infinity, retry: 1 } as const;

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

export const useCampagnes = () =>
    useQuery({
        queryKey: ["cartographie", "agroclimat"],
        queryFn: ({ signal }) => fetchAllPages<CampagneItem>("/api/v1/agroclimat", signal),
        ...CACHE_SESSION,
    });

export const useClimatObservations = () =>
    useQuery({
        queryKey: ["cartographie", "climat"],
        queryFn: ({ signal }) => fetchAllPages<ClimatItem>("/api/v1/climat", signal),
        ...CACHE_SESSION,
    });

export const useStations = () =>
    useQuery({
        queryKey: ["cartographie", "stations"],
        queryFn: ({ signal }) => fetchAllPages<StationItem>("/api/v1/stations", signal),
        ...CACHE_SESSION,
    });

export function statutRequete(query: UseQueryResult<unknown>): BlockStatus {
    if (query.isPending) return { kind: "loading" };
    if (query.isError) return { kind: "error", message: getApiErrorMessage(query.error), onRetry: () => query.refetch() };
    return { kind: "ready" };
}

const uniques = (values: (string | null)[]) =>
    [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, "fr"));

export type LigneDetail = { indicateur: Indicateur; valeur: number | null; valeurN1: number | null; evolution: number | null };

export function useCartographie(filtres: CarteFiltres) {
    const indicateur = getIndicateur(filtres.indicateur);
    const climatique = indicateur.famille === "climat";

    const campagnes = useCampagnes();
    const climat = useClimatObservations();
    const stations = useStations();
    const zones = useZones();

    // Culture et système ne s'appliquent pas aux indicateurs climatiques (mesures de stations).
    const produit = climatique ? null : filtres.produit;
    const systeme = climatique ? null : filtres.systeme;

    const campIdx = useMemo(
        () => (campagnes.data ? indexerCampagnes(campagnes.data, produit, systeme) : null),
        [campagnes.data, produit, systeme],
    );
    const climIdx = useMemo(() => (climat.data ? indexerClimat(climat.data) : null), [climat.data]);

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
        campagnes.data?.forEach((r) => r.annee !== null && annees.add(r.annee));
        climat.data?.forEach((r) => r.annee !== null && annees.add(r.annee));
        return {
            annees: [...annees].sort((a, b) => b - a),
            produits: uniques(campagnes.data?.map((r) => r.produit) ?? []),
            systemes: uniques(campagnes.data?.map((r) => r.systeme_production) ?? []),
        };
    }, [campagnes.data, climat.data]);

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
        statutStations: statutRequete(stations),
        stationsParRegion,
        nonApparies,
        detailRegion,
    };
}

export type Cartographie = ReturnType<typeof useCartographie>;
