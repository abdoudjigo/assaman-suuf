"""Préparation du dataset d'entraînement à partir de ML_RENDEMENT_CAMPAGNE.

Une ligne = une campagne, décrite uniquement par les paramètres que
l'utilisateur pourra fournir en simulation (voir config.FEATURES).
"""

import logging

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

from ml.scripts.config import CIBLE, REGION_VOISINE, SYSTEME_PRODUCTION_DEFAUT

logger = logging.getLogger(__name__)

CLIMAT = ["pluie_cumul_mm", "tavg_moyenne"]


def climat_par_region(df: pd.DataFrame) -> pd.DataFrame:
    """Climat mesuré d'une région pour une année et une saison.

    Dans les données, toutes les campagnes d'une même région, année et saison
    ont la même fenêtre de mois, donc le même climat.
    """
    mesure = df[df["a_climat"]]
    return mesure.groupby(["region", "annee", "saison"])[CLIMAT].mean()


def preparer(df: pd.DataFrame) -> pd.DataFrame:
    """Dataset d'entraînement : une ligne par campagne avec un climat connu.

    1. systeme_production vide → Pluvial.
    2. Climat de la région, ou de la région voisine pour les 3 régions sans station.
    3. Les campagnes sans pluie connue sont écartées (pas d'imputation).
    """
    df = df.copy()
    df["systeme_production"] = df["systeme_production"].fillna(
        SYSTEME_PRODUCTION_DEFAUT
    )

    climat = climat_par_region(df)
    df["region_climat"] = df["region"].replace(REGION_VOISINE)
    df = df.drop(columns=CLIMAT).join(climat, on=["region_climat", "annee", "saison"])

    df["source_climat"] = np.where(
        df["region"] == df["region_climat"], "mesure", "region_voisine"
    )
    avec_pluie = df["pluie_cumul_mm"].notna()
    logger.info(
        "%d campagnes sur %d ont une pluie connue (%d par la région voisine) ; "
        "%d écartées",
        avec_pluie.sum(),
        len(df),
        (avec_pluie & (df["source_climat"] == "region_voisine")).sum(),
        (~avec_pluie).sum(),
    )
    return df[avec_pluie].reset_index(drop=True)


def normales(df: pd.DataFrame) -> pd.DataFrame:
    """Climat habituel de chaque région par saison : moyenne sur les années.

    Sert de climat par défaut quand l'utilisateur ne fournit pas de climat et
    qu'aucune observation n'est disponible (ex. une campagne future).
    """
    une_par_annee = df.drop_duplicates(["region", "annee", "saison"])
    return une_par_annee.groupby(["region", "saison"])[CLIMAT].mean()


def baseline(train: pd.DataFrame, autre: pd.DataFrame) -> np.ndarray:
    """Référence simple : rendement moyen de train pour la région et le produit."""
    moyennes = train.groupby(["region", "produit"])[CIBLE].mean()
    cles = pd.MultiIndex.from_frame(autre[["region", "produit"]])
    pred = pd.Series(moyennes.reindex(cles).to_numpy(), index=autre.index)
    return pred.fillna(train[CIBLE].mean()).to_numpy()


class InteractionsCulture(BaseEstimator, TransformerMixin):
    """Ajoute les effets propres à chaque culture.

    Un modèle linéaire donne le même effet à la pluie et à l'année pour toutes
    les cultures. On ajoute donc :
    - le couple région × culture (niveau de rendement habituel) ;
    - pluie × culture et année × culture (une pente par culture).
    La pluie et l'année sont centrées sur leur moyenne d'entraînement.

    Défini ici et non dans entrainement.py : le modèle sauvegardé doit pouvoir
    retrouver cette classe quand l'API le recharge.
    """

    def fit(self, X, y=None):
        self.produits_ = sorted(X["produit"].unique())
        self.moyennes_ = X[["pluie_cumul_mm", "annee"]].mean()
        return self

    def transform(self, X):
        X = X.copy()
        X["region_produit"] = X["region"] + " | " + X["produit"]
        pluie = X["pluie_cumul_mm"] - self.moyennes_["pluie_cumul_mm"]
        annee = X["annee"] - self.moyennes_["annee"]
        for produit in self.produits_:
            est = X["produit"] == produit
            X[f"pluie_x_{produit}"] = pluie.where(est, 0.0)
            X[f"annee_x_{produit}"] = annee.where(est, 0.0)
        return X
