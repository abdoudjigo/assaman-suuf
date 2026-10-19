import { useQueries, useQuery } from "@tanstack/react-query";
import { predictionClient } from "../services/prediction/predictionClient";
import { PredictionError, type SimulationRequest } from "../types/prediction";

/* Le modèle est figé entre deux entraînements : une simulation donnée
 * renvoie toujours le même résultat, on la garde en cache. */
const CACHE = { staleTime: 60 * 60_000, gcTime: 2 * 60 * 60_000 } as const;

// Pas de nouvel essai sur un 422 : le paramètre est refusé, le message suffit.
const retry = (count: number, error: unknown) =>
    !(error instanceof PredictionError && error.status !== null && error.status < 500) && count < 1;

export const PLUIES_SCENARIO = Array.from({ length: 17 }, (_, i) => 200 + i * 50); // 200 → 1000 mm

export const usePredictionOptions = () =>
    useQuery({
        queryKey: ["prediction", "options"],
        queryFn: ({ signal }) => predictionClient.options(signal),
        retry,
        ...CACHE,
    });

/** Simulation de la campagne soumise (null tant que le formulaire n'est pas envoyé). */
export const useSimulation = (request: SimulationRequest | null) =>
    useQuery({
        queryKey: ["prediction", "simulation", request],
        queryFn: ({ signal }) => predictionClient.simuler(request!, signal),
        enabled: request !== null,
        retry,
        ...CACHE,
    });

/** Rendement prédit pour chaque pluie de PLUIES_SCENARIO (un appel par point). */
export function useScenarioPluie(request: SimulationRequest | null) {
    return useQueries({
        queries: PLUIES_SCENARIO.map((pluie) => {
            const scenario = request && { ...request, pluie_cumul_mm: pluie };
            return {
                queryKey: ["prediction", "scenario-pluie", request, pluie],
                queryFn: ({ signal }: { signal: AbortSignal }) => predictionClient.simuler(scenario!, signal),
                enabled: scenario !== null,
                retry,
                ...CACHE,
            };
        }),
        combine: (results) => ({
            points: results.map((result, i) => ({ pluie: PLUIES_SCENARIO[i], rendement: result.data?.rendement_t_ha ?? null })),
            isPending: results.some((result) => result.isPending),
            error: results.find((result) => result.error)?.error ?? null,
        }),
    });
}
