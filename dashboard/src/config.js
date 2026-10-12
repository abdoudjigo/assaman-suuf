// Centralise les options de connexion et le seuil commun d'alerte climatique.
const environnement = import.meta.env ?? {};
const apiUrl = environnement.VITE_API_URL || "http://localhost:8001";

export const API_URL = apiUrl.replace(/\/+$/, "");
export const UTILISER_API = environnement.VITE_UTILISER_API === "true";
export const SEUIL_ALERTE_MM = -100;
export const SEUIL_PLUIE_MM = -100;
export const SEUIL_PLUIE_EXCES_MM = null;
export const SEUIL_TEMPERATURE = 0.5;
export const SEUIL_ANOMALIE_AGRICOLE = -1.5;
export const HISTORIQUE_MINIMUM = 8;
export const SOURCE_ANOMALIES = "historique";
export const TAILLE_PAGE = 200;
export const COULEURS = ["#1c8fd0", "#f5a623", "#3fa34d", "#e0382b", "#55b9e6"];
