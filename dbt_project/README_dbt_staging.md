# DataFlow360 — dbt, Staging et Nettoyage des données

## 1. Objectif

Cette partie du projet met en place **dbt** entre les tables RAW de Snowflake et les futurs modèles analytiques.

L'objectif est simple :

```text
Sources
   ↓
Ingestion
   ↓
Snowflake RAW
   ↓
dbt Staging
   ↓
Nettoyage / Harmonisation
   ↓
Intermediate
   ↓
Marts / BI / ML
```

Le staging est la première couche de transformation. Il ne doit pas contenir de logique métier complexe. Il sert surtout à :

- retirer les colonnes techniques qui ne servent pas à l'analyse ;
- renommer les colonnes avec une convention cohérente ;
- harmoniser les types ;
- extraire les données JSON/VARIANT lorsque nécessaire ;
- appliquer les premières règles de qualité simples et documentées ;
- préparer les données pour les modèles `intermediate` et `marts`.

---

# 2. État initial du projet dbt

Le dépôt contenait déjà le dossier :

```text
dbt_project/
└── models/
```

Mais il ne contenait pas encore :

```text
dbt_project.yml
profiles.yml
```

Nous avons donc initialisé uniquement la structure nécessaire à dbt, sans modifier les autres composants du projet DataFlow360.

---

# 3. Installation de dbt

Un environnement Python dédié est utilisé :

```text
dbt_venv/
```

Activation depuis la racine du projet :

```bash
source dbt_venv/bin/activate
```

Depuis le dossier `dbt_project`, le même environnement s'active avec :

```bash
source ../dbt_venv/bin/activate
```

Version utilisée :

```bash
dbt --version
```

Résultat :

```text
dbt 2.0.6
```

---

# 4. Structure actuelle du projet dbt

```text
dbt_project/
├── dbt_project.yml
└── models/
    └── staging/
        ├── sources.yml
        ├── stg_climat.sql
        ├── stg_kafka_agriculture.sql
        ├── stg_mongo_agriculture.sql
        └── stg_postgres_agriculture.sql
```

Les dossiers suivants sont également prévus pour la suite du projet :

```text
models/
├── staging/
├── intermediate/
└── marts/
```

---

# 5. Configuration du projet dbt

Fichier :

```text
dbt_project/dbt_project.yml
```

Configuration finale utilisée :

```yaml
name: dataflow360
version: '1.0.0'
config-version: 2

profile: dataflow360

model-paths: ["models"]

models:
  dataflow360:
    staging:
      +materialized: view
```

## Pourquoi `materialized: view` ?

Les modèles staging ne sont pas encore les tables analytiques finales.

Ils sont créés comme des **views Snowflake** :

```text
RAW table
   ↓
STAGING view
```

Cela permet de garder les données RAW intactes et d'appliquer les transformations dans dbt.

---

# 6. Connexion à Snowflake

La connexion dbt utilise Snowflake comme entrepôt de données.

Informations utilisées :

```text
Account   : WHPMWEU-SY84726
User      : ABDOUDJIGO243
Database  : DATAFLOW360
Warehouse : DATAFLOW360_WH
Role      : SYSADMIN
Schema    : STAGING
```

Le fichier de profil est :

```text
~/.dbt/profiles.yml
```

Configuration utilisée :

```yaml
dataflow360:
  target: dev

  outputs:
    dev:
      type: snowflake
      account: WHPMWEU-SY84726
      user: ABDOUDJIGO243
      password: "{{ env_var('SNOWFLAKE_PASSWORD') }}"
      authenticator: username_password_mfa
      role: SYSADMIN
      database: DATAFLOW360
      warehouse: DATAFLOW360_WH
      schema: STAGING
      threads: 4
```

Le mot de passe n'est pas écrit directement dans le dépôt.

Il est chargé temporairement dans la session shell :

```bash
read -s -p "Mot de passe Snowflake: " SNOWFLAKE_PASSWORD
echo
export SNOWFLAKE_PASSWORD
```

Vérification sans afficher le mot de passe :

```bash
[ -n "$SNOWFLAKE_PASSWORD" ] && echo "PASSWORD OK" || echo "PASSWORD VIDE"
```

Résultat obtenu pendant la configuration :

```text
PASSWORD OK
```

---

# 7. Vérification de la connexion

Commande utilisée :

```bash
dbt debug
```

Résultat final :

```text
Debugging connection test: OK
Debugged All checks passed!
```

La connexion suivante est donc validée :

```text
DBT
 ↓
Snowflake
 ↓
DATAFLOW360
```

---

# 8. Problème d'authentification rencontré

La première tentative utilisait :

```yaml
authenticator: externalbrowser
```

La connexion a échoué avec :

```text
Snowflake 390190
There was an error related to the SAML Identity Provider account parameter.
```

Vérifications effectuées dans Snowflake :

```sql
SELECT
    CURRENT_ORGANIZATION_NAME(),
    CURRENT_ACCOUNT_NAME(),
    CURRENT_ACCOUNT();
```

Résultats :

```text
ORGANIZATION : WHPMWEU
ACCOUNT NAME : SY84726
ACCOUNT     : CI23365
```

Puis :

```sql
SHOW PARAMETERS LIKE 'SAML_IDENTITY_PROVIDER' IN ACCOUNT;
```

Le paramètre historique `SAML_IDENTITY_PROVIDER` était présent.

La commande :

```sql
SHOW INTEGRATIONS;
```

n'a retourné aucun résultat visible avec le rôle utilisé.

Pour éviter de modifier la sécurité globale du compte Snowflake, la configuration dbt a finalement utilisé :

```yaml
authenticator: username_password_mfa
```

avec le mot de passe fourni par variable d'environnement.

Cette configuration a permis d'obtenir :

```text
Debugged All checks passed!
```

---

# 9. Déclaration des sources RAW dans dbt

Fichier :

```text
models/staging/sources.yml
```

Contenu :

```yaml
version: 2

sources:
  - name: raw
    database: DATAFLOW360
    schema: RAW
    tables:
      - name: raw_airbyte_climat
      - name: raw_kafka_agriculture
      - name: raw_mongo_agriculture
      - name: raw_postgres_agriculture
```

## Pourquoi utiliser `source()` ?

Dans un modèle dbt, on utilise par exemple :

```sql
{{ source('raw', 'raw_kafka_agriculture') }}
```

plutôt que de coder directement :

```text
DATAFLOW360.RAW.RAW_KAFKA_AGRICULTURE
```

Cela permet de déclarer clairement les sources du projet et de garder les modèles dbt lisibles.

---

# 10. Premier problème de configuration : `STAGING_STAGING`

La première configuration ajoutait :

```yaml
schema: STAGING
```

dans `profiles.yml` et également :

```yaml
+schema: STAGING
```

dans `dbt_project.yml`.

dbt créait alors :

```text
DATAFLOW360.STAGING_STAGING
```

Ce n'était pas le résultat recherché.

La configuration du projet a été simplifiée en supprimant :

```yaml
+schema: STAGING
```

Le profil conserve :

```yaml
schema: STAGING
```

Les modèles sont maintenant créés dans :

```text
DATAFLOW360.STAGING
```

---

# 11. Validation du projet dbt

Commande utilisée :

```bash
dbt parse
```

Une première exécution a signalé un warning car aucun modèle staging n'existait encore.

Après création des modèles :

```text
dbt parse
```

résultat :

```text
Execution Summary
Finished 'parse' successfully for target 'dev'
```

---

# 12. Les quatre sources RAW du projet

Les quatre tables RAW utilisées sont :

```text
DATAFLOW360.RAW.RAW_AIRBYTE_CLIMAT
DATAFLOW360.RAW.RAW_KAFKA_AGRICULTURE
DATAFLOW360.RAW.RAW_MONGO_AGRICULTURE
DATAFLOW360.RAW.RAW_POSTGRES_AGRICULTURE
```

Volumes connus lors de l'audit initial :

| Source | Table RAW | Lignes |
|---|---|---:|
| Airbyte | `RAW_AIRBYTE_CLIMAT` | 6566 |
| Kafka | `RAW_KAFKA_AGRICULTURE` | 2511 |
| MongoDB | `RAW_MONGO_AGRICULTURE` | 3011 |
| PostgreSQL | `RAW_POSTGRES_AGRICULTURE` | 4457 |

---

# 13. Modèle `stg_climat`

Source :

```text
RAW_AIRBYTE_CLIMAT
```

Colonnes techniques Airbyte supprimées du staging :

```text
_AIRBYTE_RAW_ID
_AIRBYTE_EXTRACTED_AT
_AIRBYTE_META
_AIRBYTE_GENERATION_ID
```

Colonnes métier conservées :

```text
id
station
station_nom
annee
mois
tavg
tmin
tmax
prcp_mm
nb_jours
```

Modèle :

```sql
SELECT
    id::INTEGER                 AS id,
    TRIM(station)               AS station,
    TRIM(station_nom)           AS station_nom,
    annee::INTEGER              AS annee,
    mois::INTEGER               AS mois,
    tavg::FLOAT                 AS tavg,
    tmin::FLOAT                 AS tmin,
    tmax::FLOAT                 AS tmax,
    prcp_mm::FLOAT              AS prcp_mm,
    nb_jours::INTEGER           AS nb_jours
FROM {{ source('raw', 'raw_airbyte_climat') }}
```

## Règle importante sur les valeurs manquantes

Le diagnostic initial a montré des NULL dans les variables climatiques :

```text
TAVG  → 618 NULL
TMIN  → 1414 NULL
TMAX  → 1197 NULL
PRCP  → 1497 NULL
```

Ces NULL ne sont pas transformés automatiquement en `0`.

Principe retenu :

```text
NULL = valeur inconnue / non disponible
0    = valeur réellement nulle
```

Le choix d'une éventuelle imputation sera fait plus tard et devra être justifié par le besoin analytique.

---

# 14. Modèle `stg_kafka_agriculture`

Kafka est différent des autres sources.

Dans RAW, les colonnes principales sont :

```text
RECORD_METADATA
RECORD_CONTENT
```

Les données métier sont dans :

```text
RECORD_CONTENT
```

qui est un champ Snowflake `VARIANT`.

Le staging extrait donc les champs JSON :

```text
RECORD_CONTENT
      ↓
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

Modèle :

```sql
SELECT
    RECORD_CONTENT:fnid::VARCHAR AS fnid,
    RECORD_CONTENT:region::VARCHAR AS region,
    RECORD_CONTENT:departement::VARCHAR AS departement,
    RECORD_CONTENT:produit::VARCHAR AS produit,
    RECORD_CONTENT:saison::VARCHAR AS saison,
    RECORD_CONTENT:annee_semis::INTEGER AS annee_semis,
    RECORD_CONTENT:mois_semis::INTEGER AS mois_semis,
    RECORD_CONTENT:annee_recolte::INTEGER AS annee_recolte,
    RECORD_CONTENT:mois_recolte::INTEGER AS mois_recolte,

    CASE
        WHEN LOWER(TRIM(RECORD_CONTENT:systeme_production::VARCHAR))
            IN ('none', 'pluvial')
            THEN 'Pluvial'
        WHEN LOWER(TRIM(RECORD_CONTENT:systeme_production::VARCHAR))
            = 'irrigué'
            THEN 'Irrigué'
        WHEN LOWER(TRIM(RECORD_CONTENT:systeme_production::VARCHAR))
            LIKE 'décrue%'
            THEN 'Décrue (PS)'
        ELSE NULL
    END AS systeme_production,

    RECORD_CONTENT:indicateur_qualite::INTEGER AS indicateur_qualite,
    TRY_CAST(RECORD_CONTENT:superficie_ha::VARCHAR AS FLOAT) AS superficie_ha,
    TRY_CAST(RECORD_CONTENT:production_t::VARCHAR AS FLOAT) AS production_t,
    TRY_CAST(RECORD_CONTENT:rendement_t_ha::VARCHAR AS FLOAT) AS rendement_t_ha

FROM {{ source('raw', 'raw_kafka_agriculture') }}
```

---

# 15. Modèle `stg_mongo_agriculture`

Source :

```text
RAW_MONGO_AGRICULTURE
```

Mongo contient déjà les colonnes métier sous forme aplatie.

Le staging conserve notamment :

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

Modèle :

```sql
SELECT
    fnid::VARCHAR AS fnid,
    TRIM(region) AS region,
    TRIM(departement) AS departement,
    TRIM(produit) AS produit,
    TRIM(saison) AS saison,
    annee_semis::INTEGER AS annee_semis,
    mois_semis::INTEGER AS mois_semis,
    annee_recolte::INTEGER AS annee_recolte,
    mois_recolte::INTEGER AS mois_recolte,

    CASE
        WHEN LOWER(TRIM(systeme_production)) IN ('none', 'pluvial')
            THEN 'Pluvial'
        WHEN LOWER(TRIM(systeme_production)) = 'irrigué'
            THEN 'Irrigué'
        WHEN LOWER(TRIM(systeme_production)) LIKE 'décrue%'
            THEN 'Décrue (PS)'
        ELSE NULL
    END AS systeme_production,

    indicateur_qualite::INTEGER AS indicateur_qualite,
    superficie_ha::FLOAT AS superficie_ha,
    production_t::FLOAT AS production_t,
    rendement_t_ha::FLOAT AS rendement_t_ha

FROM {{ source('raw', 'raw_mongo_agriculture') }}
```

---

# 16. Modèle `stg_postgres_agriculture`

Source :

```text
RAW_POSTGRES_AGRICULTURE
```

Certaines colonnes RAW sont techniques et ne sont pas nécessaires dans le staging analytique :

```text
RECORD_CONTENT
LOADED_AT
_DLT_LOAD_ID
_DLT_ID
```

Elles ne sont donc pas sélectionnées dans le staging.

Colonnes métier retenues :

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

Le modèle utilise la même harmonisation de `systeme_production` que MongoDB et Kafka.

---

# 17. Harmonisation de `systeme_production`

Cette règle est appliquée aux trois sources agricoles :

```text
PostgreSQL
MongoDB
Kafka
```

Règle actuelle :

```sql
CASE
    WHEN LOWER(TRIM(systeme_production)) IN ('none', 'pluvial')
        THEN 'Pluvial'
    WHEN LOWER(TRIM(systeme_production)) = 'irrigué'
        THEN 'Irrigué'
    WHEN LOWER(TRIM(systeme_production)) LIKE 'décrue%'
        THEN 'Décrue (PS)'
    ELSE NULL
END
```

Pour Kafka, le champ est d'abord extrait de `RECORD_CONTENT`.

## Pourquoi `TRIM()` et `LOWER()` ?

Exemples de variations possibles :

```text
"pluvial"
"Pluvial"
" PLUVIAL "
```

Après normalisation, ces valeurs peuvent être comparées de manière cohérente.

## Pourquoi ne pas utiliser `UPPER()` partout ?

Parce que certaines valeurs servent aussi à l'affichage.

La convention choisie ici est lisible :

```text
Pluvial
Irrigué
Décrue (PS)
```

---

# 18. Premier problème SQL rencontré : `TRY_CAST`

Lors du premier `dbt run --select staging`, deux modèles ont échoué.

## Erreur 1 : PostgreSQL

Message :

```text
Function TRY_CAST cannot be used with arguments of types
NUMBER(19,0) and NUMBER(38,0)
```

## Erreur 2 : Climat

Message :

```text
Function TRY_CAST cannot be used with arguments of types
FLOAT and NUMBER(38,0)
```

Cause : certaines colonnes RAW étaient déjà numériques.

Nous avions initialement écrit, par exemple :

```sql
TRY_CAST(annee AS INTEGER)
```

sur une colonne déjà typée numérique.

Pour les colonnes déjà numériques, le modèle final utilise directement :

```sql
annee::INTEGER
```

ou :

```sql
tavg::FLOAT
```

## Quand utiliser `TRY_CAST` ?

Il est particulièrement utile lorsqu'une conversion peut échouer, par exemple lorsqu'une donnée arrive sous forme de texte :

```text
"546"
"4641.5"
"2010"
```

Dans Kafka, les valeurs numériques sont extraites de JSON sous forme de texte avant conversion pour certaines colonnes, d'où l'utilisation de :

```sql
TRY_CAST(RECORD_CONTENT:production_t::VARCHAR AS FLOAT)
```

---

# 19. Exécution finale des staging

Commande :

```bash
dbt run --select staging
```

Résultat final :

```text
Succeeded model STAGING.stg_climat
Succeeded model STAGING.stg_mongo_agriculture
Succeeded model STAGING.stg_postgres_agriculture
Succeeded model STAGING.stg_kafka_agriculture

Processed: 4 models
Summary: 4 total | 4 success
```

Les quatre modèles sont donc actuellement créés dans :

```text
DATAFLOW360.STAGING
```

et sont des **views**.

---

# 20. Incohérences de données déjà identifiées avant le staging

## 20.1 Différences entre les sources agricoles

Les trois sources agricoles utilisent le même ensemble conceptuel de colonnes :

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

Mais leur représentation diffère :

```text
PostgreSQL → colonnes relationnelles + métadonnées techniques
MongoDB    → colonnes relationnelles issues du document MongoDB
Kafka      → JSON/VARIANT dans RECORD_CONTENT
```

Le staging sert précisément à harmoniser ces différences de représentation.

## 20.2 `systeme_production`

Une incohérence de représentation a été identifiée et traitée :

```text
none
pluvial
irrigué
décrue...
```

Harmonisation :

```text
none / pluvial → Pluvial
irrigué        → Irrigué
décrue...      → Décrue (PS)
```

## 20.3 NULL climatiques

Les valeurs NULL suivantes ont été observées dans la source climat :

```text
TAVG  : 618
TMIN  : 1414
TMAX  : 1197
PRCP  : 1497
```

Décision actuelle : **conserver les NULL**.

Aucune conversion automatique de NULL en zéro n'est appliquée.

## 20.4 Doublons

Les contrôles précédents réalisés sur les clés testées dans PostgreSQL et MongoDB n'ont pas montré de doublons justifiant une déduplication complexe.

Par conséquent, aucun `ROW_NUMBER()` artificiel n'a été ajouté au staging.

Si un vrai doublon est découvert pendant le diagnostic final, la règle de déduplication sera définie selon la clé métier concernée.

---

# 21. Règles de nettoyage prévues

Les règles suivantes sont appliquées ou prévues uniquement lorsqu'elles sont justifiées par le diagnostic.

## Types

```text
"2010"   → 2010
"546"    → 546
"4641.5" → 4641.5
```

Exemples SQL :

```sql
TRY_CAST(valeur AS INTEGER)
TRY_CAST(valeur AS FLOAT)
```

ou, lorsque la colonne RAW est déjà numérique :

```sql
valeur::INTEGER
valeur::FLOAT
```

## Chaînes

Nettoyage léger :

```sql
TRIM(colonne)
```

Normalisation pour comparaison :

```sql
LOWER(TRIM(colonne))
```

Forme lisible pour certaines valeurs métier :

```text
Pluvial
Irrigué
Décrue (PS)
```

## Mois

Règle de validité :

```text
mois_semis BETWEEN 1 AND 12
mois_recolte BETWEEN 1 AND 12
```

## Mesures agricoles

Règle de validité :

```text
superficie_ha >= 0
production_t >= 0
rendement_t_ha >= 0
```

Une valeur invalide n'est pas supprimée automatiquement.

Elle doit d'abord être identifiée, puis traitée selon une règle documentée.

## NULL

Principe :

```text
NULL ≠ 0
```

Une absence de donnée n'est pas automatiquement transformée en valeur zéro.

---

# 22. Contrôles qualité à exécuter

Les prochains contrôles doivent comparer les trois sources agricoles et vérifier les valeurs invalides.

## Volumes

```sql
SELECT 'CLIMAT' AS source, COUNT(*) AS lignes
FROM RAW.RAW_AIRBYTE_CLIMAT

UNION ALL

SELECT 'KAFKA', COUNT(*)
FROM RAW.RAW_KAFKA_AGRICULTURE

UNION ALL

SELECT 'MONGO', COUNT(*)
FROM RAW.RAW_MONGO_AGRICULTURE

UNION ALL

SELECT 'POSTGRES', COUNT(*)
FROM RAW.RAW_POSTGRES_AGRICULTURE;
```

## Valeurs de `systeme_production`

```sql
SELECT
    'MONGO' AS source,
    LOWER(TRIM(systeme_production)) AS valeur,
    COUNT(*) AS lignes
FROM RAW.RAW_MONGO_AGRICULTURE
GROUP BY 2

UNION ALL

SELECT
    'POSTGRES',
    LOWER(TRIM(systeme_production)),
    COUNT(*)
FROM RAW.RAW_POSTGRES_AGRICULTURE
GROUP BY 2

ORDER BY source, valeur;
```

Kafka est contrôlé séparément car ses valeurs sont dans `RECORD_CONTENT`.

## Valeurs agricoles invalides

Contrôler notamment :

```text
mois_semis < 1 ou > 12
mois_recolte < 1 ou > 12
superficie_ha < 0
production_t < 0
rendement_t_ha < 0
```

---

# 23. Pourquoi ne pas mettre tout le nettoyage dans le staging ?

Le staging doit rester simple.

Exemple :

```text
STAGING
├── rename
├── cast
├── trim
├── extraction JSON
└── harmonisations de base
```

Puis :

```text
INTERMEDIATE
├── jointures
├── règles métier
├── enrichissement
├── calculs préparatoires
└── contrôles plus complexes
```

Et enfin :

```text
MARTS
├── faits
├── dimensions
├── KPI
└── données prêtes pour Power BI / ML
```

---

# 24. Commandes utiles

## Activer l'environnement

Depuis la racine :

```bash
source dbt_venv/bin/activate
```

Depuis `dbt_project/` :

```bash
source ../dbt_venv/bin/activate
```

## Vérifier dbt

```bash
dbt --version
```

## Vérifier la configuration

```bash
dbt debug
```

## Vérifier la syntaxe / le projet

```bash
dbt parse
```

## Lister les modèles staging

```bash
dbt ls --select staging
```

## Exécuter tous les staging

```bash
dbt run --select staging
```

## Exécuter un seul modèle

```bash
dbt run --select stg_climat
```

Exemples :

```bash
dbt run --select stg_kafka_agriculture
dbt run --select stg_mongo_agriculture
dbt run --select stg_postgres_agriculture
```

---

# 25. État actuel du travail

```text
[✅] dbt installé
[✅] dbt 2.0.6
[✅] projet dbt configuré
[✅] connexion Snowflake validée
[✅] sources RAW déclarées
[✅] stg_climat
[✅] stg_kafka_agriculture
[✅] stg_mongo_agriculture
[✅] stg_postgres_agriculture
[✅] staging matérialisé en views
[✅] schéma DATAFLOW360.STAGING
[✅] première harmonisation systeme_production
[✅] premières règles de nettoyage

[⏳] diagnostic approfondi des incohérences restantes
[⏳] contrôles qualité dbt
[⏳] modèles intermediate
[⏳] modèles marts
```

---

# 26. Résumé simple à présenter

> Les données arrivent dans Snowflake dans une couche RAW. Nous avons connecté dbt à Snowflake et créé une couche STAGING composée de quatre vues : climat, Kafka agriculture, MongoDB agriculture et PostgreSQL agriculture. Le staging enlève les métadonnées techniques, extrait le JSON de Kafka, harmonise les types et normalise certaines valeurs comme `systeme_production`. Les NULL sont conservés lorsqu'ils représentent une absence réelle de donnée. Les quatre modèles passent actuellement avec succès dans dbt.

---

# 27. Prochaine étape

La prochaine étape est le **diagnostic détaillé des incohérences** entre PostgreSQL, MongoDB et Kafka, puis l'application uniquement des règles de nettoyage réellement nécessaires.

Ordre retenu :

```text
RAW
 ↓
STAGING ✅
 ↓
Diagnostic qualité
 ↓
Nettoyage / harmonisation complémentaire
 ↓
INTERMEDIATE
 ↓
MARTS
```

Cette progression permet de ne pas mélanger ingestion, nettoyage, logique métier et modélisation analytique.
