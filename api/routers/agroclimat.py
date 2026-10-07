"""
Routes REST pour les données agroclimatiques de DataFlow360.
"""

import logging
import math
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from redis_client import get_cached, make_cache_key, set_cached
from schemas.agroclimat import AgroclimatResponse
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
    fnid: Optional[str] = Query(
        None,
        description="Filtrer sur un FNID.",
    ),
    produit_key: Optional[str] = Query(
        None,
        description="Filtrer sur une clé produit.",
    ),
    annee: Optional[int] = Query(
        None,
        description="Filtrer sur l'année de la campagne.",
    ),
    systeme_production: Optional[str] = Query(
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
        filters.append(
            "UPPER(a.SYSTEME_PRODUCTION) = UPPER(?)"
        )
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
        logger.exception(
            "Erreur sur GET /api/v1/agroclimat"
        )

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des données agroclimatiques.",
        ) from exc

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()