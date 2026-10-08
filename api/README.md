# DataFlow360 API

API REST du projet **DataFlow360**, construite avec **FastAPI** pour exposer les données agricoles, climatiques, agroclimatiques et les référentiels utilisés par le dashboard.

---

## 1. Objectif

L'API sert de **couche entre le frontend et le data warehouse Snowflake**.

```text
Frontend / Dashboard
        |
        v
     FastAPI
        |
   +----+----+
   |         |
 Redis    Snowflake
 Cache      Marts
```

Le frontend **ne dialogue pas directement avec Snowflake**.

L'API expose des routes simples, documentées dans Swagger, avec **pagination**, **filtres** et **réponses JSON stables**.

---

## 2. Adresse de l'API

En développement avec Docker :

```text
Base URL : http://localhost:8001
Swagger  : http://localhost:8001/docs
OpenAPI  : http://localhost:8001/openapi.json
```

Le conteneur FastAPI écoute sur le port **8000**. Le port **8001** est exposé sur la machine hôte.

```text
localhost:8001  ->  container:8000
```

Lors d'un futur déploiement, `localhost:8001` sera remplacé par le domaine ou l'adresse du serveur.

---

## 3. Technologies

```text
FastAPI
Uvicorn
Snowflake
Redis
Docker / Docker Compose
Pydantic
Python
Swagger / OpenAPI
```

---

## 4. Structure du dossier

```text
api/
├── Dockerfile
├── docker-compose.yml
├── main.py
├── requirements.txt
├── snowflake_client.py
├── redis_client.py
│
├── routers/
│   ├── __init__.py
│   ├── health.py
│   ├── agriculture.py
│   ├── climat.py
│   ├── agroclimat.py
│   ├── zones.py
│   ├── stations.py
│   └── produits.py
│
├── schemas/
│   ├── __init__.py
│   ├── common.py
│   ├── health.py
│   ├── agriculture.py
│   ├── climat.py
│   ├── agroclimat.py
│   ├── zones.py
│   ├── stations.py
│   └── produits.py
│
└── secrets/
    ├── snowflake_api_key.pem
    ├── snowflake_api_key.pub
    └── snowflake_api_key_password.txt
```

### Rôle des fichiers principaux

```text
main.py              : crée l'application FastAPI, configure CORS et enregistre les routers.
snowflake_client.py  : centralise la connexion Snowflake avec RSA/JWT.
redis_client.py      : centralise la connexion Redis et les fonctions de cache.
routers/             : contient les routes HTTP.
schemas/             : définit les contrats JSON avec Pydantic.
Dockerfile           : construit l'image de l'API.
docker-compose.yml   : démarre FastAPI et Redis en développement.
```

> ⚠️ Les secrets ne doivent **jamais** être commités dans Git.

---

## 5. Connexion Snowflake

L'API utilise le compte de service :

```env
SNOWFLAKE_USER=API_BACKEND_USER
SNOWFLAKE_ROLE=API_BACKEND_ROLE
```

L'authentification utilise une **paire de clés RSA/JWT**.

La connexion est centralisée dans :

```text
snowflake_client.py
```

Le router métier ne gère donc **ni la clé RSA ni les détails JWT**.

La base exposée par l'API est :

```text
DATAFLOW360
```

Les routes métiers utilisent principalement les objets du schéma :

```text
DATAFLOW360.MARTS
```

### Schéma de connexion

```text
FastAPI
   |
   v
snowflake_client.py
   |
   +-- RSA key (.pem)
   |
   +-- JWT
   |
   v
Snowflake (DATAFLOW360.MARTS)
```

---

## 6. Redis

Redis est utilisé comme **cache**.

Le principe est :

```text
Requête
   |
   v
Redis ?
  / \
oui  non
 |    |
 v    v
JSON  Snowflake
       |
       v
     Redis
       |
       v
     JSON
```

Une requête identique peut donc être servie directement depuis Redis sans interroger Snowflake.

### TTL

La durée du cache est actuellement :

```text
300 secondes
```

soit :

```text
5 minutes
```

La clé est générée à partir du **nom de la route** et de ses **paramètres**.

Par exemple :

```text
dataflow360:agriculture:<hash>
dataflow360:climat:<hash>
dataflow360:agroclimat:<hash>
```

> Une panne Redis **ne doit pas empêcher l'API de fonctionner** : si le cache est indisponible, l'API peut continuer vers Snowflake.

---

## 7. CORS

Pour la V1, l'API autorise les frontends depuis **toutes les origines** :

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Cela permet au dashboard de communiquer avec l'API sans ajouter immédiatement chaque domaine frontend.

Lors d'un déploiement de production avec des domaines connus, les origines pourront être **restreintes**.

---

## 8. Routes disponibles

### Vue d'ensemble

```text
/health
/health/ready

/api/v1/agriculture
/api/v1/climat
/api/v1/agroclimat
/api/v1/zones
/api/v1/stations
/api/v1/produits

/api/v1/predictions/rendement   (en pause)
```

### Health

```http
GET /health
```

Vérifie que FastAPI répond.

```json
{
  "status": "ok"
}
```

```http
GET /health/ready
```

Vérifie la disponibilité de Redis et Snowflake.

```json
{
  "status": "ready",
  "dependencies": {
    "redis": "ok",
    "snowflake": "ok"
  }
}
```

---

## 9. Agriculture

```http
GET /api/v1/agriculture
```

**Source :**

```text
DATAFLOW360.MARTS.FCT_AGRICULTURE
```

**Paramètres :**

```text
page
page_size
fnid
produit_key
annee_semis
systeme_production
```

**Exemple :**

```http
GET /api/v1/agriculture?page=1&page_size=3
```

**Exemple de réponse :**

```json
{
  "data": [
    {
      "observation_id": "00090df5d4f8f01df1f40ab59da78f23",
      "zone_key": "5d9abe3a7ab3d524b65109437c86d9b7",
      "produit_key": "be649e0c962325a75f86f846c7cf4d67",
      "fnid": "SN2008A20701",
      "region": "Thies",
      "departement": "Mbour",
      "produit": "Arachide (en coque)",
      "categorie": "Légumineuses et oléagineux",
      "saison": "Principale",
      "annee_semis": 1996,
      "mois_semis": 6,
      "annee_recolte": 1996,
      "mois_recolte": 11,
      "systeme_production": "Pluvial",
      "indicateur_qualite": 0,
      "superficie_ha": 44492.0,
      "production_t": 28786.0,
      "rendement_t_ha": 0.6469927177919625,
      "source_system": "MONGO"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 3,
    "total": 9979,
    "total_pages": 3327
  }
}
```

### Schéma de la réponse

```text
GET /api/v1/agriculture
        |
        v
FCT_AGRICULTURE
        |
        v
{
  data: [ ... ],
  pagination: { page, page_size, total, total_pages }
}
```

---

## 10. Climat

```http
GET /api/v1/climat
```

**Source :**

```text
DATAFLOW360.MARTS.FCT_CLIMAT
```

**Paramètres :**

```text
page
page_size
station_key
zone_key
annee
mois
```

**Exemple :**

```http
GET /api/v1/climat?page=1&page_size=3
```

**Exemple de réponse :**

```json
{
  "data": [
    {
      "observation_id": "0000870b04d057e0024eb0780ef33779",
      "station_key": "4cc0045829f14e3601545bde09ed5162",
      "station": "SGM00061630",
      "station_nom": "Matam/Ouro Sogui",
      "zone_key": "6f3434bf492d135c4605029bf92a83e3",
      "region": "Matam",
      "date_key": 201405,
      "annee": 2014,
      "mois": 5,
      "nom_mois": "Mai",
      "trimestre": 2,
      "est_hivernage": false,
      "tavg": 35.49,
      "tmin": 28.47,
      "tmax": 43.41,
      "prcp_mm": 0.8,
      "nb_jours": 31
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 3,
    "total": 6566,
    "total_pages": 2189
  }
}
```

**Pour tester une année inexistante :**

```http
GET /api/v1/climat?page=1&page_size=10&annee=2016
```

**Réponse attendue :**

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 0,
    "total_pages": 0
  }
}
```

---

## 11. Agroclimat

```http
GET /api/v1/agroclimat
```

**Source :**

```text
DATAFLOW360.MARTS.FCT_AGROCLIMAT_CAMPAGNE
```

Cette route expose une **campagne agricole enrichie par les indicateurs climatiques**.

**Paramètres :**

```text
page
page_size
fnid
produit_key
annee
systeme_production
```

**Exemple :**

```http
GET /api/v1/agroclimat?page=1&page_size=3&annee=2010
```

**Exemple de réponse :**

```json
{
  "data": [
    {
      "observation_id": "0275be78a75d7e245744a8d7a6b5c1d9",
      "zone_key": "573a23bbd59546addf34b46c5134f3c3",
      "produit_key": "232ae3e4e801bc06c2017d47db4cc892",
      "fnid": "SN2008A21702",
      "region": "Saint-Louis",
      "departement": "Podor",
      "produit": "Mil",
      "categorie": "Céréales",
      "annee": 2010,
      "saison": "Principale",
      "systeme_production": "Pluvial",
      "mois_semis": 6,
      "mois_recolte": 11,
      "duree_campagne_mois": 6,
      "indicateur_qualite": 0,
      "superficie_ha": 976.0,
      "production_t": 81.008,
      "rendement_t_ha": 0.0829999999999999,
      "a_climat": true,
      "nb_mois_climat": 6,
      "taux_couverture_climat": 1.0,
      "pluie_cumul_mm": 514.45,
      "pluie_mois_max_mm": 243.4,
      "nb_mois_secs": 2,
      "pluie_anomalie_mm": 304.98035555565,
      "tavg_moyenne": 29.21083333333333,
      "tmax_max": 40.99,
      "tmin_min": 20.48,
      "tavg_anomalie": -0.20524297455349996,
      "source_system": "KAFKA"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 3,
    "total": 261,
    "total_pages": 87
  }
}
```

### Schéma logique

```text
FCT_AGRICULTURE
        +
FCT_CLIMAT
        |
        v
FCT_AGROCLIMAT_CAMPAGNE
        |
        v
Campagne enrichie (pluie, températures, anomalies)
```

---

## 12. Zones

```http
GET /api/v1/zones
```

**Source :**

```text
DATAFLOW360.MARTS.DIM_ZONE
```

**Paramètres :**

```text
page
page_size
region
```

**Exemple :**

```http
GET /api/v1/zones?page=1&page_size=5&region=Kaolack
```

**Réponse :**

```json
{
  "data": [
    {
      "zone_key": "5295a51ae7edc57b78cc9e445fa8f0f8",
      "region": "Kaolack"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 5,
    "total": 1,
    "total_pages": 1
  }
}
```

---

## 13. Stations

```http
GET /api/v1/stations
```

**Source :**

```text
DATAFLOW360.MARTS.DIM_STATION
```

**Paramètres :**

```text
page
page_size
zone_key
search
```

**Exemple :**

```http
GET /api/v1/stations?page=1&page_size=5&search=Podor
```

**Réponse :**

```json
{
  "data": [
    {
      "station_key": "7a1b2b400b927dde2e0b1a2cac57dfdc",
      "station": "SG000061612",
      "station_nom": "Podor",
      "zone_key": "573a23bbd59546addf34b46c5134f3c3",
      "region": "Saint-Louis"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 5,
    "total": 1,
    "total_pages": 1
  }
}
```

---

## 14. Produits

```http
GET /api/v1/produits
```

**Source :**

```text
DATAFLOW360.MARTS.DIM_PRODUIT
```

**Paramètres :**

```text
page
page_size
categorie
search
```

**Exemple :**

```http
GET /api/v1/produits?page=1&page_size=5&search=Riz
```

**Réponse :**

```json
{
  "data": [
    {
      "produit_key": "5f9ed06570ae9b18ac299a256520f2b6",
      "produit": "Riz",
      "categorie": "Céréales"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 5,
    "total": 1,
    "total_pages": 1
  }
}
```

---

## 15. Pagination

Les routes de données utilisent :

```text
page
page_size
```

**Exemple :**

```http
GET /api/v1/agriculture?page=2&page_size=50
```

La réponse indique :

```json
{
  "pagination": {
    "page": 2,
    "page_size": 50,
    "total": 9979,
    "total_pages": 200
  }
}
```

La formule est simplement :

```text
total_pages = ceil(total / page_size)
```

Donc plus `page_size` est grand, moins il y a de pages.

La valeur maximale actuelle est :

```text
200 lignes par page
```

### Schéma de la pagination

```text
total = 9979
page_size = 50
        |
        v
total_pages = ceil(9979 / 50) = 200
```

---

## 16. NULL et données manquantes

Les valeurs absentes de Snowflake restent `null` dans la réponse JSON.

**Exemple :**

```json
{
  "prcp_mm": null
}
```

`null` signifie que la donnée est **absente**.

L'API **ne transforme pas** automatiquement une donnée absente en `0`.

---

## 17. Tester l'API

### Vérification syntaxique

Depuis le dossier `api/` :

```bash
python -m py_compile \
    main.py \
    snowflake_client.py \
    redis_client.py \
    routers/*.py \
    schemas/*.py
```

### Démarrage Docker

```bash
docker compose build
docker compose up -d
```

### Vérifier les conteneurs

```bash
docker compose ps
```

### Vérifier l'API

```bash
curl http://localhost:8001/health
```

### Vérifier les dépendances

```bash
curl http://localhost:8001/health/ready
```

### Vérifier Swagger

Ouvrir :

```text
http://localhost:8001/docs
```

---

## 18. Vérifier Redis

Lister les clés :

```bash
docker exec dataflow360-api-redis redis-cli keys 'dataflow360:*'
```

Voir la durée de vie d'une clé :

```bash
docker exec dataflow360-api-redis redis-cli ttl '<CLE_REDIS>'
```

Une nouvelle requête identique peut alors être servie depuis Redis au lieu de Snowflake.

---

## 19. Workflow de développement

Le développement actuel suit cette logique :

```text
1. Modifier le code
2. Vérifier Python
3. Rebuild Docker
4. Démarrer les conteneurs
5. Tester les routes
6. Vérifier Swagger
7. Vérifier Redis
8. Commit Git
9. Push Git
```

**Exemple :**

```bash
python -m py_compile main.py routers/*.py schemas/*.py
docker compose build
docker compose up -d
git status
git add api/
git commit -m "feat(api): add and improve API routes"
git push origin dev/djigo
```

Adapter le nom de branche si nécessaire.

---

## 20. Docker Hub

Le déploiement sur Docker Hub sera une étape séparée.

**Workflow prévu :**

```text
Git
 ↓
Docker build
 ↓
Tag de l'image
 ↓
Docker Hub
 ↓
Kubernetes
```

**Exemple :**

```bash
docker build -t <DOCKER_ID>/dataflow360-api:v1.0.0 .
docker login
docker push <DOCKER_ID>/dataflow360-api:v1.0.0
```

> ⚠️ Les secrets Snowflake ne doivent **jamais** être intégrés dans l'image Docker.

---

## 21. Kubernetes

Kubernetes sera traité après stabilisation de l'API.

**Architecture prévue :**

```text
Docker Hub
    |
    v
Kubernetes
    |
    +-- FastAPI Deployment
    |
    +-- FastAPI Service
    |
    +-- Redis Deployment
    |
    +-- Redis Service
    |
    +-- ConfigMap
    |
    +-- Secrets Snowflake
    |
    +-- Gateway / accès HTTP(S)
```

Le déploiement Kubernetes n'est **pas encore inclus** dans cette version de l'API.

---

## 22. Prédiction de rendement

La route suivante est prévue mais volontairement **en pause** :

```text
POST /api/v1/predictions/rendement
```

Elle dépendra du modèle ML réellement entraîné et de la liste exacte des features utilisées.

**Source ML :**

```text
DATAFLOW360.ML.ML_RENDEMENT_CAMPAGNE
```

Le contrat de cette route sera défini lorsque le modèle sera prêt.

---

## 23. Contrat frontend

Pour le membre qui développe le dashboard, les informations principales sont :

```text
Base URL locale :
http://localhost:8001

Swagger :
http://localhost:8001/docs

CORS :
toutes les origines autorisées en V1
```

Le frontend peut utiliser Swagger comme référence pour :

```text
routes
paramètres
schémas
types
exemples JSON
```

Le contrat API **ne nécessite pas d'accès direct à Snowflake**.

### Schéma global

```text
Frontend (Dashboard)
        |
        v
http://localhost:8001
        |
        v
     FastAPI
        |
   +----+----+
   |         |
 Redis    Snowflake
 Cache      Marts
```

---

## 24. État actuel

```text
FastAPI                         ✅
Swagger / OpenAPI               ✅
CORS                            ✅
Connexion Snowflake RSA/JWT    ✅
Redis                           ✅
Docker Compose                  ✅
Pagination                      ✅
Filtres                         ✅

Agriculture                     ✅
Climat                          ✅
Agroclimat                      ✅
Zones                           ✅
Stations                        ✅
Produits                        ✅

Prediction rendement            ⏸️
Docker Hub                      ⏳
Kubernetes                      ⏳
CI/CD                            ⏳
```

---

## Source de vérité

Pour tester et découvrir les routes :

```text
http://localhost:8001/docs
```

Le fichier `openapi.json` est disponible à :

```text
http://localhost:8001/openapi.json
```
