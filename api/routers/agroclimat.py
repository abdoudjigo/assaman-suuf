"""
Routes REST pour les données agroclimatiques de DataFlow360.
"""

import logging
import math
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from redis_client import get_cached, make_cache_key, set_cached
from schemas.agroclimat import (
    AgroclimatAgregatResponse,
    AgroclimatNuageResponse,
    AgroclimatResponse,
)
from snowflake_client import get_snowflake_connection

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/agroclimat",
    tags=["Agroclimat"],
)


@router.get(
    "",
    response_model=AgroclimatResponse,
    summary="Lister les campagnes agroclimatiques",
    description=(
        "Retourne les campagnes agricoles enrichies par les indicateurs "
        "climatiques depuis DATAFLOW360.MARTS.FCT_AGROCLIMAT_CAMPAGNE."
    ),
)
def get_agroclimat(
    page: int = Query(1, ge=1, description="Numéro de page."),
    page_size: int = Query(
        50,
        ge=1,
        le=200,
        description="Nombre maximum de lignes par page.",
    ),
    fnid: str | None = Query(
        None,
        description="Filtrer sur un FNID.",
    ),
    produit_key: str | None = Query(
        None,
        description="Filtrer sur une clé produit.",
    ),
    annee: int | None = Query(
        None,
        description="Filtrer sur l'année de la campagne.",
    ),
    systeme_production: str | None = Query(
        None,
        description="Filtrer sur le système de production.",
    ),
) -> AgroclimatResponse:
    """
    Retourne les campagnes agricoles enrichies par le climat.

    Source :
        DATAFLOW360.MARTS.FCT_AGROCLIMAT_CAMPAGNE
    """

    # ------------------------------------------------------------
    # Filtres
    # ------------------------------------------------------------
    filters = []
    params = []

    if fnid is not None:
        filters.append("a.FNID = ?")
        params.append(fnid)

    if produit_key is not None:
        filters.append("a.PRODUIT_KEY = ?")
        params.append(produit_key)

    if annee is not None:
        filters.append("a.ANNEE = ?")
        params.append(annee)

    if systeme_production is not None:
        filters.append("UPPER(a.SYSTEME_PRODUCTION) = UPPER(?)")
        params.append(systeme_production)

    where_clause = ""

    if filters:
        where_clause = "WHERE " + " AND ".join(filters)

    offset = (page - 1) * page_size

    # ------------------------------------------------------------
    # Redis
    # ------------------------------------------------------------
    cache_key = make_cache_key(
        "agroclimat",
        {
            "page": page,
            "page_size": page_size,
            "fnid": fnid,
            "produit_key": produit_key,
            "annee": annee,
            "systeme_production": systeme_production,
        },
    )

    cached = get_cached(cache_key)

    if cached is not None:
        return AgroclimatResponse.model_validate(cached)

    # ------------------------------------------------------------
    # SQL
    # ------------------------------------------------------------
    count_sql = f"""
        SELECT COUNT(*)
        FROM DATAFLOW360.MARTS.FCT_AGROCLIMAT_CAMPAGNE a
        {where_clause}
    """

    data_sql = f"""
        SELECT
            a.OBSERVATION_ID,
            a.ZONE_KEY,
            a.PRODUIT_KEY,
            a.FNID,

            z.REGION AS REGION,
            g.DEPARTEMENT AS DEPARTEMENT,

            p.PRODUIT AS PRODUIT,
            p.CATEGORIE AS CATEGORIE,

            a.ANNEE,
            a.SAISON,
            a.SYSTEME_PRODUCTION,

            a.MOIS_SEMIS,
            a.MOIS_RECOLTE,
            a.DUREE_CAMPAGNE_MOIS,

            a.INDICATEUR_QUALITE,

            a.SUPERFICIE_HA,
            a.PRODUCTION_T,
            a.RENDEMENT_T_HA,

            a.A_CLIMAT,
            a.NB_MOIS_CLIMAT,
            a.TAUX_COUVERTURE_CLIMAT,

            a.PLUIE_CUMUL_MM,
            a.PLUIE_MOIS_MAX_MM,
            a.NB_MOIS_SECS,
            a.PLUIE_ANOMALIE_MM,

            a.TAVG_MOYENNE,
            a.TMAX_MAX,
            a.TMIN_MIN,
            a.TAVG_ANOMALIE,

            a.SOURCE_SYSTEM

        FROM DATAFLOW360.MARTS.FCT_AGROCLIMAT_CAMPAGNE a

        LEFT JOIN DATAFLOW360.MARTS.DIM_GEOGRAPHIE g
            ON a.FNID = g.FNID

        LEFT JOIN DATAFLOW360.MARTS.DIM_ZONE z
            ON a.ZONE_KEY = z.ZONE_KEY

        LEFT JOIN DATAFLOW360.MARTS.DIM_PRODUIT p
            ON a.PRODUIT_KEY = p.PRODUIT_KEY

        {where_clause}

        ORDER BY a.OBSERVATION_ID

        LIMIT ?
        OFFSET ?
    """

    connection = None
    cursor = None

    try:
        connection = get_snowflake_connection()
        cursor = connection.cursor()

        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]

        cursor.execute(
            data_sql,
            [*params, page_size, offset],
        )

        rows = cursor.fetchall()

        data = [
            {
                "observation_id": row[0],
                "zone_key": row[1],
                "produit_key": row[2],
                "fnid": row[3],
                "region": row[4],
                "departement": row[5],
                "produit": row[6],
                "categorie": row[7],
                "annee": row[8],
                "saison": row[9],
                "systeme_production": row[10],
                "mois_semis": row[11],
                "mois_recolte": row[12],
                "duree_campagne_mois": row[13],
                "indicateur_qualite": row[14],
                "superficie_ha": row[15],
                "production_t": row[16],
                "rendement_t_ha": row[17],
                "a_climat": row[18],
                "nb_mois_climat": row[19],
                "taux_couverture_climat": row[20],
                "pluie_cumul_mm": row[21],
                "pluie_mois_max_mm": row[22],
                "nb_mois_secs": row[23],
                "pluie_anomalie_mm": row[24],
                "tavg_moyenne": row[25],
                "tmax_max": row[26],
                "tmin_min": row[27],
                "tavg_anomalie": row[28],
                "source_system": row[29],
            }
            for row in rows
        ]

        total_pages = math.ceil(total / page_size) if total else 0

        response = AgroclimatResponse(
            data=data,
            pagination={
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
            },
        )

        # Mise en cache de la réponse.
        set_cached(
            cache_key,
            response.model_dump(mode="json"),
        )

        return response

    except Exception as exc:
        logger.exception("Erreur sur GET /api/v1/agroclimat")

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des données agroclimatiques.",
        ) from exc

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()


# ================================================================
# Agrégats et nuage de points (Dashboard)
# ================================================================

FROM_AGROCLIMAT = """
    FROM DATAFLOW360.MARTS.FCT_AGROCLIMAT_CAMPAGNE a

    LEFT JOIN DATAFLOW360.MARTS.DIM_ZONE z
        ON a.ZONE_KEY = z.ZONE_KEY

    LEFT JOIN DATAFLOW360.MARTS.DIM_PRODUIT p
        ON a.PRODUIT_KEY = p.PRODUIT_KEY
"""

# Liste blanche : la colonne de regroupement n'est jamais lue depuis la requête.
GROUP_BY_COLUMNS = {
    "total": None,
    "annee": "a.ANNEE",
    "region": "z.REGION",
    "produit": "p.PRODUIT",
    "categorie": "p.CATEGORIE",
    "systeme_production": "a.SYSTEME_PRODUCTION",
}

# Campagne utilisable pour le rendement : production ET superficie renseignées.
PAIRE = "a.PRODUCTION_T IS NOT NULL AND a.SUPERFICIE_HA IS NOT NULL"


def _dashboard_filters(
    annee: int | None,
    region: str | None,
    produit: str | None,
    categorie: str | None,
    systeme_production: str | None,
) -> tuple[list[str], list]:
    """Filtres communs aux routes Dashboard (comparaison insensible à la casse)."""

    filters = []
    params = []

    if annee is not None:
        filters.append("a.ANNEE = ?")
        params.append(annee)

    for column, value in (
        ("z.REGION", region),
        ("p.PRODUIT", produit),
        ("p.CATEGORIE", categorie),
        ("a.SYSTEME_PRODUCTION", systeme_production),
    ):
        if value is not None:
            filters.append(f"UPPER({column}) = UPPER(?)")
            params.append(value)

    return filters, params


def _fetch_all(sql: str, params: list) -> list[tuple]:
    """Exécute une requête Snowflake et retourne toutes les lignes."""

    connection = None
    cursor = None

    try:
        connection = get_snowflake_connection()
        cursor = connection.cursor()
        cursor.execute(sql, params)
        return cursor.fetchall()

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()


def _to_float(value) -> float | None:
    return None if value is None else float(value)


@router.get(
    "/agregats",
    response_model=AgroclimatAgregatResponse,
    summary="Agréger les campagnes agroclimatiques",
    description=(
        "Production, superficie, rendement et couverture climatique agrégés "
        "côté Snowflake. Rendement = SUM(production) / SUM(superficie) sur les "
        "campagnes ayant les deux valeurs ; les null sont ignorés. Les groupes "
        "dont la clé est null sont exclus."
    ),
)
def get_agroclimat_agregats(
    group_by: Literal[
        "total", "annee", "region", "produit", "categorie", "systeme_production"
    ] = Query("annee", description="Dimension de regroupement."),
    annee: int | None = Query(None, description="Filtrer sur l'année."),
    region: str | None = Query(None, description="Filtrer sur la région."),
    produit: str | None = Query(None, description="Filtrer sur la culture."),
    categorie: str | None = Query(None, description="Filtrer sur la catégorie."),
    systeme_production: str | None = Query(
        None, description="Filtrer sur le système de production."
    ),
) -> AgroclimatAgregatResponse:
    """Retourne les agrégats de FCT_AGROCLIMAT_CAMPAGNE par dimension."""

    filters, params = _dashboard_filters(
        annee, region, produit, categorie, systeme_production
    )

    column = GROUP_BY_COLUMNS[group_by]

    if column is not None:
        filters.append(f"{column} IS NOT NULL")

    where_clause = "WHERE " + " AND ".join(filters) if filters else ""

    cache_key = make_cache_key(
        "agroclimat_agregats",
        {
            "group_by": group_by,
            "annee": annee,
            "region": region,
            "produit": produit,
            "categorie": categorie,
            "systeme_production": systeme_production,
        },
    )

    cached = get_cached(cache_key)

    if cached is not None:
        return AgroclimatAgregatResponse.model_validate(cached)

    key_sql = column if column is not None else "NULL"
    group_sql = f"GROUP BY {column} ORDER BY {column}" if column is not None else ""

    sql = f"""
        SELECT
            {key_sql} AS CLE,

            COUNT(*) AS NB_CAMPAGNES,
            SUM(a.PRODUCTION_T) AS PRODUCTION_T,
            SUM(a.SUPERFICIE_HA) AS SUPERFICIE_HA,

            COUNT_IF({PAIRE}) AS NB_CAMPAGNES_RENDEMENT,
            SUM(IFF({PAIRE}, a.PRODUCTION_T, NULL))
                / NULLIF(SUM(IFF({PAIRE}, a.SUPERFICIE_HA, NULL)), 0)
                AS RENDEMENT_T_HA,

            COUNT_IF(a.A_CLIMAT) AS NB_AVEC_CLIMAT,
            COUNT(a.A_CLIMAT) AS NB_CLIMAT_RENSEIGNE

        {FROM_AGROCLIMAT}

        {where_clause}

        {group_sql}
    """

    try:
        rows = _fetch_all(sql, params)

    except Exception as exc:
        logger.exception("Erreur sur GET /api/v1/agroclimat/agregats")

        raise HTTPException(
            status_code=500,
            detail="Erreur lors du calcul des agrégats agroclimatiques.",
        ) from exc

    data = []

    for row in rows:
        # Sans filtre correspondant, un agrégat « total » renvoie une ligne à 0 campagne.
        if row[1] == 0:
            continue

        nb_avec_climat = int(row[6] or 0)
        nb_climat_renseigne = int(row[7] or 0)

        data.append(
            {
                "cle": row[0],
                "nb_campagnes": int(row[1]),
                "production_t": _to_float(row[2]),
                "superficie_ha": _to_float(row[3]),
                "nb_campagnes_rendement": int(row[4] or 0),
                "rendement_t_ha": _to_float(row[5]),
                "nb_avec_climat": nb_avec_climat,
                "nb_climat_renseigne": nb_climat_renseigne,
                "couverture_climat_pct": (
                    nb_avec_climat / nb_climat_renseigne * 100
                    if nb_climat_renseigne
                    else None
                ),
            }
        )

    response = AgroclimatAgregatResponse(group_by=group_by, data=data)

    set_cached(cache_key, response.model_dump(mode="json"))

    return response


@router.get(
    "/nuage",
    response_model=AgroclimatNuageResponse,
    summary="Points pluie cumulée × rendement",
    description=(
        "Campagnes avec données climatiques (A_CLIMAT) dont la pluie cumulée "
        "et le rendement sont connus. Au-delà de `limite`, un échantillon "
        "déterministe est renvoyé ; `total` donne le nombre de points éligibles."
    ),
)
def get_agroclimat_nuage(
    limite: int = Query(5000, ge=1, le=10000, description="Nombre maximum de points."),
    annee: int | None = Query(None, description="Filtrer sur l'année."),
    region: str | None = Query(None, description="Filtrer sur la région."),
    produit: str | None = Query(None, description="Filtrer sur la culture."),
    categorie: str | None = Query(None, description="Filtrer sur la catégorie."),
    systeme_production: str | None = Query(
        None, description="Filtrer sur le système de production."
    ),
) -> AgroclimatNuageResponse:
    """Retourne un point par campagne avec climat."""

    filters, params = _dashboard_filters(
        annee, region, produit, categorie, systeme_production
    )

    # Rendement de la campagne : production / superficie si possible,
    # sinon la valeur calculée en amont.
    rendement_sql = (
        "IFF(a.PRODUCTION_T IS NOT NULL AND a.SUPERFICIE_HA > 0, "
        "a.PRODUCTION_T / a.SUPERFICIE_HA, a.RENDEMENT_T_HA)"
    )

    filters += [
        "a.A_CLIMAT = TRUE",
        "a.PLUIE_CUMUL_MM IS NOT NULL",
        "p.PRODUIT IS NOT NULL",
        f"{rendement_sql} IS NOT NULL",
    ]

    where_clause = "WHERE " + " AND ".join(filters)

    cache_key = make_cache_key(
        "agroclimat_nuage",
        {
            "limite": limite,
            "annee": annee,
            "region": region,
            "produit": produit,
            "categorie": categorie,
            "systeme_production": systeme_production,
        },
    )

    cached = get_cached(cache_key)

    if cached is not None:
        return AgroclimatNuageResponse.model_validate(cached)

    # COUNT(*) OVER () donne le total avant LIMIT ; l'ordre par hash rend
    # l'échantillon stable d'un appel à l'autre.
    sql = f"""
        SELECT
            a.PLUIE_CUMUL_MM,
            {rendement_sql} AS RENDEMENT_T_HA,
            p.PRODUIT,
            z.REGION,
            a.ANNEE,
            COUNT(*) OVER () AS TOTAL

        {FROM_AGROCLIMAT}

        {where_clause}

        ORDER BY HASH(a.OBSERVATION_ID)

        LIMIT ?
    """

    try:
        rows = _fetch_all(sql, [*params, limite])

    except Exception as exc:
        logger.exception("Erreur sur GET /api/v1/agroclimat/nuage")

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération du nuage de points.",
        ) from exc

    response = AgroclimatNuageResponse(
        total=int(rows[0][5]) if rows else 0,
        data=[
            {
                "pluie_cumul_mm": float(row[0]),
                "rendement_t_ha": float(row[1]),
                "produit": row[2],
                "region": row[3],
                "annee": row[4],
            }
            for row in rows
        ],
    )

    set_cached(cache_key, response.model_dump(mode="json"))

    return response
