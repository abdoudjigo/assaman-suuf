# DataFlow360 — Documentation technique
## Source 2 : PostgreSQL → Python/EDA → DLT → Snowflake

> **Projet :** Assaman-Suuf / DataFlow360  
> **Contribution :** Membre 2 — PostgreSQL  
> **Type de flux :** Batch  
> **Objectif :** préparer, contrôler et ingérer les données agricoles issues de PostgreSQL vers la couche RAW de Snowflake.

---

## 1. 🎯 Objectif de ma contribution

Dans l’architecture globale de **DataFlow360**, ma responsabilité concerne exclusivement la **Source 2 — PostgreSQL**.

L’objectif est de mettre en place une chaîne d’ingestion reproductible :

```text
┌──────────────────────────┐
│   DONNÉES AGRICOLES      │
│        CSV source        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       PostgreSQL         │
│  dataflow360_source_2    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│         Python           │
│     EDA + contrôles      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│          DLT             │
│    Ingestion batch       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│        Snowflake         │
│      DATAFLOW360 / RAW   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ RAW_POSTGRES_AGRICULTURE │
└──────────────────────────┘
```

> **Point important :** PostgreSQL est ici le **système source**. Snowflake est la destination analytique du projet.

---

# 2. 🏗️ Positionnement dans l’architecture globale

La solution DataFlow360 rassemble plusieurs sources. Ma contribution correspond uniquement au flux PostgreSQL.

```text
                         DATAFLOW360
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
   Source API            Source MongoDB          Source Kafka
       │                      │                      │
    Airbyte                   NiFi             Snowflake Connector
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  Snowflake   │
                       │     DWH      │
                       └──────┬───────┘
                              │
                         dbt + SQL
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
               BI            API          ML / IA

                 ╔══════════════════════════╗
                 ║     MA CONTRIBUTION      ║
                 ║                          ║
                 ║ PostgreSQL → Python/EDA  ║
                 ║       → DLT → Snowflake  ║
                 ╚══════════════════════════╝
```

## 2.1 Périmètre

| Élément | Rôle |
|---|---|
| PostgreSQL | Source des données agricoles |
| Python | Connexion, extraction et exploration |
| Pandas | Manipulation et analyse des données |
| DLT | Ingestion / chargement batch |
| DuckDB | Destination de test |
| Snowflake | Entrepôt de données cible |
| RAW | Couche d’atterrissage des données |
| `RAW_POSTGRES_AGRICULTURE` | Table cible de la source PostgreSQL |
| Airflow | Orchestration globale prévue |
| dbt | Transformation et modélisation en aval |

---

# 3. 📁 Organisation des fichiers

La partie PostgreSQL est organisée dans `ingestion/postgres_source/`.

```text
assaman-suuf/
│
├── .env                       # Variables sensibles, non versionnées
├── .env.example               # Modèle partageable
├── .gitignore
│
├── ingestion/
│   │
│   ├── data/
│   │   └── postgres_agriculture_1960_1989.csv
│   │
│   ├── postgres_source/
│   │   ├── .gitkeep
│   │   ├── 01_create_tables.sql
│   │   ├── 02_transform_staging.sql
│   │   ├── eda.py
│   │   ├── pipeline.py
│   │   └── test_snowflake.py
│   │
│   └── .venv/
│
├── api/
├── dashboard/
├── dbt_project/
├── docs/
├── ml/
├── orchestration/
└── tests/
```

### Rôle des fichiers

| Fichier | Fonction |
|---|---|
| `01_create_tables.sql` | Création des tables PostgreSQL |
| `02_transform_staging.sql` | Transformation de la staging vers la table finale |
| `eda.py` | EDA et contrôles de qualité |
| `pipeline.py` | Pipeline DLT |
| `test_snowflake.py` | Test de connexion Python → Snowflake |
| `.env` | Paramètres sensibles locaux |

---

# 4. 🗄️ Mise en place de PostgreSQL

La base source utilisée est :

```text
dataflow360_source_2
```

Les principales tables sont :

```text
PostgreSQL
│
└── dataflow360_source_2
    │
    ├── stg_agriculture_raw
    │       │
    │       │ Données brutes
    │       ▼
    │
    └── agriculture_production
            │
            │ Données structurées
            ▼
       Python / DLT
```

---

# 5. 📥 Chargement du CSV

Le fichier source est :

```text
ingestion/data/postgres_agriculture_1960_1989.csv
```

Il contient notamment :

```text
fnid
region
departement
produit
saison
annee_semis
mois_semis
annee_recolte
mois_recolte
systeme_production
indicateur_qualite
superficie_ha
production_t
rendement_t_ha
```

Le fichier a d’abord été chargé dans la table de staging :

```sql
\copy stg_agriculture_raw
FROM 'ingestion/data/postgres_agriculture_1960_1989.csv'
WITH (
    FORMAT csv,
    HEADER true,
    DELIMITER ','
);
```

Résultat :

```text
COPY 4457
```

### ✅ Résultat

**4 457 lignes** ont été chargées dans PostgreSQL.

---

# 6. 🔄 Transformation de la staging

Le flux de préparation est :

```text
CSV
 │
 ▼
┌──────────────────────┐
│ stg_agriculture_raw  │
│ données brutes       │
└──────────┬───────────┘
           │
           │ nettoyage / conversion
           ▼
┌────────────────────────┐
│ agriculture_production │
│ données structurées    │
└────────────────────────┘
```

La transformation a produit :

```text
INSERT 0 4457
```

La table finale contient donc **4 457 enregistrements**.

---

# 7. 🧬 Structure de `agriculture_production`

La table comporte 15 colonnes :

| Colonne | Type | Signification |
|---|---|---|
| `id` | integer | Identifiant technique |
| `fnid` | varchar | Identifiant de la donnée |
| `region` | varchar | Région |
| `departement` | varchar | Département |
| `produit` | varchar | Produit agricole |
| `saison` | varchar | Saison / campagne |
| `annee_semis` | smallint | Année du semis |
| `mois_semis` | smallint | Mois du semis |
| `annee_recolte` | smallint | Année de récolte |
| `mois_recolte` | smallint | Mois de récolte |
| `systeme_production` | varchar | Système de production |
| `indicateur_qualite` | smallint | Indicateur qualité |
| `superficie_ha` | double precision | Superficie en hectares |
| `production_t` | double precision | Production en tonnes |
| `rendement_t_ha` | double precision | Rendement en tonnes/ha |

---

# 8. 🔎 EDA — Exploration des données

Avant l’ingestion, une **Exploratory Data Analysis (EDA)** a été réalisée avec Python.

```text
                agriculture_production
                         │
                         ▼
                  ┌─────────────┐
                  │ Python / EDA│
                  └──────┬──────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Structure       Manquants      Cohérence
      des données     et anomalies    métier
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Data Quality
```

### Dimensions

```text
Lignes    : 4 457
Colonnes  : 15
```

---

# 9. 🕳️ Valeurs manquantes

Les valeurs manquantes identifiées sont :

| Variable | Valeurs manquantes |
|---|---:|
| `superficie_ha` | 13 |
| `production_t` | 27 |
| `rendement_t_ha` | 40 |

### Pourquoi conserver certains `NULL` ?

Le rendement suit la relation :

```text
                  Production
Rendement = ─────────────────────
                 Superficie
```

Lorsque la superficie ou la production est absente, il n’est pas possible de reconstruire correctement le rendement.

La décision retenue est donc de **conserver l’absence de donnée plutôt que d’inventer une valeur**.

---

# 10. 🌾 Répartition des produits agricoles

Les six produits observés sont :

| Produit | Observations |
|---|---:|
| Mil | 1 107 |
| Arachide (en coque) | 1 079 |
| Maïs | 744 |
| Niébé | 682 |
| Riz | 669 |
| Sorgho | 176 |

### Illustration

```text
Mil                 ██████████████████████  1107
Arachide            █████████████████████   1079
Maïs                ██████████████           744
Niébé               █████████████            682
Riz                 █████████████            669
Sorgho              ███                      176
```

---

# 11. 🗺️ Couverture géographique

Les données couvrent **14 régions** du Sénégal.

| Région | Observations |
|---|---:|
| Tambacounda | 486 |
| Kolda | 444 |
| Kaffrine | 420 |
| Sédhiou | 405 |
| Ziguinchor | 384 |
| Matam | 330 |
| Kédougou | 315 |
| Thiès | 307 |
| Saint-Louis | 290 |
| Kaolack | 290 |
| Fatick | 287 |
| Louga | 209 |
| Diourbel | 198 |
| Dakar | 92 |

---

# 12. 🧪 Contrôles de cohérence

Plusieurs contrôles ont été réalisés avant l’ingestion.

## 12.1 Doublons

```text
Doublons exacts détectés : 0
```

## 12.2 Cohérence du rendement

Sur les observations complètes :

```text
Observations complètes : 4 417
Incohérences détectées : 0
```

L’écart maximal entre le rendement enregistré et le rendement recalculé était de l’ordre de :

```text
1,776 × 10⁻¹⁵
```

Cet écart est compatible avec la précision numérique des calculs.

## 12.3 Cohérence temporelle

```text
Période : 1960 → 1989
Semis   : juin
Récolte : novembre
```

Aucune incohérence temporelle n’a été détectée.

---

# 13. ⚠️ Cas particulier : `None` vs `NULL`

Une anomalie importante a été découverte dans la colonne :

```text
systeme_production
```

Les valeurs semblaient nulles. Une vérification plus précise a montré qu’il ne s’agissait pas de `NULL` SQL, mais de la chaîne de caractères :

```text
"None"
```

### Différence fondamentale

```text
┌───────────────────────┐
│ NULL SQL              │
│ absence de valeur     │
└───────────────────────┘

            ≠

┌───────────────────────┐
│ "None"                │
│ texte de 4 caractères│
└───────────────────────┘
```

Ainsi, la requête :

```sql
WHERE systeme_production IS NULL
```

ne trouvait aucune ligne.

---

# 14. ✅ Correction métier : `None` → `Pluvial`

Après analyse du découpage de la source, les enregistrements PostgreSQL correspondent au système de production **pluvial**.

La correction appliquée est :

```sql
UPDATE agriculture_production
SET systeme_production = 'Pluvial'
WHERE systeme_production = 'None';
```

Résultat :

```text
UPDATE 4457
```

Contrôle :

```text
systeme_production | nombre
-------------------+--------
Pluvial            | 4457
```

### Transformation réalisée

```text
"None"
   │
   │ analyse de la donnée
   ▼
absence d'information exploitable
   │
   │ connaissance du découpage source
   ▼
"Pluvial"
```

Cette correction rend la donnée plus exploitable pour les traitements analytiques futurs.

---

# 15. 🚀 Mise en place de DLT

**DLT (Data Load Tool)** est utilisé pour gérer la partie ingestion / chargement.

Le pipeline lit les données PostgreSQL et les transmet à une destination.

```text
┌───────────────┐
│  PostgreSQL   │
└───────┬───────┘
        │ SELECT
        ▼
┌───────────────┐
│     Python    │
└───────┬───────┘
        │ records
        ▼
┌───────────────┐
│      DLT      │
│  batch load   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Destination │
└───────────────┘
```

---

# 16. 🧩 Fonctionnement de `pipeline.py`

Le pipeline utilise `psycopg2` pour se connecter à PostgreSQL et récupère les colonnes nécessaires.

Le principe de traitement est :

```text
Connexion PostgreSQL
        │
        ▼
      SELECT
        │
        ▼
Lecture ligne par ligne
        │
        ▼
Dictionnaire Python
        │
        ▼
Ressource DLT
        │
        ▼
Pipeline DLT
```

Les données récupérées comprennent :

```text
id
fnid
region
departement
produit
saison
annee_semis
mois_semis
annee_recolte
mois_recolte
systeme_production
indicateur_qualite
superficie_ha
production_t
rendement_t_ha
```

---

# 17. 🧹 Normalisation des valeurs

Le pipeline traite les représentations classiques d’absence de valeur :

```text
None SQL ───────► None
""       ───────► None
"NA"     ───────► None
"N/A"    ───────► None
"NaN"    ───────► None

Autre valeur ───► valeur conservée
```

Cette logique évite de conserver plusieurs représentations d’une même absence de donnée.

---

# 18. 🧪 Validation avec DuckDB

Avant l’intégration finale à Snowflake, le pipeline a été testé avec DuckDB.

```text
┌────────────────┐
│   PostgreSQL   │
│   4 457 lignes │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│      DLT       │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│     DuckDB     │
│  test local    │
└────────────────┘
```

Le chargement a été exécuté avec une stratégie de remplacement pendant les tests :

```python
write_disposition="replace"
```

Cela évite que les anciennes données de test soient conservées dans la destination.

### Résultat

```text
DLT load       : SUCCESS
Lignes         : 4 457
Échecs         : 0
```

Le flux **PostgreSQL → DLT → DuckDB** est donc validé.

---

# 19. ❄️ Préparation de Snowflake

L’équipe dispose d’un environnement Snowflake partagé :

```text
DATAFLOW360
│
├── RAW
├── STAGING
├── ANALYTICS
└── INFORMATION_SCHEMA
```

La table associée à ma source est :

```text
DATAFLOW360.RAW.RAW_POSTGRES_AGRICULTURE
```

---

# 20. 🧱 Structure de la table RAW

La structure de la table existante a été vérifiée avec :

```sql
DESC TABLE DATAFLOW360.RAW.RAW_POSTGRES_AGRICULTURE;
```

Elle contient :

| Colonne | Type | Rôle |
|---|---|---|
| `RECORD_CONTENT` | `VARIANT` | Contenu de l’enregistrement sous forme semi-structurée |
| `LOADED_AT` | `TIMESTAMP_NTZ` | Date/heure de chargement |

### Illustration

```text
┌──────────────────────────────────────────────────┐
│          RAW_POSTGRES_AGRICULTURE                │
├──────────────────────────────────┬───────────────┤
│ RECORD_CONTENT (VARIANT)         │ LOADED_AT     │
├──────────────────────────────────┼───────────────┤
│ { ... record PostgreSQL ... }    │ timestamp     │
│ { ... record PostgreSQL ... }    │ timestamp     │
│ { ... record PostgreSQL ... }    │ timestamp     │
└──────────────────────────────────┴───────────────┘
```

Le choix de `VARIANT` est adapté à une couche RAW où l’on souhaite conserver les enregistrements sous une forme semi-structurée avant les transformations aval.

---

# 21. 🔐 Gestion des secrets

Les paramètres sensibles sont stockés dans :

```text
.env
```

Structure utilisée :

```env
SNOWFLAKE_ACCOUNT=...
SNOWFLAKE_USER=...
SNOWFLAKE_PASSWORD=...
SNOWFLAKE_WAREHOUSE=DATAFLOW360_WH
SNOWFLAKE_DATABASE=DATAFLOW360
SNOWFLAKE_SCHEMA=RAW
```

Le fichier `.env` est exclu du dépôt Git grâce à `.gitignore`.

```text
                  PROJET
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      Code source           .env
          │                   │
          │                   └── secrets
          │
          └── GitHub          ✕
                              non versionné
```

> **Bonne pratique :** aucun mot de passe ou secret ne doit être écrit directement dans le code ou envoyé sur GitHub.

---

# 22. 🔌 Test Python → Snowflake

Un fichier dédié a été créé :

```text
ingestion/postgres_source/test_snowflake.py
```

Le test utilise `snowflake-connector-python` et `python-dotenv`.

La requête de vérification est :

```sql
SELECT CURRENT_WAREHOUSE(),
       CURRENT_DATABASE(),
       CURRENT_SCHEMA();
```

### Résultat

```text
Connexion Python → Snowflake : ✅ VALIDÉE
```

Cela signifie que les paramètres de connexion et l’accès à l’environnement Snowflake fonctionnent correctement.

---

# 23. 🧭 État d’avancement

```text
[01] CSV source
       │
       ▼
[02] PostgreSQL
       │ 4 457 lignes
       ▼
[03] Transformation SQL
       │
       ▼
[04] EDA + Data Quality
       │
       ▼
[05] Correction "None" → "Pluvial"
       │
       ▼
[06] DLT
       │
       ▼
[07] DuckDB — test réussi
       │
       ▼
[08] Python → Snowflake — connexion validée
       │
       ▼
[09] RAW_POSTGRES_AGRICULTURE
       │
       ▼
[10] Airflow — orchestration globale
```

| Étape | Statut |
|---|---|
| Base PostgreSQL | ✅ Réalisée |
| Chargement CSV | ✅ Réalisé |
| Transformation staging | ✅ Réalisée |
| EDA Python | ✅ Réalisée |
| Analyse des valeurs manquantes | ✅ Réalisée |
| Contrôle des doublons | ✅ Réalisé |
| Contrôle du rendement | ✅ Réalisé |
| Correction `None` → `Pluvial` | ✅ Réalisée |
| Installation DLT | ✅ Réalisée |
| Test PostgreSQL → DLT | ✅ Réalisé |
| Test DLT → DuckDB | ✅ Réalisé |
| Connexion Python → Snowflake | ✅ Validée |
| Chargement final DLT → Snowflake | ✅ Réalisé |
| Orchestration Airflow | 🔄 Étape suivante |
| Transformation dbt | 🔄 En aval |

---

# 24. 🔄 Flux final attendu

Une fois l’intégration Snowflake finalisée, mon flux sera :

```text
                         SOURCE 2
                            │
                            ▼
                 ┌───────────────────┐
                 │    PostgreSQL     │
                 │ dataflow360_      │
                 │ source_2          │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │      Python       │
                 │   EDA / Quality   │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │       DLT         │
                 │   batch ingestion │
                 └─────────┬─────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │        Snowflake         │
              │        DATAFLOW360       │
              │                          │
              │          RAW             │
              │            │             │
              │            ▼             │
              │ RAW_POSTGRES_AGRICULTURE│
              └────────────┬─────────────┘
                           │
                           ▼
                       STAGING
                           │
                           ▼
                       ANALYTICS
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                   BI            API
```

---

# 25. 🧠 Justification des choix techniques

## PostgreSQL

PostgreSQL fournit une source structurée et relationnelle adaptée aux données agricoles utilisées dans cette contribution.

## Python

Python est utilisé pour l’extraction, l’exploration, les contrôles et la préparation des données.

## Pandas

Pandas facilite l’analyse des dimensions, valeurs manquantes, distributions et contrôles de cohérence.

## DLT

DLT prend en charge la partie **ingestion / loading** et permet de construire un flux reproductible.

## DuckDB

DuckDB a servi de destination de test locale afin de valider le pipeline avant de travailler sur la destination Snowflake.

## Snowflake

Snowflake centralise les données dans l’entrepôt de données du projet.

## RAW

La couche RAW sert de zone d’atterrissage avant les transformations analytiques.

## Airflow

Airflow intervient ensuite comme outil d’orchestration pour automatiser et planifier les différents traitements du projet.

## dbt

dbt intervient en aval pour transformer, nettoyer, harmoniser et modéliser les données dans Snowflake.

---

# 26. 🧪 Stratégie de validation

La démarche suivie est volontairement progressive :

```text
                 VALIDATION PAR ÉTAPES

        ┌─────────────────────────────┐
        │ 1. PostgreSQL fonctionne    │
        └──────────────┬──────────────┘
                       ▼
        ┌─────────────────────────────┐
        │ 2. Données contrôlées       │
        └──────────────┬──────────────┘
                       ▼
        ┌─────────────────────────────┐
        │ 3. DLT fonctionne           │
        └──────────────┬──────────────┘
                       ▼
        ┌─────────────────────────────┐
        │ 4. DuckDB valide le flux    │
        └──────────────┬──────────────┘
                       ▼
        ┌─────────────────────────────┐
        │ 5. Snowflake est accessible │
        └──────────────┬──────────────┘
                       ▼
        ┌─────────────────────────────┐
        │ 6. Intégration finale       │
        └─────────────────────────────┘
```

Cette méthode permet d’identifier précisément l’origine d’un problème : source, extraction, ingestion ou destination.

---

# 27. 🛡️ Bonnes pratiques appliquées

### 🔐 Sécurité

- Secrets stockés dans `.env`.
- `.env` exclu de Git.
- Aucun mot de passe à publier dans le dépôt.

### 🧹 Qualité

- Contrôle des valeurs manquantes.
- Contrôle des doublons.
- Vérification des rendements.
- Vérification des dates et périodes.
- Vérification des valeurs textuelles particulières.

### 🧪 Tests

- Test du pipeline avec DuckDB.
- Test de connexion Python → Snowflake.
- Vérifications des volumes après ingestion.

### 🔄 Reproductibilité

Les différentes étapes sont séparées :

```text
SQL
 ↓
EDA
 ↓
DLT
 ↓
Test destination
 ↓
Snowflake
```

---

# 28. ⚠️ Difficultés rencontrées et solutions

## Difficulté 1 — Authentification PostgreSQL

L’accès PostgreSQL avec l’authentification `peer` ne fonctionnait pas dans certains contextes.

**Solution :** utiliser l’accès administrateur PostgreSQL pour les opérations nécessitant les droits correspondants, puis configurer l’accès Python.

---

## Difficulté 2 — Connexion Python à PostgreSQL

La connexion Python nécessitait les paramètres d’authentification PostgreSQL.

**Solution :** validation de la connexion puis déplacement des paramètres sensibles vers `.env` pour la version sécurisée du projet.

---

## Difficulté 3 — `None` n’était pas un `NULL`

Le champ `systeme_production` contenait le texte `"None"`.

**Solution :** identification du problème puis correction métier vers `Pluvial`.

---

## Difficulté 4 — Accumulation des données pendant les tests DLT

Des données de test pouvaient rester dans la destination.

**Solution :** utiliser `write_disposition="replace"` pendant la phase de validation afin de repartir d’un état propre.

---

## Difficulté 5 — Passage vers Snowflake

La connexion à Snowflake devait être vérifiée avant le chargement final.

**Solution :** création de `test_snowflake.py` et validation de la connexion Python → Snowflake.

---

# 29. 📊 Résultats clés

```text
╔══════════════════════════════════════════════╗
║       DATAFLOW360 — SOURCE POSTGRESQL       ║
╠══════════════════════════════════════════════╣
║ 4 457      lignes traitées                  ║
║ 15         colonnes                         ║
║ 0          doublon exact                    ║
║ 0          incohérence de rendement        ║
║ 40         rendements manquants             ║
║ 1960–1989  période couverte                 ║
║ 14         régions représentées             ║
║ 6          produits agricoles               ║
║ 4 457      lignes identifiées comme Pluvial ║
║ DLT        test DuckDB validé               ║
║ Snowflake  connexion Python validée         ║
╚══════════════════════════════════════════════╝
```

---

# 30. ❄️ Validation du chargement final dans Snowflake

Après la phase de test avec DuckDB, le pipeline a été connecté à l’environnement Snowflake partagé par l’équipe.

Le chargement final a été réalisé avec succès dans :

```text
DATAFLOW360.RAW.RAW_POSTGRES_AGRICULTURE
```

Le flux réellement validé est donc :

```text
┌──────────────────────┐
│      PostgreSQL      │
│ 4 457 enregistrements│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│        Python        │
│   extraction / EDA   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│         DLT          │
│   ingestion batch    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Snowflake       │
│     DATAFLOW360      │
│        RAW           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ RAW_POSTGRES_AGRICULTURE     │
│ RECORD_CONTENT : VARIANT     │
│ LOADED_AT      : TIMESTAMP   │
└──────────────────────────────┘
```

### État final de ma contribution

| Validation | Résultat |
|---|---|
| PostgreSQL source | ✅ Fonctionnel |
| 4 457 lignes disponibles | ✅ Validé |
| EDA / Data Quality | ✅ Réalisée |
| Correction `None` → `Pluvial` | ✅ Réalisée |
| PostgreSQL → DLT | ✅ Fonctionnel |
| DLT → DuckDB | ✅ Test validé |
| Python → Snowflake | ✅ Connexion validée |
| DLT → Snowflake | ✅ Chargement réalisé |
| Table RAW Snowflake | ✅ Alimentée |

Cette validation est importante : **ma chaîne d’ingestion n’est plus seulement testée localement ; les données sont effectivement présentes dans l’environnement Snowflake du projet.**

---

## 31. 🏁 Conclusion

La contribution **Source 2 — PostgreSQL** a permis de construire et de tester progressivement une chaîne d’ingestion de données agricoles.

Le travail réalisé couvre :

```text
       DONNÉES AGRICOLES
              │
              ▼
         PostgreSQL
              │
              ▼
       Python / EDA
              │
              ▼
        Data Quality
              │
              ▼
             DLT
              │
              ▼
            DuckDB
         (test validé)
              │
              ▼
          Snowflake
       (connexion validée)
              │
              ▼
 RAW_POSTGRES_AGRICULTURE
```

Les données ont été contrôlées sur plusieurs dimensions : valeurs manquantes, doublons, cohérence du rendement, cohérence temporelle et qualité des valeurs textuelles.

L’anomalie la plus significative identifiée était la présence de la chaîne `"None"` dans `systeme_production`. Après analyse du contexte de la source, ces valeurs ont été corrigées en `Pluvial`.

Le flux **PostgreSQL → DLT → DuckDB** a été validé avec **4 457 enregistrements**, et la connexion Python → Snowflake a également été validée.

La prochaine étape consiste à finaliser le chargement DLT vers la table RAW Snowflake partagée, puis à intégrer cette ingestion dans l’orchestration globale du projet avec Airflow.

---

# 📚 Annexe A — Objets techniques

### PostgreSQL

```text
Base      : dataflow360_source_2
Staging   : stg_agriculture_raw
Table     : agriculture_production
```

### Snowflake

```text
Database  : DATAFLOW360
Schema    : RAW
Table     : RAW_POSTGRES_AGRICULTURE
```

### DLT

```text
Pipeline  : postgres_agriculture
```

### Python

```text
Python
pandas
psycopg2
python-dotenv
dlt
snowflake-connector-python
```

---

# 📚 Annexe B — Vue synthétique pour présentation

```text
┌───────────────────────────────────────────────────────────────┐
│                  DATAFLOW360 — POSTGRESQL                     │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   CSV → PostgreSQL → Python/EDA → DLT → Snowflake             │
│                                                               │
│   4 457 lignes  •  15 colonnes  •  0 doublon exact           │
│                                                               │
│   Data Quality :                                               │
│   ✓ valeurs manquantes identifiées                            │
│   ✓ rendement contrôlé                                        │
│   ✓ cohérence temporelle vérifiée                             │
│   ✓ "None" → "Pluvial"                                      │
│                                                               │
│   Tests :                                                      │
│   ✓ PostgreSQL → DLT → DuckDB                                 │
│   ✓ Python → Snowflake                                        │
│                                                               │
│   Cible : DATAFLOW360.RAW.RAW_POSTGRES_AGRICULTURE            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

> **En une phrase :** j’ai construit, contrôlé et testé une chaîne d’ingestion batch permettant de faire circuler les données agricoles de PostgreSQL vers DLT, avec validation sur DuckDB et préparation de leur intégration dans la couche RAW de Snowflake.
