"""
Point d'entrée de l'API DataFlow360.

Ce fichier :
- crée l'application FastAPI ;
- configure le CORS ;
- enregistre les routers de l'API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.predictions import router as predictions_router
from routers.climat import router as climat_router
from routers.agriculture import router as agriculture_router
from routers.agroclimat import router as agroclimat_router
from routers.climat import router as climat_router
from routers.health import router as health_router
from routers.predictions import router as predictions_router
from routers.produits import router as produits_router
from routers.stations import router as stations_router
from routers.zones import router as zones_router

app = FastAPI(
    title="DataFlow360 API",
    description=(
        "API REST donnant accès aux données agricoles, climatiques, "
        "agroclimatiques et aux prédictions de rendement de DataFlow360."
    ),
    version="1.0.0",
)


# Autorise les applications frontend à appeler l'API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Endpoints techniques.
app.include_router(health_router)

# Endpoints métier.
app.include_router(agriculture_router)

app.include_router(climat_router)
app.include_router(agroclimat_router)
app.include_router(zones_router)
app.include_router(stations_router)
app.include_router(produits_router)
app.include_router(predictions_router)
