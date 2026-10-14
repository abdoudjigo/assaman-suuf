/* =========================================================
   Référentiel des 14 régions du Sénégal
   Clé de jointure unique entre le GeoJSON (noms accentués,
   « Saint Louis » / « Saint-Louis ») et l'API (sans accents) :
   normaliserRegion(). Ne pas comparer les noms autrement.
   ========================================================= */

/** "Kédougou" | "KEDOUGOU" | "Saint Louis" | "saint_louis" → "kedougou" | "saint-louis". */
export function normaliserRegion(nom: string | null | undefined): string {
    return (nom ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[\s_'’-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** Noms officiels (affichage), dans l'ordre alphabétique. */
export const REGIONS_SENEGAL = [
    "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda",
    "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor",
] as const;

const NOM_PAR_CLE: Record<string, string> = Object.fromEntries(REGIONS_SENEGAL.map((nom) => [normaliserRegion(nom), nom]));

export const CLES_REGIONS = Object.keys(NOM_PAR_CLE);

export const estRegionConnue = (cle: string) => cle in NOM_PAR_CLE;

/** Nom officiel accentué d'une clé normalisée (ou la clé si elle est inconnue). */
export const nomRegion = (cle: string) => NOM_PAR_CLE[cle] ?? cle;

/** Régions sans station climatique : leurs indicateurs climatiques sont absents par construction. */
export const REGIONS_SANS_STATION = new Set(["Fatick", "Kaffrine", "Sédhiou"].map(normaliserRegion));

/* Coordonnées [lat, lon] des stations synoptiques (référence OMM / GHCN, au centième de degré).
 * L'API /api/v1/stations ne fournit pas de coordonnées : à remplacer par lat/lon de DIM_STATION dès qu'elles existent.
 * Clé : station_nom normalisé, tel que produit par dbt (dim_station.sql). */
const COORDONNEES: [string, [number, number]][] = [
    ["Dakar/Yoff", [14.74, -17.49]],
    ["Dakar-Ouakam", [14.72, -17.47]],
    ["Diourbel", [14.65, -16.23]],
    ["Kaolack", [14.13, -16.07]],
    ["Kedougou", [12.57, -12.22]],
    ["Kolda", [12.88, -14.97]],
    ["Linguere", [15.38, -15.12]],
    ["Matam/Ouro Sogui", [15.65, -13.25]],
    ["Podor", [16.65, -14.97]],
    ["Saint Louis", [16.05, -16.45]],
    ["Tambacounda", [13.77, -13.68]],
    ["Thies", [14.80, -16.95]],
    ["Ziguinchor", [12.55, -16.27]],
    ["Cap Skiring", [12.40, -16.75]],
];

const COORDONNEES_PAR_CLE = Object.fromEntries(COORDONNEES.map(([nom, c]) => [normaliserRegion(nom), c]));

export const coordonneesStation = (stationNom: string | null | undefined): [number, number] | null =>
    COORDONNEES_PAR_CLE[normaliserRegion(stationNom)] ?? null;
