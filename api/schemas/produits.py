"""
Schémas de réponse de l'API Produits.
"""

from typing import Optional

from pydantic import BaseModel

from schemas.common import Pagination


class ProduitItem(BaseModel):
    """Un produit agricole."""

    produit_key: Optional[str] = None
    produit: Optional[str] = None
    categorie: Optional[str] = None


class ProduitResponse(BaseModel):
    """Réponse de la route Produits."""

    data: list[ProduitItem]
    pagination: Pagination
