"""
Routes REST pour les zones géographiques.
"""

import logging
import math
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from redis_client import get_cached, make_cache_key, set_cached
from schemas.zones import ZoneResponse
from snowflake_client import get_snowflake_connection


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/zones",
    tags=["Zones"],
)


@router.get(
    "",
    response_model=ZoneResponse,
    summary="Lister les zones",
    description="Retourne les zones géographiques disponibles.",
)
def get_zones(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    region: Optional[str] = Query(
        None,
        description="Filtrer sur une région.",
    ),
) -> ZoneResponse:

    # Filtres SQL.
    filters = []
    params = []

    if region is not None:
        filters.append("REGION ILIKE ?")
        params.append(f"%{region}%")

    where_clause = ""

    if filters:
        where_clause = "WHERE " + " AND ".join(filters)

    offset = (page - 1) * page_size

    # ------------------------------------------------------------
    # Redis
    # ------------------------------------------------------------
    cache_key = make_cache_key(
        "zones",
        {
            "page": page,
            "page_size": page_size,
            "region": region,
        },
    )

    cached = get_cached(cache_key)

    if cached is not None:
        return ZoneResponse.model_validate(cached)

    # ------------------------------------------------------------
    # SQL
    # ------------------------------------------------------------
    count_sql = f"""
        SELECT COUNT(*)
        FROM DATAFLOW360.MARTS.DIM_ZONE
        {where_clause}
    """

    data_sql = f"""
        SELECT
            ZONE_KEY,
            REGION
        FROM DATAFLOW360.MARTS.DIM_ZONE
        {where_clause}
        ORDER BY REGION, ZONE_KEY
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
                "zone_key": row[0],
                "region": row[1],
            }
            for row in rows
        ]

        total_pages = math.ceil(total / page_size) if total else 0

        response = ZoneResponse(
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
        logger.exception(
            "Erreur sur GET /api/v1/zones"
        )

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des zones.",
        ) from exc

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()