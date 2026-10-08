"""Entraîne le modèle de simulation du rendement (régression linéaire, Ridge, Lasso).

Usage (depuis la racine du projet) :
    python -m ml.scripts.entrainement                  # dernier export
    python -m ml.scripts.entrainement --fichier data/processed/xxx.parquet

Étapes :
    1. préparer le dataset (donnees.preparer) ;
    2. choisir le modèle et sa régularisation sur les années 2006-2010 de train ;
    3. entraîner sur train (1960-2010) et mesurer sur test (2011-2015) ;
    4. réentraîner sur toutes les années et sauvegarder le modèle de production.

Sorties : ml/models/modele_rendement.pkl et ml/models/metriques.json.
"""

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Lasso, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml.scripts.config import (
    ANNEE_DEBUT_VALIDATION,
    CANDIDATS,
    CATEGORIELLES,
    CIBLE,
    CULTURES_PLUVIALES,
    DOSSIER_MODELES,
    FEATURES,
    FICHIER_METRIQUES,
    FICHIER_MODELE,
    JEU,
    NUMERIQUES,
)
from ml.scripts.donnees import InteractionsCulture, baseline, normales, preparer
from ml.scripts.export_dataset import dernier_export, lire_dataset

logger = logging.getLogger(__name__)


def regression(nom: str, alpha: float | None):
    if nom == "lineaire":
        return LinearRegression()
    if nom == "ridge":
        return Ridge(alpha=alpha)
    if nom == "lasso":
        return Lasso(alpha=alpha, max_iter=50_000)
    raise ValueError(f"Modèle inconnu : {nom}")


def construire_modele(nom: str, alpha: float | None = None) -> Pipeline:
    """Interactions par culture + encodage + régression linéaire.

    Les températures manquantes (aucune mesure avant 1973) sont remplacées par
    la médiane apprise sur les données d'entraînement. Les nombres sont
    standardisés pour que la pénalité de Ridge et Lasso les traite à égalité.
    """
    nombres = make_pipeline(SimpleImputer(strategy="median"), StandardScaler())
    preparation = ColumnTransformer(
        [
            (
                "categories",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORIELLES + ["region_produit"],
            ),
            ("nombres", nombres, NUMERIQUES),
            ("interactions", nombres, make_column_selector(pattern="_x_")),
        ]
    )
    return Pipeline(
        [
            ("interactions", InteractionsCulture()),
            ("preparation", preparation),
            ("regression", regression(nom, alpha)),
        ]
    )


def nom_candidat(nom: str, alpha: float | None) -> str:
    return nom if alpha is None else f"{nom} (alpha={alpha:g})"


def metriques(reel, predit) -> dict:
    return {
        "n": len(reel),
        "mae": float(mean_absolute_error(reel, predit)),
        "rmse": float(np.sqrt(mean_squared_error(reel, predit))),
        "r2": float(r2_score(reel, predit)),
    }


def choisir_modele(train) -> tuple[tuple[str, float | None], dict]:
    """Modèle et alpha dont la MAE sur 2006-2010 est la plus faible.

    Chaque candidat apprend sur 1960-2005 et est jugé sur 2006-2010 : le jeu
    de test (2011-2015) n'intervient pas dans ce choix.
    """
    app = train[train["annee"] < ANNEE_DEBUT_VALIDATION]
    val = train[train["annee"] >= ANNEE_DEBUT_VALIDATION]
    scores = {}
    for nom, alphas in CANDIDATS.items():
        for alpha in alphas:
            modele = construire_modele(nom, alpha).fit(app[FEATURES], app[CIBLE])
            mae = metriques(val[CIBLE], modele.predict(val[FEATURES]))["mae"]
            scores[(nom, alpha)] = mae
            logger.info("%-22s : MAE validation = %.3f", nom_candidat(nom, alpha), mae)
    meilleur = min(scores, key=scores.get)
    return meilleur, {nom_candidat(*c): mae for c, mae in scores.items()}


def coherence_pluie(modele, df) -> float:
    """Part des cas où plus de pluie (600 mm au lieu de 300) ne baisse pas le rendement.

    Testé pour chaque culture pluviale et chaque région, en année récente
    et en culture pluviale. Un modèle de simulation doit réagir de façon
    plausible quand l'utilisateur change la pluie.
    """
    base = {
        "saison": "Principale",
        "systeme_production": "Pluvial",
        "annee": int(df["annee"].max()),
        "superficie_ha": float(df["superficie_ha"].median()),
        "tavg_moyenne": float(df["tavg_moyenne"].median()),
    }
    cas = [
        {**base, "produit": p, "region": r}
        for p in CULTURES_PLUVIALES
        for r in sorted(df["region"].unique())
    ]
    sec = pd.DataFrame([{**c, "pluie_cumul_mm": 300.0} for c in cas])[FEATURES]
    humide = pd.DataFrame([{**c, "pluie_cumul_mm": 600.0} for c in cas])[FEATURES]
    return float(np.mean(modele.predict(humide) >= modele.predict(sec) - 1e-9))


def evaluer(train, test, modele) -> dict:
    """Métriques sur test : globales, par produit et selon l'origine du climat."""
    test = test.assign(
        prediction=modele.predict(test[FEATURES]), reference=baseline(train, test)
    )
    resultats = {
        "modele": metriques(test[CIBLE], test["prediction"]),
        "baseline_region_produit": metriques(test[CIBLE], test["reference"]),
        "par_produit": {},
        "par_source_climat": {},
    }
    for cle, colonne in (
        ("par_produit", "produit"),
        ("par_source_climat", "source_climat"),
    ):
        for valeur, groupe in test.groupby(colonne):
            resultats[cle][valeur] = {
                "n": len(groupe),
                "mae_modele": float(
                    mean_absolute_error(groupe[CIBLE], groupe["prediction"])
                ),
                "mae_baseline": float(
                    mean_absolute_error(groupe[CIBLE], groupe["reference"])
                ),
            }
    return resultats


def executer(fichier: Path | None = None) -> dict:
    fichier = fichier or dernier_export()
    df = preparer(lire_dataset(fichier))
    train, test = df[df[JEU] == "train"], df[df[JEU] == "test"]
    logger.info("train : %d campagnes, test : %d campagnes", len(train), len(test))

    (nom, alpha), scores = choisir_modele(train)
    logger.info("Modèle retenu : %s", nom_candidat(nom, alpha))

    modele = construire_modele(nom, alpha).fit(train[FEATURES], train[CIBLE])
    evaluation = evaluer(train, test, modele)
    m, b = evaluation["modele"], evaluation["baseline_region_produit"]
    logger.info(
        "Test modèle   : MAE %.3f  RMSE %.3f  R² %.3f", m["mae"], m["rmse"], m["r2"]
    )
    logger.info(
        "Test baseline : MAE %.3f  RMSE %.3f  R² %.3f", b["mae"], b["rmse"], b["r2"]
    )
    if m["mae"] >= b["mae"] or m["rmse"] >= b["rmse"]:
        logger.warning("Le modèle ne bat pas la baseline sur test.")
    coherence = coherence_pluie(modele, df)
    logger.info("Cohérence avec la pluie : %.0f %% des cas", 100 * coherence)

    # Modèle de production : mêmes réglages, appris sur toutes les années.
    production = construire_modele(nom, alpha).fit(df[FEATURES], df[CIBLE])
    version = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    resume = {
        "version": version,
        "dataset": fichier.name,
        "lignes": {"train": len(train), "test": len(test), "total": len(df)},
        "modele": {"type": nom, "alpha": alpha},
        "validation": scores,
        "test": evaluation,
        "coherence_pluie": coherence,
    }

    DOSSIER_MODELES.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": production,
            "normales": normales(df),
            # Valeurs acceptées par le modèle, pour contrôler les saisies.
            "valeurs": {c: sorted(df[c].unique().tolist()) for c in CATEGORIELLES},
            # Repère affiché à l'utilisateur : rendement moyen historique.
            "moyennes_historiques": df.groupby(["region", "produit"])[CIBLE].mean(),
            "resume": resume,
        },
        FICHIER_MODELE,
        compress=3,
    )
    FICHIER_METRIQUES.write_text(json.dumps(resume, indent=2, ensure_ascii=False))
    logger.info("Modèle %s écrit dans %s", version, FICHIER_MODELE)
    return resume


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--fichier", type=Path, help="Export à utiliser")
    executer(parser.parse_args().fichier)
