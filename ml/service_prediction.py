"""Service de prédiction du rendement, point d'entrée unique pour l'API.

    from ml import service_prediction
    service_prediction.predire(
        produit="Mil", region="Kaolack", superficie_ha=1000, annee=2015,
        ouvrir_connexion=get_snowflake_connection,
    )

Climat utilisé, par ordre de priorité :
    1. scénario « et si… » saisi par l'utilisateur (pluie_cumul_mm,
       tavg_moyenne) : Snowflake n'est alors pas interrogé pour la pluie ;
    2. climat observé GalsenAPI (via Snowflake), si tous les mois sont mesurés ;
    3. sinon la normale de la région pour la saison.

La réponse contient une liste `avertissements` qui dit à l'utilisateur
quand le résultat est moins fiable.
"""

import logging
from collections.abc import Callable

from ml.scripts import simulation
from ml.scripts.config import REGION_VOISINE, SYSTEME_PRODUCTION_DEFAUT

logger = logging.getLogger(__name__)

# Dernière année du jeu d'entraînement : au-delà, le modèle prolonge la tendance.
ANNEE_FIN_DONNEES = 2015

# Cultures moins bien prédites que la baseline, ou trop peu de données en test.
PRODUITS_PEU_FIABLES = {"Patate douce", "Maïs", "Sésame"}

# Cache du climat observé (passé, donc stable), local au processus.
# Les échecs et les campagnes non mesurées ne sont pas mémorisés.
_CACHE_CLIMAT: dict[tuple, dict] = {}


def options() -> dict:
    """Produits, régions, saisons et systèmes acceptés par le modèle."""
    return simulation.valeurs_acceptees()


def _climat_observe(
    region: str, annee: int, saison: str, ouvrir_connexion: Callable | None
) -> tuple[dict | None, str | None]:
    """(climat, avertissement). Climat None = on utilisera la normale.

    La connexion n'est ouverte qu'en cas de cache manquant, puis fermée.
    """
    cle = (region, annee, saison)
    if cle in _CACHE_CLIMAT:
        return _CACHE_CLIMAT[cle], None

    conn = None
    try:
        conn = ouvrir_connexion() if ouvrir_connexion else None
        climat = simulation.lire_climat_observe(region, annee, saison, conn=conn)
    except Exception:  # Snowflake injoignable : on continue avec la normale.
        logger.warning("Climat observé indisponible", exc_info=True)
        return (
            None,
            "Climat observé indisponible (erreur de lecture) : normale de la région utilisée.",
        )
    finally:
        if conn is not None:
            conn.close()

    if climat is None:
        return (
            None,
            "Campagne non (entièrement) mesurée : normale de la région utilisée.",
        )
    _CACHE_CLIMAT[cle] = climat
    return climat, None


def predire(
    produit: str,
    region: str,
    superficie_ha: float,
    annee: int,
    saison: str = "Principale",
    systeme_production: str = SYSTEME_PRODUCTION_DEFAUT,
    pluie_cumul_mm: float | None = None,
    tavg_moyenne: float | None = None,
    ouvrir_connexion: Callable | None = None,
) -> dict:
    """Rendement (t/ha) et production (t) prédits pour une campagne.

    `pluie_cumul_mm` / `tavg_moyenne` : scénario facultatif ; une valeur
    absente est complétée par le climat observé, sinon par la normale.
    `ouvrir_connexion` : fonction sans argument qui renvoie une connexion
    Snowflake (l'API passe get_snowflake_connection).
    Lève ValueError si un paramètre est inconnu du modèle (l'API la
    convertit en 422).
    """
    avertissements = []

    # Pluie saisie : elle prime sur l'observé, inutile de lire Snowflake.
    climat_observe = None
    if pluie_cumul_mm is None:
        climat_observe, avertissement = _climat_observe(
            region, annee, saison, ouvrir_connexion
        )
        if avertissement:
            avertissements.append(avertissement)

    resultat = simulation.simuler(
        produit=produit,
        region=region,
        superficie_ha=superficie_ha,
        annee=annee,
        saison=saison,
        systeme_production=systeme_production,
        pluie_cumul_mm=pluie_cumul_mm,
        tavg_moyenne=tavg_moyenne,
        climat_observe=climat_observe,
    )

    if annee > ANNEE_FIN_DONNEES:
        avertissements.append(
            f"Année postérieure à {ANNEE_FIN_DONNEES} : le modèle prolonge la "
            "tendance observée, la prédiction est moins sûre."
        )
    if produit in PRODUITS_PEU_FIABLES:
        avertissements.append(
            f"{produit} : prédiction peu fiable (erreur élevée ou peu de données de test)."
        )
    if region in REGION_VOISINE:
        avertissements.append(
            f"{region} n'a pas de station : climat de {REGION_VOISINE[region]}."
        )

    resultat["avertissements"] = avertissements
    return resultat
