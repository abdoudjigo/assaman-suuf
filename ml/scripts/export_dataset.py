"""Exporte DATAFLOW360.ML.ML_RENDEMENT_CAMPAGNE vers data/processed/.

Chaque export est daté et n'écrase jamais un export précédent.

Usage (depuis la racine du projet) :
    python -m ml.scripts.export_dataset
"""

import logging
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ml.scripts.config import DOSSIER_EXPORTS, JEU, PREFIXE_EXPORT, TABLE_DATASET
from ml.scripts.connexion_snowflake import connexion

logger = logging.getLogger(__name__)


def chemin_export(dossier: Path = DOSSIER_EXPORTS, maintenant=None) -> Path:
    """Nom daté, avec l'heure en suffixe si un export du jour existe déjà."""
    maintenant = maintenant or datetime.now(timezone.utc)
    chemin = dossier / f"{PREFIXE_EXPORT}{maintenant:%Y%m%d}.parquet"
    if chemin.exists():
        chemin = dossier / f"{PREFIXE_EXPORT}{maintenant:%Y%m%d_%H%M%S}.parquet"
    if chemin.exists():
        raise FileExistsError(f"Export déjà présent : {chemin}")
    return chemin


def dernier_export(dossier: Path = DOSSIER_EXPORTS) -> Path:
    """Chemin de l'export le plus récent."""
    exports = sorted(dossier.glob(f"{PREFIXE_EXPORT}*.parquet"))
    if not exports:
        raise FileNotFoundError(
            f"Aucun export dans {dossier}. "
            "Lancer d'abord : python -m ml.scripts.export_dataset"
        )
    return exports[-1]


def lire_dataset(chemin: Path | None = None) -> pd.DataFrame:
    """Lit un export (le plus récent par défaut)."""
    chemin = chemin or dernier_export()
    logger.info("Lecture de %s", chemin)
    return pd.read_parquet(chemin)


def exporter() -> Path:
    with connexion() as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM {TABLE_DATASET} ORDER BY observation_id")
        df = cur.fetch_pandas_all()

    # Snowflake renvoie les noms en majuscules ; dbt les a écrits en minuscules.
    df.columns = [c.lower() for c in df.columns]

    DOSSIER_EXPORTS.mkdir(parents=True, exist_ok=True)
    chemin = chemin_export()
    df.to_parquet(chemin, index=False)

    logger.info("%d lignes exportées vers %s", len(df), chemin)
    for jeu, nb in df[JEU].value_counts().sort_index().items():
        logger.info("  jeu %-5s : %5d lignes (%.1f %%)", jeu, nb, 100 * nb / len(df))
    return chemin


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    exporter()
