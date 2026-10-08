"""
Routes REST de prédiction du rendement.

L'API ne calcule rien : elle appelle ml.service_prediction et met en cache.
"""

import logging

from fastapi import APIRouter, HTTPException

from ml import service_prediction
from redis_client import get_cached, make_cache_key, set_cached
from schemas.predictions import (
    PredictionOptions,
    PredictionRequest,
    PredictionResponse,
)
from snowflake_client import get_snowflake_connection


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/predictions",
    tags=["Prédictions"],
)


@router.get(
    "/options",
    response_model=PredictionOptions,
    summary="Valeurs acceptées par le modèle",
)
def get_options() -> PredictionOptions:
    try:
        return PredictionOptions.model_validate(service_prediction.options())
    except FileNotFoundError as exc:
        logger.exception("Modèle introuvable")
        raise HTTPException(status_code=503, detail="Modèle indisponible.") from exc


@router.post(
    "/rendement",
    response_model=PredictionResponse,
    summary="Estimer le rendement d'une campagne",
    description=(
        "Rendement (t/ha) et production (t) estimés. Le climat vient des "
        "relevés GalsenAPI si la campagne est mesurée, sinon de la normale "
        "de la région. Voir `avertissements` pour la fiabilité."
    ),
)
def post_rendement(body: PredictionRequest) -> PredictionResponse:
    # Route synchrone (def) : FastAPI l'exécute dans un thread, l'appel
    # Snowflake bloquant ne gèle donc pas le serveur.
    params = body.model_dump()
    cache_key = make_cache_key("predictions", params)

    cached = get_cached(cache_key)
    if cached is not None:
        return PredictionResponse.model_validate(cached)

    try:
        resultat = service_prediction.predire(
            **params, ouvrir_connexion=get_snowflake_connection
        )
    except ValueError as exc:  # produit/région/saison inconnus, etc.
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        logger.exception("Modèle introuvable")
        raise HTTPException(status_code=503, detail="Modèle indisponible.") from exc
    except Exception as exc:
        logger.exception("Erreur sur POST /api/v1/predictions/rendement")
        raise HTTPException(
            status_code=500, detail="Erreur lors de la prédiction."
        ) from exc

    response = PredictionResponse.model_validate(resultat)

    # Pas de cache si le climat observé était indisponible (panne passagère).
    if not any("indisponible" in a for a in response.avertissements):
        set_cached(cache_key, response.model_dump(mode="json"))
    return response