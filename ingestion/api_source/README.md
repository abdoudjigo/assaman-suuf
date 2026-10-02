# Source 1 : API GalsenAPI (observations climatiques)

Documentation technique de l'ingestion **API → Airbyte → Snowflake** du projet DataFlow360 (Assaman & Suuf).

## 1. Rôle dans l'architecture

Cette partie alimente la couche brute (`RAW`) de Snowflake avec les observations climatiques du Sénégal. Les données sont ensuite transformées par dbt (staging, nettoyage, harmonisation, modèles analytiques).

```
API GalsenAPI  →  Airbyte (Connector Builder)  →  Snowflake (DATAFLOW360.RAW)  →  dbt
   (REST/JSON)        mode batch, ELT                  entrepôt de données
```

Mode de traitement : **batch** (les données climatiques sont historiques et mensuelles, aucun besoin de temps réel).

## 2. La source

| Élément | Valeur |
|---|---|
| URL | `https://galsenapi.lassanasiby.com/api/v1/climat/observations/` |
| Documentation | `https://galsenapi.lassanasiby.com/docs/` |
| Authentification | aucune (API publique) |
| Format | JSON paginé (`count`, `next`, `previous`, `results`) |
| Taille de page maximale | **200** (une demande de `page_size=1000` renvoie quand même 200 lignes) |
| Volume total (sans filtre) | 9 027 lignes |
| Volume avec nos filtres | 6 566 lignes (`annee_min=1960`, `annee_max=2015`) |

Champs d'une observation : `id`, `station`, `station_nom`, `annee`, `mois`, `tavg`, `tmin`, `tmax`, `prcp_mm`, `nb_jours`. La clé primaire est `id`.

## 3. Le connecteur Airbyte

Le connecteur est construit avec le **Connector Builder** d'Airbyte. Sa définition est versionnée dans ce dossier : [`api_connector.yaml`](./api_connector.yaml).

Points de configuration :

- **Stream** : `observations_climatique`, extraction du tableau `results` de la réponse.
- **Paramètres de requête** : `annee_min=1960` et `annee_max=2015`.
- **Pagination** : par curseur (`CursorPagination`), avec `page_size: 200`. L'adresse de la page suivante est lue dans `response['next']`, injectée dans la requête suivante (`page_token_option: RequestPath`), et la pagination s'arrête quand `next` est vide.
- **Schéma** : types déclarés explicitement (nombres pour `id`, `annee`, `mois`, `nb_jours` ; texte pour les températures et les précipitations, qui arrivent sous forme de chaînes).

## 4. La destination Snowflake

| Paramètre | Valeur |
|---|---|
| Base de données | `DATAFLOW360` |
| Schéma | `RAW` |
| Warehouse | `DATAFLOW360_WH` |
| Rôle | `API_INGESTION_ROLE` |
| Utilisateur | `api_ingestion_user` |
| Authentification | paire de clés RSA (la clé privée n'est **jamais** versionnée) |

Airbyte utilise aussi un schéma technique `AIRBYTE_INTERNAL` pour les tables temporaires et les stages de chargement.

## 5. La connexion

- Source : `Galsen-api` (connecteur personnalisé) → Destination : `Snowflake`.
- Mode : **Replicate Source**, avec `Full refresh | Overwrite + Deduped` sur la clé `id`. Chaque synchronisation recharge l'ensemble des données et supprime les doublons.
- Planification : manuelle pour l'instant ; l'orchestration est prévue avec Airflow.

## 6. Environnement et installation

Environnement utilisé : Windows, Git Bash, Docker (version 29.2.1).

| Composant | Version |
|---|---|
| `abctl` | v0.30.4 |
| Airbyte (chart Helm) | 2.3.0 |
| Moteur de connecteurs déclaratifs | `airbyte/source-declarative-manifest:7.28.2` |
| Destination Snowflake | `airbyte/destination-snowflake:5.0.1` |

Installation :

```bash
abctl local install          # Airbyte accessible sur http://localhost:8000
abctl local credentials      # affiche le mot de passe
abctl local credentials --password '<nouveau_mot_de_passe>'   # pour le changer
```

> Sous Windows, le script `curl -LsfS https://get.airbyte.com | bash -` ne fonctionne pas dans Git Bash (« Unknown system »). Pour mettre à jour `abctl`, télécharger la version Windows sur la page des releases du dépôt `airbytehq/abctl`.

## 7. Reproduire la mise en place

1. Installer Airbyte (section 6) et ouvrir `http://localhost:8000`.
2. **Builder** → importer ou recopier `api_connector.yaml` (onglet YAML), tester le stream, puis **Publish**.
3. **Sources** → créer une source à partir du connecteur personnalisé.
4. **Destinations** → créer la destination Snowflake (paramètres de la section 4, clé privée RSA fournie par l'administrateur Snowflake).
5. **Connections** → relier la source à la destination, choisir le mode de la section 5, puis **Sync now**.
6. Vérifier le résultat (section 8).

## 8. Vérification des données

Dans Snowflake :

```sql
USE DATABASE DATAFLOW360;
SHOW TABLES IN SCHEMA RAW;

SELECT COUNT(*) AS total, COUNT(DISTINCT ID) AS ids_distincts
FROM DATAFLOW360.RAW.OBSERVATIONS_CLIMATIQUE;

SELECT * FROM DATAFLOW360.RAW.OBSERVATIONS_CLIMATIQUE LIMIT 10;
```

Résultat attendu : environ **6 566** lignes, avec `total = ids_distincts`. Résultat obtenu : `6566`.

Les colonnes techniques `_AIRBYTE_RAW_ID`, `_AIRBYTE_EXTRACTED_AT`, `_AIRBYTE_META` s'ajoutent aux colonnes de l'API. Les tables `RAW_*` préparées en amont par l'équipe sont distinctes de la table créée par Airbyte : à clarifier avec l'équipe avant la modélisation dbt.

## 9. Problèmes rencontrés et solutions

### 9.1 Publication du connecteur impossible

- **Symptôme** : `errors.http.internalServerError` au clic sur Publish, alors que le test du stream passait (HTTP 200).
- **Cause** : le journal du serveur indique `No declarative manifest image version found in database for major version 7`. La table `declarative_manifest_image_version` s'arrêtait à la version majeure 4, alors que le Builder produit un connecteur de version majeure 7. Le bootloader ne l'a pas complétée, même après une mise à jour Helm.
- **Contournement appliqué** : ajout manuel de la ligne manquante, avec l'empreinte de l'image vérifiée au préalable via `docker pull` / `docker inspect`.

```sql
INSERT INTO declarative_manifest_image_version (major_version, image_version, image_sha)
VALUES (7, '7.28.2', 'sha256:f30cf2745046c06dd1e903742d835d13faea085354690679d06cab083d5a63c7');
```

Image importée dans le cluster, puis redémarrage du serveur :

```bash
docker pull airbyte/source-declarative-manifest:7.28.2
docker save airbyte/source-declarative-manifest:7.28.2 | docker exec -i airbyte-abctl-control-plane ctr -n k8s.io images import -
kubectl --kubeconfig ~/.airbyte/abctl/abctl.kubeconfig -n airbyte-abctl rollout restart deploy/airbyte-abctl-server
```

> Ce contournement modifie directement la base d'Airbyte : il ne doit servir que tant que le catalogue officiel n'est pas à jour. L'empreinte doit toujours être vérifiée avant insertion.

### 9.2 Pagination en boucle

- **Symptôme** : le compteur restait bloqué à 12 000 lignes lues, alors que l'API n'en contient que 9 027.
- **Cause** : le paramètre `page_token_option` manquait. Airbyte lisait l'adresse de la page suivante mais redemandait toujours la première page (60 requêtes de 200 lignes = 12 000).
- **Solution** : ajout de `page_token_option: type: RequestPath` dans le paginateur.

### 9.3 Erreur HTTP 429 (« Too many requests »)

- **Symptôme** : après 60 requêtes, l'API répondait 429. Airbyte réessayait puis relançait toute la synchronisation (10 tentatives), ce qui multipliait les tables temporaires et les stages dans `AIRBYTE_INTERNAL`.
- **Cause la plus probable** : conséquence de la pagination en boucle (9.2). Après la correction, la synchronisation s'est terminée avec succès.
- **Protection possible** : une attente d'environ 60 secondes sur les réponses 429, via le gestionnaire d'erreurs du Builder.

### 9.4 Nettoyage des objets temporaires

Les tentatives échouées ont laissé des stages et des tables temporaires. À supprimer, avec un rôle autorisé, après vérification des noms :

```sql
SHOW STAGES IN SCHEMA DATAFLOW360.AIRBYTE_INTERNAL;
SHOW TABLES IN SCHEMA DATAFLOW360.AIRBYTE_INTERNAL;
```

## 10. Sécurité : ce qu'il ne faut jamais versionner

La clé privée RSA (`.p8`) et son mot de passe, le mot de passe d'Airbyte, le fichier `abctl.kubeconfig` et tout identifiant Snowflake réel. Utiliser `.env.example` pour indiquer les variables à renseigner, et vérifier le `.gitignore` avant chaque `git add`.

## 11. Limites et suite

- Le mode `Overwrite + Deduped` recharge toutes les données à chaque synchronisation. C'est adapté à ce volume (quelques milliers de lignes), pas à une très grande source.
- Les filtres sont fixés dans le connecteur (`1960` à `2015`). Les observations plus récentes ne sont pas ingérées tant que ces bornes ne changent pas.
- L'API a une limite de débit : à surveiller si le volume augmente.
- Suite prévue : transformations dbt (staging, nettoyage, harmonisation), orchestration Airflow, intégration avec les autres sources.
