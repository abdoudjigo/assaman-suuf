import axios from "axios";
import { API_BASE_URL } from "../dashboardApi";
import {
    PredictionError,
    type SimulationOptions,
    type SimulationRequest,
    type SimulationResponse,
} from "../../types/prediction";

/* =========================================================
   Client de simulation du rendement (modèle ML via FastAPI)
   GET  /api/v1/predictions/simulation/options
   POST /api/v1/predictions/simulation
   ========================================================= */

const http = axios.create({
    baseURL: API_BASE_URL,
    headers: { Accept: "application/json" },
    timeout: 60000,
});

/** FastAPI : detail = message (HTTPException) ou liste d'erreurs pydantic (validation). */
function toPredictionError(error: unknown): PredictionError {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? null;
        const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;

        if (typeof detail === "string") return new PredictionError(detail, status);
        if (Array.isArray(detail)) {
            const message = detail
                .map((d: { loc?: unknown[]; msg?: string }) => `${(d.loc ?? []).slice(1).join(".")} : ${d.msg ?? ""}`)
                .join(" · ");
            return new PredictionError(message || "Paramètres invalides.", status);
        }
        if (status === 404) return new PredictionError("Route de simulation introuvable sur l'API.", status);
        if (status === 503) return new PredictionError("Modèle indisponible côté API.", status);
        if (!error.response) return new PredictionError("Impossible de joindre l'API de prédiction.", null);
        return new PredictionError(`Erreur HTTP ${status}`, status);
    }
    return new PredictionError(error instanceof Error ? error.message : "Erreur inconnue.", null);
}

export const predictionClient = {
    async options(signal?: AbortSignal): Promise<SimulationOptions> {
        try {
            const response = await http.get<SimulationOptions>("/api/v1/predictions/simulation/options", { signal });
            return response.data;
        } catch (error) {
            throw toPredictionError(error);
        }
    },

    async simuler(request: SimulationRequest, signal?: AbortSignal): Promise<SimulationResponse> {
        try {
            const response = await http.post<SimulationResponse>("/api/v1/predictions/simulation", request, { signal });
            return response.data;
        } catch (error) {
            throw toPredictionError(error);
        }
    },
};
