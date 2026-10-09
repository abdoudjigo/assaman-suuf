"""
Schémas de réponse de l'API Produits.
"""

from pydantic import BaseModel

from schemas.common import Pagination


class ProduitItem(BaseModel):
    """Un produit agricole."""

    produit_key: str | None = None
    produit: str | None = None
    categorie: str | None = None


class ProduitResponse(BaseModel):
    """Réponse de la route Produits."""

    data: list[ProduitItem]
    pagination: Pagination
