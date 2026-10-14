/* =========================================================
   Types de la simulation de rendement
   Contrat attendu de POST /api/v1/predictions/simulation et
   GET /api/v1/predictions/simulation/options (voir ml/scripts/simulation.py
   et ml/service_prediction.py).
   ========================================================= */

export type SimulationOptions = {
    produit: string[];
    region: string[];
    saison: string[];
    systeme_production: string[];
};

export type SimulationRequest = {
    produit: string;
    region: string;
    superficie_ha: number; // > 0
    annee: number; // 1960–2100
    saison: string; // "Principale" par défaut
    systeme_production: string; // "Pluvial" par défaut
    // Scénario « et si… » : null = climat observé, sinon normale de la région.
    pluie_cumul_mm: number | null;
    tavg_moyenne: number | null;
};

export type ClimatSource = "saisie_utilisateur" | "observe" | "normale_region";

export type ClimatUtilise = {
    source: ClimatSource;
    pluie_cumul_mm: number;
    // null possible : la normale de Thies n'a pas de température (NaN dans le modèle).
    tavg_moyenne: number | null;
    pluie_normale_mm: number;
    station_utilisee: string;
};

export type Reperes = {
    rendement_moyen_historique_t_ha: number | null;
    erreur_moyenne_test_t_ha: number | null;
};

export type SimulationResponse = {
    rendement_t_ha: number;
    production_t: number;
    climat: ClimatUtilise;
    reperes: Reperes;
    modele_version: string;
    avertissements: string[];
};

/** Erreur normalisée : status 422 = paramètre refusé par le modèle (message à afficher). */
export class PredictionError extends Error {
    readonly status: number | null;

    constructor(message: string, status: number | null) {
        super(message);
        this.name = "PredictionError";
        this.status = status;
    }
}
