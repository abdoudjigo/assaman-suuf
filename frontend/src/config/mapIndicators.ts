/* =========================================================
   Indicateurs de la page Cartographie
   Pour activer un indicateur dès que l'API l'alimente : passer
   `disponible` à true (et brancher sa valeur dans
   utils/cartographieAggregates.ts → valeurIndicateur).
   ========================================================= */

export type IndicateurId =
    | "production"
    | "superficie"
    | "rendement"
    | "pluie"
    | "temperature"
    | "anomalie_pluie"
    | "prediction_rendement"
    | "alertes"
    | "vulnerabilite";

export type Famille = "agriculture" | "climat" | "projection";

export type Indicateur = {
    id: IndicateurId;
    label: string;
    unite: string;
    famille: Famille;
    disponible: boolean;
    description: string;
    /** Décimales d'affichage. */
    decimales: number;
    /** Échelle séquentielle (magnitude) ou divergente autour de 0 (écart). */
    echelle: "sequentielle" | "divergente";
    /** Évolution vs N-1 : variation relative (%) ou écart absolu (unité de l'indicateur). */
    evolution: "pct" | "ecart";
    /** Palette 5 classes, du plus faible au plus fort. */
    palette: readonly string[];
};

/* Rampes 5 classes (claire → foncée). Divergente : déficit rouge ↔ gris neutre ↔ excédent bleu. */
const VERT = ["#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"] as const;
const BLEU = ["#cde2fb", "#86b6ef", "#3987e5", "#1c5cab", "#0d366b"] as const;
const ORANGE = ["#fde0c5", "#f9b98a", "#eb6834", "#c4461c", "#8a2c0d"] as const;
const ROUGE_BLEU = ["#b8322f", "#e98b85", "#f0efec", "#86b6ef", "#1c5cab"] as const;

export const INDICATEURS: readonly Indicateur[] = [
    {
        id: "production", label: "Production", unite: "t", famille: "agriculture", disponible: true,
        description: "Somme des productions renseignées.", decimales: 0, echelle: "sequentielle", evolution: "pct", palette: VERT,
    },
    {
        id: "superficie", label: "Superficie", unite: "ha", famille: "agriculture", disponible: true,
        description: "Somme des superficies renseignées.", decimales: 0, echelle: "sequentielle", evolution: "pct", palette: VERT,
    },
    {
        id: "rendement", label: "Rendement", unite: "t/ha", famille: "agriculture", disponible: true,
        description: "Σ production / Σ superficie des campagnes ayant les deux valeurs.", decimales: 2, echelle: "sequentielle", evolution: "pct", palette: VERT,
    },
    {
        id: "pluie", label: "Pluie cumulée", unite: "mm", famille: "climat", disponible: true,
        description: "Cumul annuel moyen des stations de la région ayant leurs 12 mois renseignés.", decimales: 0, echelle: "sequentielle", evolution: "pct", palette: BLEU,
    },
    {
        id: "temperature", label: "Température moyenne", unite: "°C", famille: "climat", disponible: true,
        description: "Moyenne des températures mensuelles renseignées, moyennée sur les stations.", decimales: 1, echelle: "sequentielle", evolution: "ecart", palette: ORANGE,
    },
    {
        id: "anomalie_pluie", label: "Anomalie de pluie", unite: "mm", famille: "climat", disponible: true,
        description: "Pluie cumulée de l'année − moyenne de la région sur toutes les années disponibles.", decimales: 0, echelle: "divergente", evolution: "ecart", palette: ROUGE_BLEU,
    },
    {
        id: "prediction_rendement", label: "Prédiction de rendement", unite: "t/ha", famille: "projection", disponible: false,
        description: "Rendement prédit par région (modèle ML) — endpoint régional à venir.", decimales: 2, echelle: "sequentielle", evolution: "pct", palette: VERT,
    },
    {
        id: "alertes", label: "Alertes / anomalies", unite: "", famille: "projection", disponible: false,
        description: "Alertes agroclimatiques par région — service de surveillance à venir.", decimales: 0, echelle: "sequentielle", evolution: "ecart", palette: ORANGE,
    },
    {
        id: "vulnerabilite", label: "Vulnérabilité", unite: "indice", famille: "projection", disponible: false,
        description: "Indice de vulnérabilité agroclimatique — à venir.", decimales: 2, echelle: "sequentielle", evolution: "ecart", palette: ORANGE,
    },
];

export const FAMILLES: Record<Famille, string> = {
    agriculture: "Agriculture",
    climat: "Climat",
    projection: "Projections et risques",
};

export const INDICATEUR_PAR_DEFAUT: IndicateurId = "production";

export const getIndicateur = (id: IndicateurId): Indicateur => INDICATEURS.find((i) => i.id === id) ?? INDICATEURS[0];

export const estDisponible = (id: IndicateurId) => getIndicateur(id).disponible;

/** Remplissage des régions sans donnée (motif hachuré : voir HachuresDefs). */
export const COULEUR_SANS_DONNEE = "#e2e8f0";
export const COULEUR_HACHURES = "#94a3b8";
export const ID_MOTIF_HACHURES = "carto-sans-donnee";

/** Équivalent CSS du motif hachuré, pour la légende et les pastilles. */
export const STYLE_HACHURES = {
    backgroundColor: COULEUR_SANS_DONNEE,
    backgroundImage: `repeating-linear-gradient(45deg, ${COULEUR_HACHURES} 0 1.5px, transparent 1.5px 5px)`,
};
