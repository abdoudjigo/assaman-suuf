"""
Routes REST pour les stations climatiques.
"""

import logging
import math

from fastapi import APIRouter, HTTPException, Query
from redis_client import get_cached, make_cache_key, set_cached
from schemas.stations import StationResponse
from snowflake_client import get_snowflake_connection

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/stations",
    tags=["Stations"],
)


@router.get(
    "",
    response_model=StationResponse,
    summary="Lister les stations climatiques",
    description="Retourne les stations et leur région.",
)
def get_stations(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    zone_key: str | None = Query(
        None,
        description="Filtrer sur une zone.",
    ),
    search: str | None = Query(
        None,
        description="Rechercher une station par code ou nom.",
    ),
) -> StationResponse:

    # Filtres SQL.
    filters = []
    params = []

    if zone_key is not None:
        filters.append("s.ZONE_KEY = ?")
        params.append(zone_key)

    if search is not None:
        filters.append("(s.STATION ILIKE ? OR s.STATION_NOM ILIKE ?)")

        value = f"%{search}%"
        params.extend([value, value])

    where_clause = ""

    if filters:
        where_clause = "WHERE " + " AND ".join(filters)

    offset = (page - 1) * page_size

    # ------------------------------------------------------------
    # Redis
    # ------------------------------------------------------------
    cache_key = make_cache_key(
        "stations",
        {
            "page": page,
            "page_size": page_size,
            "zone_key": zone_key,
            "search": search,
        },
    )

    cached = get_cached(cache_key)

    if cached is not None:
        return StationResponse.model_validate(cached)

    # ------------------------------------------------------------
    # SQL
    # ------------------------------------------------------------
    count_sql = f"""
        SELECT COUNT(*)
        FROM DATAFLOW360.MARTS.DIM_STATION s
        {where_clause}
    """

    data_sql = f"""
        SELECT
            s.STATION_KEY,
            s.STATION,
            s.STATION_NOM,
            s.ZONE_KEY,
            z.REGION

        FROM DATAFLOW360.MARTS.DIM_STATION s

        LEFT JOIN DATAFLOW360.MARTS.DIM_ZONE z
            ON s.ZONE_KEY = z.ZONE_KEY

        {where_clause}

        ORDER BY s.STATION_NOM, s.STATION_KEY

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
                "station_key": row[0],
                "station": row[1],
                "station_nom": row[2],
                "zone_key": row[3],
                "region": row[4],
            }
            for row in rows
        ]

        total_pages = math.ceil(total / page_size) if total else 0

        response = StationResponse(
            data=data,
            pagination={
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
            },
        )

        # Mise en cache.
        set_cached(
            cache_key,
            response.model_dump(mode="json"),
        )

        return response

    except Exception as exc:
        logger.exception("Erreur sur GET /api/v1/stations")

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des stations.",
        ) from exc

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()
