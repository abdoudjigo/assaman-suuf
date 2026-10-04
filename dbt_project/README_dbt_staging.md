<div align="center">

# DataFlow360 — dbt, transformations et modélisation

### US17 — Préparation des données · Sprint 1

[![Sprint](https://img.shields.io/badge/Sprint-1-6D28D9)](#)
[![US](https://img.shields.io/badge/User%20Story-US17-1D4ED8)](#)
[![Statut](https://img.shields.io/badge/Statut-Termin%C3%A9-16A34A)](#)
[![Stack](https://img.shields.io/badge/Stack-dbt%202.0.6%20%7C%20Snowflake-FF694B?logo=dbt&logoColor=white)](#)

> Transformer les données présentes dans Snowflake avec **dbt**, de la zone RAW jusqu'aux modèles analytiques exploitables par la BI, l'API et le ML.

</div>

---

## Vue d'ensemble des 15 étapes

| # | Étape | Résultat |
|:---:|---|---|
| 1 | Objectif et chaîne de transformation | RAW → STAGING → INTERMEDIATE → DIMENSIONS/FAITS → MARTS |
| 2 | Installation de dbt | Environnement `dbt_venv/`, dbt 2.0.6 |
| 3 | Connexion à Snowflake | `dbt debug` → tous les checks passés |
| 4 | Structure dbt | `models/{staging,intermediate,marts}`, `macros/`, `tests/` |
| 5 | Staging | 4 modèles (`stg_climat`, `stg_postgres_agriculture`, `stg_mongo_agriculture`, `stg_kafka_agriculture`) |
| 6 | Cas particulier Kafka | Extraction des champs depuis `RECORD_CONTENT` (VARIANT) |
| 7 | Correction `stg_climat` | `TRY_CAST` remplacé par des casts adaptés aux types réels |
| 8 | Transformations intermédiaires | `int_agriculture` (UNION ALL des 3 sources) |
| 9 | Préparation pour la modélisation | Structure commune stabilisée |
| 10 | Dimensions | `dim_zone`, `dim_produit`, `dim_annee`, `dim_station` |
| 11 | Tables de faits | `fct_agriculture`, `fct_climat` |
| 12 | Modèles analytiques | 3 marts |
| 13 | Contrôle qualité | 4 familles de contrôles, aucune correction supplémentaire |
| 14 | Architecture finale | 14 modèles au total |
| 15 | Validation finale | `dbt build` → 14 modèles, 29 tests, 43 opérations, 0 erreur |

---

## Sommaire

- [1. Objectif](#1-objectif)
- [2. Installation de dbt](#2-installation-de-dbt)
- [3. Connexion à Snowflake](#3-connexion-à-snowflake)
- [4. Structure dbt](#4-structure-dbt)
- [5. Staging](#5-staging)
- [6. Cas particulier de Kafka](#6-cas-particulier-de-kafka)
- [7. Correction du modèle climat](#7-correction-du-modèle-climat)
- [8. Transformations intermédiaires](#8-transformations-intermédiaires)
- [9. Préparation pour la modélisation](#9-préparation-pour-la-modélisation)
- [10. Dimensions](#10-dimensions)
- [11. Tables de faits](#11-tables-de-faits)
- [12. Modèles analytiques](#12-modèles-analytiques)
- [13. Contrôle qualité](#13-contrôle-qualité)
- [14. Architecture finale](#14-architecture-finale)
- [15. Validation finale](#15-validation-finale)

---

## 1. Objectif

```mermaid
flowchart LR
    SRC["Sources"] --> RAW[("Snowflake RAW")]
    RAW --> STG["STAGING"]
    STG --> INT["INTERMEDIATE"]
    INT --> DF["DIMENSIONS<br/>+ TABLES DE FAITS"]
    DF --> MA["MARTS<br/>ANALYTIQUES"]
    MA --> BI["BI / Analyse / ML"]

    classDef src fill:#F3F4F6,stroke:#6B7280,color:#374151
    classDef raw fill:#FEE2E2,stroke:#B91C1C,color:#7F1D1D
    classDef couche fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
    classDef mart fill:#F2C811,stroke:#92400E,color:#78350F,stroke-width:2px
    classDef sortie fill:#DCFCE7,stroke:#15803D,color:#14532D
    class SRC src
    class RAW raw
    class STG,INT,DF couche
    class MA mart
    class BI sortie
```

Le principe : chaque étape transforme et enrichit les données, sans jamais modifier directement la zone RAW.

---

## 2. Installation de dbt

```bash
# depuis la racine du projet
source dbt_venv/bin/activate

# depuis dbt_project/
source ../dbt_venv/bin/activate

dbt --version
# → dbt 2.0.6
```

---

## 3. Connexion à Snowflake

| Paramètre | Valeur |
|---|---|
| Account | `WHPMWEU-SY84726` |
| User | `ABDOUDJIGO243` |
| Database | `DATAFLOW360` |
| Warehouse | `DATAFLOW360_WH` |
| Role | `SYSADMIN` |

Configuration dans `~/.dbt/profiles.yml`. Le mot de passe n'est jamais versionné dans Git : il est chargé en variable d'environnement.

```bash
read -s -p "Mot de passe Snowflake: " SNOWFLAKE_PASSWORD
echo
export SNOWFLAKE_PASSWORD

dbt debug
# → Debugging connection test: OK
# → Debugged All checks passed!
```

---

## 4. Structure dbt

```text
dbt_project/
├── dbt_project.yml
├── macros/
├── models/
│   ├── staging/
│   ├── intermediate/
│   └── marts/
└── tests/
```

```mermaid
flowchart LR
    S["STAGING"] --> I["INTERMEDIATE"] --> M["MARTS"]

    classDef niveau fill:#DCE6F1,stroke:#1F3864,color:#1F3864
    class S,I,M niveau
```

---

## 5. Staging

Quatre modèles constituent la première couche de préparation des données RAW.

| Modèle Staging | Table RAW source |
|---|---|
| `stg_climat` | `DATAFLOW360.RAW.RAW_AIRBYTE_CLIMAT` |
| `stg_postgres_agriculture` | `DATAFLOW360.RAW.RAW_POSTGRES_AGRICULTURE` |
| `stg_mongo_agriculture` | `DATAFLOW360.RAW.RAW_MONGO_AGRICULTURE` |
| `stg_kafka_agriculture` | `DATAFLOW360.RAW.RAW_KAFKA_AGRICULTURE` |

```mermaid
flowchart LR
    R1[("RAW_AIRBYTE_CLIMAT")] --> SC["stg_climat"]
    R2[("RAW_POSTGRES_AGRICULTURE")] --> SP["stg_postgres_agriculture"]
    R3[("RAW_MONGO_AGRICULTURE")] --> SM["stg_mongo_agriculture"]
    R4[("RAW_KAFKA_AGRICULTURE")] --> SK["stg_kafka_agriculture"]

    classDef raw fill:#FEE2E2,stroke:#B91C1C,color:#7F1D1D
    classDef stg fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
    class R1,R2,R3,R4 raw
    class SC,SP,SM,SK stg
```

Transformations réalisées au Staging : suppression des colonnes techniques, standardisation des types, renommage des champs, extraction du JSON Kafka, préparation des données agricoles. L'harmonisation des formats, unités et valeurs entre les sources a été traitée séparément.

---

## 6. Cas particulier de Kafka

Les données Kafka arrivent principalement dans une colonne `VARIANT` nommée `RECORD_CONTENT`. Le modèle Staging extrait les champs du JSON plutôt que de conserver `RECORD_CONTENT` tel quel.

```mermaid
flowchart TB
    RC["RECORD_CONTENT<br/>(VARIANT)"] --> F1["fnid"]
    RC --> F2["region"]
    RC --> F3["departement"]
    RC --> F4["produit"]
    RC --> F5["saison"]
    RC --> F6["annee_semis / mois_semis"]
    RC --> F7["annee_recolte / mois_recolte"]
    RC --> F8["systeme_production"]
    RC --> F9["superficie_ha / production_t / rendement_t_ha"]

    classDef variant fill:#FEF3C7,stroke:#B45309,color:#78350F,stroke-width:2px
    classDef champ fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
    class RC variant
    class F1,F2,F3,F4,F5,F6,F7,F8,F9 champ
```

---

## 7. Correction du modèle climat

Après intégration d'une modification externe sur `stg_climat.sql`, des `TRY_CAST()` avaient été ajoutés aux colonnes climatiques — or ces colonnes RAW étaient déjà typées numériquement dans l'environnement Snowflake du projet.

```text
Function TRY_CAST cannot be used with arguments of types FLOAT
and NUMBER(38,0)
```

Correction appliquée : des casts adaptés aux types réels.

```sql
annee::INTEGER
mois::INTEGER
tavg::FLOAT
tmin::FLOAT
tmax::FLOAT
prcp_mm::FLOAT
nb_jours::INTEGER
```

Après correction, le pipeline complet a de nouveau été exécuté avec succès.

---

## 8. Transformations intermédiaires

`models/intermediate/int_agriculture.sql` regroupe les trois sources agricoles, qui partagent la même structure générale mais proviennent de systèmes différents.

```mermaid
flowchart LR
    SP["stg_postgres_agriculture"] --> U["UNION ALL"]
    SM["stg_mongo_agriculture"] --> U
    SK["stg_kafka_agriculture"] --> U
    U --> INT["int_agriculture"]

    classDef stg fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
    classDef union_ fill:#EDE9FE,stroke:#6D28D9,color:#4C1D95
    classDef inter fill:#FEF3C7,stroke:#B45309,color:#78350F,stroke-width:2px
    class SP,SM,SK stg
    class U union_
    class INT inter
```

Une colonne `source_system` conserve la provenance (`POSTGRES`, `MONGO`, `KAFKA`). Une colonne `annee_reference` donne une année commune aux analyses :

```mermaid
flowchart LR
    AR["annee_recolte"] --> C{"NULL ?"}
    C -- non --> O1["annee_reference = annee_recolte"]
    C -- oui --> AS["annee_semis"] --> O2["annee_reference = annee_semis"]

    classDef champ fill:#DCE6F1,stroke:#1F3864,color:#1F3864
    classDef decision fill:#FEF9C3,stroke:#A16207,color:#713F12
    classDef sortie fill:#DCFCE7,stroke:#15803D,color:#14532D
    class AR,AS champ
    class C decision
    class O1,O2 sortie
```

---

## 9. Préparation pour la modélisation

`int_agriculture` sert de base commune à la modélisation. Il contient : `fnid`, `region`, `departement`, `produit`, `saison`, `annee_semis`, `mois_semis`, `annee_recolte`, `mois_recolte`, `systeme_production`, `indicateur_qualite`, `superficie_ha`, `production_t`, `rendement_t_ha`, `source_system`, `annee_reference`.

Objectif : une structure suffisamment stable pour créer ensuite les dimensions et les tables de faits.

---

## 10. Dimensions

Quatre dimensions créées dans le schéma `MARTS`.

| Dimension | Contenu | Rôle |
|---|---|---|
| `dim_zone` | `fnid`, `region`, `departement` | Où se situe l'observation |
| `dim_produit` | Produits agricoles | Quel produit est concerné |
| `dim_annee` | Années (agricole + climat) | Analyses temporelles |
| `dim_station` | `station`, `station_nom` | Relier les observations climatiques aux stations |

---

## 11. Tables de faits

| Table de faits | Mesures | Clés vers les dimensions |
|---|---|---|
| `fct_agriculture` | `superficie_ha`, `production_t`, `rendement_t_ha` | `zone_key`, `produit_key`, `annee_key` (+ `source_system`) |
| `fct_climat` | `tavg`, `tmin`, `tmax`, `prcp_mm`, `nb_jours` | `station_key`, `annee_key` |

```mermaid
erDiagram
    DIM_ZONE ||--o{ FCT_AGRICULTURE : zone_key
    DIM_PRODUIT ||--o{ FCT_AGRICULTURE : produit_key
    DIM_ANNEE ||--o{ FCT_AGRICULTURE : annee_key
    DIM_STATION ||--o{ FCT_CLIMAT : station_key
    DIM_ANNEE ||--o{ FCT_CLIMAT : annee_key

    DIM_ZONE {
        string zone_key PK
        string fnid
        string region
        string departement
    }
    DIM_PRODUIT {
        string produit_key PK
        string produit
    }
    DIM_ANNEE {
        string annee_key PK
        int annee
    }
    DIM_STATION {
        string station_key PK
        string station
        string station_nom
    }
    FCT_AGRICULTURE {
        string zone_key FK
        string produit_key FK
        string annee_key FK
        float superficie_ha
        float production_t
        float rendement_t_ha
        string source_system
    }
    FCT_CLIMAT {
        string station_key FK
        string annee_key FK
        float tavg
        float tmin
        float tmax
        float prcp_mm
        int nb_jours
    }
```

---

## 12. Modèles analytiques

| Mart | Granularité | Indicateurs | Usage type |
|---|---|---|---|
| `mart_production_region_annee` | Zone × année | `production_totale_t`, `superficie_totale_ha`, `rendement_moyen_t_ha`, `nombre_observations` | Évolution de la production selon zones et années |
| `mart_production_produit_annee` | Produit × année | `production`, `superficie`, `rendement` | Évolution par produit agricole |
| `mart_climat_station_annee` | Station × année | `temperature_moyenne`, `temperature_minimale`, `temperature_maximale`, `precipitation_totale_mm`, `nombre_jours` | Situation climatique d'une station sur une année |

```mermaid
flowchart LR
    FA["fct_agriculture"] --> M1["mart_production_region_annee"]
    FA --> M2["mart_production_produit_annee"]
    FC["fct_climat"] --> M3["mart_climat_station_annee"]

    classDef fait fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
    classDef mart fill:#F2C811,stroke:#92400E,color:#78350F,stroke-width:2px
    class FA,FC fait
    class M1,M2,M3 mart
```

Ces modèles sont destinés à être utilisés directement par les analyses et les futurs dashboards.

---

## 13. Contrôle qualité

| Contrôle | Champs / critères | Résultat |
|---|---|---|
| Données agricoles | `mois_semis`, `mois_recolte`, `superficie_ha`, `production_t`, `rendement_t_ha` | 0 mois invalide, 0 superficie négative, 0 production négative, 0 rendement négatif |
| Valeurs textuelles | `region`, `departement`, `produit`, `saison` | Aucune incohérence de casse ou d'espaces |
| Valeurs NULL climatiques | Colonnes climatiques | Conservées, jamais remplacées par `0` |
| Kafka | Clés apparaissant plusieurs fois | Valeurs et offsets distincts → aucune déduplication artificielle |

```mermaid
flowchart TB
    C1["Agricole"] --> OK1(["0 valeur invalide"])
    C2["Textuel"] --> OK2(["0 incohérence"])
    C3["Climat NULL"] --> R3["Conservé, ≠ 0"]
    C4["Kafka"] --> R4["Événements distincts conservés"]

    classDef controle fill:#DCE6F1,stroke:#1F3864,color:#1F3864
    classDef ok fill:#DCFCE7,stroke:#15803D,color:#14532D
    classDef regle fill:#FEF9C3,stroke:#A16207,color:#713F12
    class C1,C2,C3,C4 controle
    class OK1,OK2 ok
    class R3,R4 regle
```

Aucune correction supplémentaire n'a été nécessaire sur ces critères.

---

## 14. Architecture finale

```mermaid
flowchart TB
    SF[("SNOWFLAKE")] --> RAW["RAW"]
    RAW --> STG["STAGING"]
    STG --> INT["INTERMEDIATE"]
    INT --> DIM["DIMENSIONS"]
    INT --> FACT["FACTS"]
    DIM --> MARTS["MARTS"]
    FACT --> MARTS
    MARTS --> OUT["ANALYSE / BI / ML"]

    classDef sf fill:#CFFAFE,stroke:#0E7490,color:#164E63,stroke-width:2px
    classDef couche fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
    classDef mart fill:#F2C811,stroke:#92400E,color:#78350F,stroke-width:2px
    classDef sortie fill:#DCFCE7,stroke:#15803D,color:#14532D
    class SF sf
    class RAW,STG,INT,DIM,FACT couche
    class MARTS mart
    class OUT sortie
```

```text
STAGING
├── stg_climat
├── stg_postgres_agriculture
├── stg_mongo_agriculture
└── stg_kafka_agriculture

INTERMEDIATE
└── int_agriculture

DIMENSIONS
├── dim_zone
├── dim_produit
├── dim_annee
└── dim_station

FACTS
├── fct_agriculture
└── fct_climat

MARTS
├── mart_production_region_annee
├── mart_production_produit_annee
└── mart_climat_station_annee
```

---

## 15. Validation finale

```bash
dbt build
```

```text
14 modèles
29 tests
43 opérations
43 succès
0 erreur
```

Les couches Staging, Intermediate et Marts sont construites avec succès dans Snowflake.

### Conclusion

Après correction du problème `TRY_CAST` sur `stg_climat` et intégration des modifications du projet, le pipeline dbt complet (14 modèles, 4 couches) tourne de bout en bout sans erreur. La prochaine tâche indépendante — le test approfondi des modèles dbt — sera documentée séparément.

---

<div align="center">

*Assaman & Suuf — DataFlow360 — US17 — dbt, transformations et modélisation*

</div>