"""
Routes REST pour les produits agricoles.
"""

import logging
import math

from fastapi import APIRouter, HTTPException, Query
from redis_client import get_cached, make_cache_key, set_cached
from schemas.produits import ProduitResponse
from snowflake_client import get_snowflake_connection

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/produits",
    tags=["Produits"],
)


@router.get(
    "",
    response_model=ProduitResponse,
    summary="Lister les produits agricoles",
    description="Retourne les produits et leurs catégories.",
)
def get_produits(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    categorie: str | None = Query(
        None,
        description="Filtrer sur une catégorie.",
    ),
    search: str | None = Query(
        None,
        description="Rechercher un produit par nom.",
    ),
) -> ProduitResponse:

    # Filtres SQL.
    filters = []
    params = []

    if categorie is not None:
        filters.append("CATEGORIE ILIKE ?")
        params.append(f"%{categorie}%")

    if search is not None:
        filters.append("PRODUIT ILIKE ?")
        params.append(f"%{search}%")

    where_clause = ""

    if filters:
        where_clause = "WHERE " + " AND ".join(filters)

    offset = (page - 1) * page_size

    # ------------------------------------------------------------
    # Redis
    # ------------------------------------------------------------
    cache_key = make_cache_key(
        "produits",
        {
            "page": page,
            "page_size": page_size,
            "categorie": categorie,
            "search": search,
        },
    )

    cached = get_cached(cache_key)

    if cached is not None:
        return ProduitResponse.model_validate(cached)

    # ------------------------------------------------------------
    # SQL
    # ------------------------------------------------------------
    count_sql = f"""
        SELECT COUNT(*)
        FROM DATAFLOW360.MARTS.DIM_PRODUIT
        {where_clause}
    """

    data_sql = f"""
        SELECT
            PRODUIT_KEY,
            PRODUIT,
            CATEGORIE

        FROM DATAFLOW360.MARTS.DIM_PRODUIT

        {where_clause}

        ORDER BY PRODUIT, PRODUIT_KEY

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
                "produit_key": row[0],
                "produit": row[1],
                "categorie": row[2],
            }
            for row in rows
        ]

        total_pages = math.ceil(total / page_size) if total else 0

        response = ProduitResponse(
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
        logger.exception("Erreur sur GET /api/v1/produits")

        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des produits.",
        ) from exc

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()
