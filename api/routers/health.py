"""
Endpoints techniques de santé de l'API DataFlow360.

- /health       : vérifie que FastAPI fonctionne ;
- /health/ready : vérifie que Redis et Snowflake sont accessibles.
"""

import redis
import snowflake.connector
from fastapi import APIRouter

from redis_client import get_redis_client
from schemas.health import HealthResponse, ReadinessResponse
from snowflake_client import get_snowflake_connection


router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Vérifier que l'API fonctionne",
    description=(
        "Vérifie que le processus FastAPI est en cours d'exécution "
        "et capable de répondre aux requêtes HTTP."
    ),
)
def health() -> HealthResponse:
    """
    Vérifie uniquement que l'application FastAPI répond.
    """

    return HealthResponse(status="ok")


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    summary="Vérifier la disponibilité des dépendances",
    description=(
        "Vérifie que l'API peut communiquer avec Redis "
        "et Snowflake."
    ),
)
def readiness() -> ReadinessResponse:
    """
    Vérifie la disponibilité de Redis et Snowflake.
    """

    redis_status = "error"
    snowflake_status = "error"

    # Vérification Redis
    try:
        client = get_redis_client()
        client.ping()
        redis_status = "ok"
    except redis.RedisError:
        pass

    # Vérification Snowflake
    connection = None

    try:
        connection = get_snowflake_connection()
        snowflake_status = "ok"
    except Exception:
        pass
    finally:
        if connection is not None:
            connection.close()

    ready = (
        redis_status == "ok"
        and snowflake_status == "ok"
    )

    return ReadinessResponse(
        status="ready" if ready else "not_ready",
        dependencies={
            "redis": redis_status,
            "snowflake": snowflake_status,
        },
    )