"""
Schémas communs de l'API DataFlow360.
"""

from pydantic import BaseModel, Field


class Pagination(BaseModel):
    """Informations de pagination d'une réponse API."""

    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=200)
    total: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
