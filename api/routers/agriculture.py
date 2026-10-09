"""
Routes REST pour les données agricoles de DataFlow360.
"""

import logging
import math

from fastapi import APIRouter, HTTPException, Query
from redis_client import get_cached, make_cache_key, set_cached
from schemas.agriculture import AgricultureResponse
from snowflake_client import get_snowflake_connection

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/v1/agriculture",
    tags=["Agriculture"],
)


@router.get(
    "",
    response_model=AgricultureResponse,
    summary="Lister les données agricoles",
    description=(
        "Retourne les observations agricoles depuis "
        "DATAFLOW360.MARTS.FCT_AGRICULTURE avec pagination "
        "et filtres optionnels."
    ),
    responses={
        200: {
            "description": "Données agricoles retournées avec pagination.",
            "content": {
                "application/json": {
                    "example": {
                        "data": [
                            {
                                "observation_id": "094c1eb62798e725d40f2bbda484ae58",
                                "zone_key": "08ec2b465e90b2a8de19b62a7315fc69",
                                "produit_key": "1c4866fc8742c1657053711b96aa8c59",
                                "fnid": "SN2008A20103",
                                "region": "Dakar",
                                "departement": "Exemple",
                                "produit": "Mil",
                                "categorie": "Céréale",
                                "saison": "Principale",
                                "annee_semis": 2010,
                                "mois_semis": 6,
                                "annee_recolte": 2010,
                                "mois_recolte": 11,
                                "systeme_production": "Pluvial",
                                "indicateur_qualite": 0,
                                "superficie_ha": 546.0,
                                "production_t": 4641.0,
                                "rendement_t_ha": 8.5,
                                "source_system": "KAFKA",
                            }
                        ],
                        "pagination": {
                            "page": 1,
                            "page_size": 50,
                            "total": 9979,
                            "total_pages": 200,
                        },
                    }
                }
            },
        }
    },
)
def get_agriculture(
    page: int = Query(
        1,
        ge=1,
        description="Numéro de page.",
    ),
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
    annee_semis: int | None = Query(
        None,
        description="Filtrer sur l'année de semis.",
    ),
    systeme_production: str | None = Query(
        None,
        description="Filtrer sur le système de production.",
    ),
) -> AgricultureResponse:
    """
    Retourne les données agricoles paginées.

    Les données proviennent du mart Snowflake FCT_AGRICULTURE.
    Les dimensions géographiques et produits sont jointes afin
    de retourner des informations directement exploitables par le frontend.
    """

    filters = []
    params = []

    if fnid is not None:
        filters.append("a.FNID = ?")
        params.append(fnid)

    if produit_key is not None:
        filters.append("a.PRODUIT_KEY = ?")
        params.append(produit_key)

    if annee_semis is not None:
        filters.append("a.ANNEE_SEMIS = ?")
        params.append(annee_semis)

    if systeme_production is not None:
        filters.append("UPPER(a.SYSTEME_PRODUCTION) = UPPER(?)")
        params.append(systeme_production)

    where_clause = ""

    if filters:
        where_clause = "WHERE " + " AND ".join(filters)

    offset = (page - 1) * page_size

    # CACHE REDIS
    # On construit une clé unique à partir des paramètres de la
    # requête. Deux requêtes identiques auront donc la même clé.
    cache_key = make_cache_key(
        "agriculture",
        {
            "page": page,
            "page_size": page_size,
            "fnid": fnid,
            "produit_key": produit_key,
            "annee_semis": annee_semis,
            "systeme_production": systeme_production,
        },
    )

    # On demande à Redis si cette réponse existe déjà.
    cached = get_cached(cache_key)

    # CACHE HIT :
    # La réponse existe dans Redis → pas besoin d'interroger Snowflake.
    if cached is not None:
        logger.info("Cache HIT agriculture: %s", cache_key)
        return AgricultureResponse.model_validate(cached)

    # CACHE MISS :
    # La réponse n'existe pas dans Redis → on continue vers Snowflake.
    logger.info("Cache MISS agriculture: %s", cache_key)

    count_sql = f"""
        SELECT COUNT(*)
        FROM DATAFLOW360.MARTS.FCT_AGRICULTURE a

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

            a.SAISON,
            a.ANNEE_SEMIS,
            a.MOIS_SEMIS,
            a.ANNEE_RECOLTE,
            a.MOIS_RECOLTE,

            a.SYSTEME_PRODUCTION,
            a.INDICATEUR_QUALITE,

            a.SUPERFICIE_HA,
            a.PRODUCTION_T,
            a.RENDEMENT_T_HA,

            a.SOURCE_SYSTEM

        FROM DATAFLOW360.MARTS.FCT_AGRICULTURE a

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

        logger.info(
            "Lecture agriculture: page=%s page_size=%s filters=%s",
            page,
            page_size,
            params,
        )

        # Total correspondant aux filtres.
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]

        # Données de la page demandée.
        data_params = [*params, page_size, offset]

        cursor.execute(data_sql, data_params)
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
                "saison": row[8],
                "annee_semis": row[9],
                "mois_semis": row[10],
                "annee_recolte": row[11],
                "mois_recolte": row[12],
                "systeme_production": row[13],
                "indicateur_qualite": row[14],
                "superficie_ha": row[15],
                "production_t": row[16],
                "rendement_t_ha": row[17],
                "source_system": row[18],
            }
            for row in rows
        ]

        total_pages = math.ceil(total / page_size) if total else 0

        response = AgricultureResponse(
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
        logger.exception("Erreur Snowflake sur GET /api/v1/agriculture")

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des données agricoles.",
        ) from exc

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()
