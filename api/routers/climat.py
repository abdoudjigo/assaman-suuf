"""
Routes REST pour les données climatiques de DataFlow360.
"""

import logging
import math

from fastapi import APIRouter, HTTPException, Query
from redis_client import get_cached, make_cache_key, set_cached
from schemas.climat import ClimatAnnuelResponse, ClimatResponse
from snowflake_client import get_snowflake_connection

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/climat",
    tags=["Climat"],
)


@router.get(
    "",
    response_model=ClimatResponse,
    summary="Lister les observations climatiques",
    description=(
        "Retourne les observations climatiques depuis "
        "DATAFLOW360.MARTS.FCT_CLIMAT avec pagination "
        "et filtres optionnels."
    ),
)
def get_climat(
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
    station_key: str | None = Query(
        None,
        description="Filtrer sur une station.",
    ),
    zone_key: str | None = Query(
        None,
        description="Filtrer sur une zone.",
    ),
    annee: int | None = Query(
        None,
        description="Filtrer sur l'année.",
    ),
    mois: int | None = Query(
        None,
        ge=1,
        le=12,
        description="Filtrer sur le mois.",
    ),
) -> ClimatResponse:
    """
    Retourne les observations climatiques paginées.

    Source :
        DATAFLOW360.MARTS.FCT_CLIMAT

    Les dimensions station, zone et temps sont jointes
    pour fournir les informations utiles au frontend.
    """

    # ------------------------------------------------------------
    # Construction des filtres SQL
    # ------------------------------------------------------------
    filters = []
    params = []

    if station_key is not None:
        filters.append("c.STATION_KEY = ?")
        params.append(station_key)

    if zone_key is not None:
        filters.append("s.ZONE_KEY = ?")
        params.append(zone_key)

    if annee is not None:
        filters.append("t.ANNEE = ?")
        params.append(annee)

    if mois is not None:
        filters.append("t.MOIS = ?")
        params.append(mois)

    where_clause = ""

    if filters:
        where_clause = "WHERE " + " AND ".join(filters)

    offset = (page - 1) * page_size

    # ------------------------------------------------------------
    # Redis : recherche de la réponse déjà en cache
    # ------------------------------------------------------------
    cache_key = make_cache_key(
        "climat",
        {
            "page": page,
            "page_size": page_size,
            "station_key": station_key,
            "zone_key": zone_key,
            "annee": annee,
            "mois": mois,
        },
    )

    cached = get_cached(cache_key)

    if cached is not None:
        return ClimatResponse.model_validate(cached)

    # ------------------------------------------------------------
    # SQL Snowflake
    # ------------------------------------------------------------
    count_sql = f"""
        SELECT COUNT(*)
        FROM DATAFLOW360.MARTS.FCT_CLIMAT c

        LEFT JOIN DATAFLOW360.MARTS.DIM_STATION s
            ON c.STATION_KEY = s.STATION_KEY

        LEFT JOIN DATAFLOW360.MARTS.DIM_TEMPS t
            ON c.DATE_KEY = t.DATE_KEY

        {where_clause}
    """

    data_sql = f"""
        SELECT
            c.OBSERVATION_ID,

            c.STATION_KEY,
            s.STATION,
            s.STATION_NOM,

            s.ZONE_KEY,
            z.REGION,

            c.DATE_KEY,
            t.ANNEE,
            t.MOIS,
            t.NOM_MOIS,
            t.TRIMESTRE,
            t.EST_HIVERNAGE,

            c.TAVG,
            c.TMIN,
            c.TMAX,
            c.PRCP_MM,
            c.NB_JOURS

        FROM DATAFLOW360.MARTS.FCT_CLIMAT c

        LEFT JOIN DATAFLOW360.MARTS.DIM_STATION s
            ON c.STATION_KEY = s.STATION_KEY

        LEFT JOIN DATAFLOW360.MARTS.DIM_ZONE z
            ON s.ZONE_KEY = z.ZONE_KEY

        LEFT JOIN DATAFLOW360.MARTS.DIM_TEMPS t
            ON c.DATE_KEY = t.DATE_KEY

        {where_clause}

        ORDER BY c.OBSERVATION_ID

        LIMIT ?
        OFFSET ?
    """

    connection = None
    cursor = None

    try:
        connection = get_snowflake_connection()
        cursor = connection.cursor()

        # Total des lignes correspondant aux filtres.
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]

        # Récupération de la page demandée.
        cursor.execute(
            data_sql,
            [*params, page_size, offset],
        )

        rows = cursor.fetchall()

        data = [
            {
                "observation_id": row[0],
                "station_key": row[1],
                "station": row[2],
                "station_nom": row[3],
                "zone_key": row[4],
                "region": row[5],
                "date_key": row[6],
                "annee": row[7],
                "mois": row[8],
                "nom_mois": row[9],
                "trimestre": row[10],
                "est_hivernage": row[11],
                "tavg": row[12],
                "tmin": row[13],
                "tmax": row[14],
                "prcp_mm": row[15],
                "nb_jours": row[16],
            }
            for row in rows
        ]

        total_pages = math.ceil(total / page_size) if total else 0

        response = ClimatResponse(
            data=data,
            pagination={
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
            },
        )

        # --------------------------------------------------------
        # Redis : sauvegarde de la réponse
        # --------------------------------------------------------
        set_cached(
            cache_key,
            response.model_dump(mode="json"),
        )

        return response

    except Exception as exc:
        logger.exception("Erreur sur GET /api/v1/climat")

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des données climatiques.",
        ) from exc

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()


@router.get(
    "/annuel",
    response_model=ClimatAnnuelResponse,
    summary="Indicateurs climatiques annuels",
    description=(
        "Pluie et température par année, moyennées sur les stations. "
        "Pluie : cumul annuel des stations ayant leurs 12 mois renseignés "
        "(un cumul partiel sous-estimerait la pluie). Température : moyenne "
        "des mois renseignés par station. Les null sont ignorés."
    ),
)
def get_climat_annuel(
    region: str | None = Query(None, description="Filtrer sur la région."),
    zone_key: str | None = Query(None, description="Filtrer sur une zone."),
) -> ClimatAnnuelResponse:
    """Retourne une ligne par année à partir de FCT_CLIMAT (station × mois)."""

    filters = ["t.ANNEE IS NOT NULL", "c.STATION_KEY IS NOT NULL"]
    params = []

    if region is not None:
        filters.append("UPPER(z.REGION) = UPPER(?)")
        params.append(region)

    if zone_key is not None:
        filters.append("s.ZONE_KEY = ?")
        params.append(zone_key)

    where_clause = "WHERE " + " AND ".join(filters)

    cache_key = make_cache_key(
        "climat_annuel",
        {"region": region, "zone_key": zone_key},
    )

    cached = get_cached(cache_key)

    if cached is not None:
        return ClimatAnnuelResponse.model_validate(cached)

    sql = f"""
        WITH station_annee AS (
            SELECT
                c.STATION_KEY,
                t.ANNEE,
                COUNT(DISTINCT IFF(c.PRCP_MM IS NOT NULL, t.MOIS, NULL)) AS NB_MOIS_PLUIE,
                SUM(c.PRCP_MM) AS PLUIE,
                AVG(c.TAVG) AS TAVG

            FROM DATAFLOW360.MARTS.FCT_CLIMAT c

            LEFT JOIN DATAFLOW360.MARTS.DIM_STATION s
                ON c.STATION_KEY = s.STATION_KEY

            LEFT JOIN DATAFLOW360.MARTS.DIM_ZONE z
                ON s.ZONE_KEY = z.ZONE_KEY

            LEFT JOIN DATAFLOW360.MARTS.DIM_TEMPS t
                ON c.DATE_KEY = t.DATE_KEY

            {where_clause}

            GROUP BY c.STATION_KEY, t.ANNEE
        )

        SELECT
            ANNEE,
            AVG(IFF(NB_MOIS_PLUIE = 12, PLUIE, NULL)) AS PLUIE_CUMUL_MM,
            COUNT_IF(NB_MOIS_PLUIE = 12) AS NB_STATIONS_PLUIE,
            AVG(TAVG) AS TAVG_MOYENNE,
            COUNT(TAVG) AS NB_STATIONS_TEMPERATURE

        FROM station_annee

        GROUP BY ANNEE

        ORDER BY ANNEE
    """

    connection = None
    cursor = None

    try:
        connection = get_snowflake_connection()
        cursor = connection.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()

        response = ClimatAnnuelResponse(
            data=[
                {
                    "annee": row[0],
                    "pluie_cumul_mm": None if row[1] is None else float(row[1]),
                    "nb_stations_pluie": int(row[2] or 0),
                    "tavg_moyenne": None if row[3] is None else float(row[3]),
                    "nb_stations_temperature": int(row[4] or 0),
                }
                for row in rows
            ]
        )

        set_cached(cache_key, response.model_dump(mode="json"))

        return response

    except Exception as exc:
        logger.exception("Erreur sur GET /api/v1/climat/annuel")

        raise HTTPException(
            status_code=500,
            detail="Erreur lors du calcul des indicateurs climatiques annuels.",
        ) from exc

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()
