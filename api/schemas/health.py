"""
Schémas des réponses des endpoints de santé.
"""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Réponse de l'endpoint /health."""

    status: Literal["ok"]


class DependenciesResponse(BaseModel):
    """État des dépendances de l'API."""

    redis: Literal["ok", "error"]
    snowflake: Literal["ok", "error"]


class ReadinessResponse(BaseModel):
    """Réponse de l'endpoint /health/ready."""

    status: Literal["ready", "not_ready"]
    dependencies: DependenciesResponse
