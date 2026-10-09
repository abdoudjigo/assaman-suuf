# Image du modèle de simulation du rendement : export du dataset et entraînement.
#
# Construire depuis la racine du projet (le code importe le paquet ml) :
#   docker build -f ml/Dockerfile -t dataflow360-ml .
#
# Voir ml/docker-compose.yml pour les commandes.

FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY ml/requirements-runtime.txt ml/requirements-runtime.txt
RUN pip install -r ml/requirements-runtime.txt

COPY ml/__init__.py ml/service_prediction.py ml/
COPY ml/scripts ml/scripts

# Utilisateur non root ; même UID que l'hôte pour écrire dans les volumes.
ARG UID=1000
RUN useradd --uid ${UID} --create-home ml \
    && mkdir -p ml/models data/processed \
    && chown -R ml:ml ml/models data
USER ml

# Les exports et le modèle vivent hors de l'image (volumes).
VOLUME ["/app/data/processed", "/app/ml/models"]

CMD ["python", "-m", "ml.scripts.entrainement"]
