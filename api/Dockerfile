# Image de l'API. Contexte de build = RACINE du projet (l'API importe le paquet ml) :
#   docker build -f api/Dockerfile -t dataflow360-api .
# Même version de Python que l'image ml (le modèle est entraîné avec elle).

FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY ml/requirements-runtime.txt ml/requirements-runtime.txt
COPY api/requirements.txt api/requirements.txt
RUN pip install -r ml/requirements-runtime.txt -r api/requirements.txt

# Code de l'API (à plat dans /app, comme les imports `from routers...`).
COPY api/main.py api/snowflake_client.py api/redis_client.py ./
COPY api/routers ./routers
COPY api/schemas ./schemas

# Code du modèle. Le .pkl n'est PAS dans l'image : volume monté en lecture seule.
COPY ml/__init__.py ml/service_prediction.py ml/
COPY ml/scripts ml/scripts

ARG UID=1000
RUN useradd --uid ${UID} --create-home api
USER api

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]