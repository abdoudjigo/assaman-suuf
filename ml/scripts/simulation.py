"""Simulation du rendement à partir des paramètres saisis par l'utilisateur.

    from ml.scripts.simulation import simuler
    simuler(produit="Mil", region="Kaolack", superficie_ha=1000, annee=2027)

Le climat de la campagne est choisi dans cet ordre :
    1. les valeurs fournies par l'utilisateur (scénario « et si… ») ;
    2. le climat observé (relevés GalsenAPI chargés dans Snowflake), si toute
       la campagne est déjà passée et mesurée ;
    3. sinon, la normale de la région pour cette saison (« année normale »).
"""

import math
from functools import lru_cache

import joblib
import pandas as pd

from ml.scripts.config import (
    FEATURES,
    FICHIER_MODELE,
    MOIS_SAISON,
    REGION_VOISINE,
    SYSTEME_PRODUCTION_DEFAUT,
)


@lru_cache(maxsize=1)
def charger_modele() -> dict:
    """Charge une seule fois le modèle entraîné."""
    if not FICHIER_MODELE.exists():
        raise FileNotFoundError(
            f"{FICHIER_MODELE} absent : lancer python -m ml.scripts.entrainement"
        )
    return joblib.load(FICHIER_MODELE)


def valeurs_acceptees() -> dict:
    """Listes des produits, régions, saisons et systèmes connus du modèle."""
    return charger_modele()["valeurs"]


def lire_climat_observe(region: str, annee: int, saison: str, conn=None) -> dict | None:
    """Climat mesuré de la campagne, lu dans Snowflake (MARTS).

    Même calcul que dbt : moyenne des stations de la région mois par mois,
    puis somme des pluies et moyenne des températures sur les mois de la
    saison. Renvoie None si un mois de la campagne n'a pas de pluie mesurée.

    `conn` : connexion Snowflake déjà ouverte (paramstyle qmark). L'API
    passe la sienne (clé RSA, rôle lecture seule) ; sans `conn`, on utilise
    la connexion du dossier ml (usage hors API). L'appelant ferme `conn`.
    """
    debut, fin = MOIS_SAISON[saison]
    requete = """
        SELECT t.mois, AVG(c.prcp_mm) AS prcp_mm, AVG(c.tavg) AS tavg
        FROM DATAFLOW360.MARTS.FCT_CLIMAT AS c
        JOIN DATAFLOW360.MARTS.DIM_STATION AS s ON c.station_key = s.station_key
        JOIN DATAFLOW360.MARTS.DIM_ZONE AS z ON s.zone_key = z.zone_key
        JOIN DATAFLOW360.MARTS.DIM_TEMPS AS t ON c.date_key = t.date_key
        WHERE z.region = ? AND t.annee = ? AND t.mois BETWEEN ? AND ?
        GROUP BY t.mois
    """
    station = REGION_VOISINE.get(region, region)

    if conn is not None:
        mois = conn.cursor().execute(requete, (station, annee, debut, fin)).fetchall()
    else:
        from ml.scripts.connexion_snowflake import connexion

        with connexion(schema="MARTS") as ma_conn:
            mois = (
                ma_conn.cursor()
                .execute(requete, (station, annee, debut, fin))
                .fetchall()
            )

    pluies = [float(p) for _, p, _ in mois if p is not None]
    if len(pluies) < fin - debut + 1:
        return None
    temperatures = [float(t) for _, _, t in mois if t is not None]
    return {
        "pluie_cumul_mm": sum(pluies),
        "tavg_moyenne": sum(temperatures) / len(temperatures) if temperatures else None,
    }


def simuler(
    produit: str,
    region: str,
    superficie_ha: float,
    annee: int,
    saison: str = "Principale",
    systeme_production: str = SYSTEME_PRODUCTION_DEFAUT,
    pluie_cumul_mm: float | None = None,
    tavg_moyenne: float | None = None,
    climat_observe: dict | None = None,
) -> dict:
    """Rendement (t/ha) et production (t) prédits pour une campagne."""
    modele = charger_modele()
    parametres = {
        "produit": produit,
        "region": region,
        "saison": saison,
        "systeme_production": systeme_production,
    }
    for nom, valeur in parametres.items():
        if valeur not in modele["valeurs"][nom]:
            raise ValueError(
                f"{nom} inconnu : {valeur!r}. Valeurs possibles : "
                f"{', '.join(modele['valeurs'][nom])}"
            )
    if superficie_ha <= 0:
        raise ValueError("superficie_ha doit être positive.")

    if (region, saison) not in modele["normales"].index:
        raise ValueError(
            f"Aucune donnée climatique historique pour la saison {saison!r} "
            f"à {region} : simulation impossible."
        )
    normale = modele["normales"].loc[(region, saison)]
    if pluie_cumul_mm is not None:
        source = "saisie_utilisateur"
    elif climat_observe is not None:
        source = "observe"
        pluie_cumul_mm = climat_observe["pluie_cumul_mm"]
        tavg_moyenne = tavg_moyenne or climat_observe["tavg_moyenne"]
    else:
        source = "normale_region"
        pluie_cumul_mm = float(normale["pluie_cumul_mm"])
    if tavg_moyenne is None:
        tavg_moyenne = float(normale["tavg_moyenne"])

    ligne = pd.DataFrame(
        [
            {
                **parametres,
                "annee": annee,
                "superficie_ha": superficie_ha,
                "pluie_cumul_mm": pluie_cumul_mm,
                "tavg_moyenne": tavg_moyenne,
            }
        ]
    )[FEATURES]
    # Un rendement ne peut pas être négatif.
    rendement = max(0.0, float(modele["pipeline"].predict(ligne)[0]))

    moyenne = modele["moyennes_historiques"].get((region, produit), math.nan)
    erreur = modele["resume"]["test"]["par_produit"].get(produit, {}).get("mae_modele")
    return {
        "rendement_t_ha": round(rendement, 3),
        "production_t": round(rendement * superficie_ha, 1),
        "climat": {
            "source": source,
            "pluie_cumul_mm": round(float(pluie_cumul_mm), 1),
            "tavg_moyenne": round(float(tavg_moyenne), 2),
            "pluie_normale_mm": round(float(normale["pluie_cumul_mm"]), 1),
            "station_utilisee": REGION_VOISINE.get(region, region),
        },
        "reperes": {
            "rendement_moyen_historique_t_ha": (
                None if math.isnan(moyenne) else round(float(moyenne), 3)
            ),
            "erreur_moyenne_test_t_ha": None if erreur is None else round(erreur, 3),
        },
        "modele_version": modele["resume"]["version"],
    }
