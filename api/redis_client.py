"""
Connexion et utilitaires Redis de DataFlow360.

Redis est utilisé comme cache de l'API.
"""

import hashlib
import json
import os
from typing import Any

import redis


# Durée de conservation d'une réponse en cache.
# 300 secondes = 5 minutes.
CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))


def get_redis_client() -> redis.Redis:
    """
    Retourne un client Redis configuré depuis les variables d'environnement.
    """

    return redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )


def make_cache_key(prefix: str, params: dict[str, Any]) -> str:
    """
    Construit une clé Redis unique pour une requête.

    Exemple :
        /agriculture?page=1&page_size=50

    aura une clé différente de :
        /agriculture?page=2&page_size=50
    """

    payload = json.dumps(
        params,
        sort_keys=True,
        ensure_ascii=False,
        default=str,
    )

    digest = hashlib.sha256(payload.encode()).hexdigest()

    return f"dataflow360:{prefix}:{digest}"


def get_cached(cache_key: str) -> dict[str, Any] | None:
    """
    Cherche une réponse dans Redis.

    Retourne :
        - la donnée si elle existe ;
        - None si elle n'existe pas ou si Redis est indisponible.
    """

    try:
        client = get_redis_client()

        # Lecture de la réponse déjà enregistrée.
        value = client.get(cache_key)

        if value is None:
            return None

        return json.loads(value)

    except (redis.RedisError, json.JSONDecodeError):
        # Redis est une optimisation :
        # s'il tombe, l'API peut continuer avec Snowflake.
        return None


def set_cached(
    cache_key: str,
    data: dict[str, Any],
    ttl: int = CACHE_TTL,
) -> None:
    """
    Enregistre une réponse dans Redis avec une durée de vie limitée.
    """

    try:
        client = get_redis_client()

        # Stockage de la réponse pendant `ttl` secondes.
        client.setex(
            cache_key,
            ttl,
            json.dumps(
                data,
                ensure_ascii=False,
                default=str,
            ),
        )

    except redis.RedisError:
        # Une erreur Redis ne doit pas faire échouer la requête API.
        pass