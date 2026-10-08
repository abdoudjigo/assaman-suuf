"""Configuration du modèle de simulation du rendement : chemins, colonnes, règles."""

from pathlib import Path

RACINE_PROJET = Path(__file__).resolve().parents[2]
DOSSIER_EXPORTS = RACINE_PROJET / "data" / "processed"
DOSSIER_MODELES = RACINE_PROJET / "ml" / "models"

# Modèle entraîné (non versionné dans Git, trop lourd) et ses métriques.
FICHIER_MODELE = DOSSIER_MODELES / "modele_rendement.pkl"
FICHIER_METRIQUES = DOSSIER_MODELES / "metriques.json"

TABLE_DATASET = "DATAFLOW360.ML.ML_RENDEMENT_CAMPAGNE"
PREFIXE_EXPORT = "ml_rendement_campagne_"

# --- Colonnes ----------------------------------------------------------------

CIBLE = "cible_rendement_t_ha"
JEU = "jeu"

# Les paramètres que l'utilisateur (ONG, ministère) peut fournir.
CATEGORIELLES = ["produit", "region", "saison", "systeme_production"]
NUMERIQUES = ["annee", "superficie_ha", "pluie_cumul_mm", "tavg_moyenne"]
FEATURES = CATEGORIELLES + NUMERIQUES

# --- Règles métier -----------------------------------------------------------

# La saison fixe les mois de la campagne (semis → récolte), comme dans les données.
MOIS_SAISON = {
    "Principale": (6, 11),  # juin → novembre (hivernage)
    "Contre-saison": (2, 7),  # février → juillet
}

# Un système de production non renseigné est pluvial, le cas par défaut.
SYSTEME_PRODUCTION_DEFAUT = "Pluvial"

# Fatick, Kaffrine et Sedhiou n'ont pas de station météo : on utilise le
# climat de la région voisine la plus proche qui en a une. C'est une règle
# métier (proximité géographique), appliquée à l'entraînement et à la simulation.
REGION_VOISINE = {
    "Kaffrine": "Kaolack",
    "Fatick": "Kaolack",
    "Sedhiou": "Kolda",
}

# --- Modèle ------------------------------------------------------------------

# Modèles comparés et valeurs de régularisation (alpha) testées. Chaque
# candidat apprend sur 1960-2005 et est jugé sur les années 2006-2010 de train :
# on garde celui dont l'erreur (MAE) est la plus faible.
CANDIDATS = {
    "lineaire": [None],
    "ridge": [0.1, 1.0, 10.0, 100.0],
    "lasso": [0.0003, 0.001, 0.003, 0.01],
}
ANNEE_DEBUT_VALIDATION = 2006

# Cultures pluviales utilisées pour vérifier la cohérence avec la pluie.
CULTURES_PLUVIALES = ["Arachide (en coque)", "Maïs", "Mil", "Niébé", "Sorgho"]
