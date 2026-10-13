import { SOURCE_ANOMALIES } from "../config.js";
import { anomalieAgricole } from "../utils/anomalies.js";

// Fournit les anomalies agricoles à partir de la source configurée.
export function chargerAnomalies(lignes, options = {}) {
  if (SOURCE_ANOMALIES === "historique") {
    return anomalieAgricole(lignes, options);
  }

  if (SOURCE_ANOMALIES === "modele") {
    // La route actuelle prédit une campagne à la fois ; il faut une route groupée ou une table de prédictions.
    throw new Error(
      "La source modèle n'est pas encore disponible pour l'analyse groupée.",
    );
  }

  throw new Error(`Source d'anomalies inconnue : ${SOURCE_ANOMALIES}`);
}
