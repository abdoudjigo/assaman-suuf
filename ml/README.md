# DataFlow360 — Simulation du rendement agricole

Un outil pour **anticiper** le rendement d'une culture au Sénégal. Une ONG ou le ministère décrit une campagne (culture, région, superficie, année, et si elle le souhaite la pluie attendue), et le modèle répond :

> « Du mil à Kaolack sur 1 000 ha en 2027, avec une pluie normale (498 mm) : environ **0,74 t/ha**, soit **740 t**. Avec une année sèche (250 mm) : **0,72 t/ha**. »

Rapports détaillés :

- [rapports/US08_preparation_donnees.pdf](rapports/US08_preparation_donnees.pdf) : préparation des données
- [rapports/US09_developpement_modele.pdf](rapports/US09_developpement_modele.pdf) : développement et évaluation du modèle

---

## 1. Le principe en une image

```text
                         ENTRAÎNEMENT (une fois)
Snowflake ML.ML_RENDEMENT_CAMPAGNE ─► export ─► préparation ─► Lasso ─► modele_rendement.pkl
          (dbt, 9 894 campagnes)                (7 697 gardées)

                         SIMULATION (à chaque demande)
Dashboard ─► API  POST /api/v1/predictions/simulation
             │  culture, région, superficie, année  (+ pluie et température, facultatives)
             │
             │  climat de la campagne :
             │    1. la pluie saisie par l'utilisateur          (scénario « et si… »)
             │    2. sinon le climat observé dans Snowflake      (relevés GalsenAPI)
             │    3. sinon la normale de la région               (« année normale »)
             ▼
          Lasso ─► rendement (t/ha) + production (t) + repères
```

Le modèle n'utilise **que des informations qu'un utilisateur peut fournir**. Il ne dépend ni du rendement de l'année précédente (inconnu après 2015) ni de variables techniques calculées par dbt.

---

## 2. Lancer

Depuis la racine du projet :

```bash
pip install -r ml/requirements.txt

python -m ml.scripts.export_dataset   # 1. Snowflake → data/processed/ml_rendement_campagne_AAAAMMJJ.parquet
python -m ml.scripts.entrainement     # 2. → ml/models/modele_rendement.pkl + ml/models/metriques.json

uvicorn api.main:app --reload         # 3. API sur http://localhost:8000/docs
```

Les identifiants Snowflake sont lus dans `.env` (`SNOWFLAKE_USER`, `SNOWFLAKE_PASSWORD`, `SNOWFLAKE_ACCOUNT`).

---

## 3. Les variables

Le modèle reçoit 8 variables, toutes connues de l'utilisateur ou déduites de sa saisie :

| Variable | Type | D'où vient-elle en simulation ? |
| --- | --- | --- |
| `produit` | catégorie | saisie (10 cultures) |
| `region` | catégorie | saisie (14 régions) |
| `saison` | catégorie | saisie, `Principale` par défaut |
| `systeme_production` | catégorie | saisie, `Pluvial` par défaut |
| `superficie_ha` | nombre | saisie |
| `annee` | nombre | saisie |
| `pluie_cumul_mm` | nombre | saisie, sinon observée, sinon normale de la région |
| `tavg_moyenne` | nombre | saisie, sinon observée, sinon normale de la région |

**Cible** : `cible_rendement_t_ha`, le rendement de la campagne en tonnes par hectare.

La saison fixe les mois de la campagne : **Principale = juin → novembre**, **Contre-saison = février → juillet**. La pluie est le cumul de ces mois et la température leur moyenne.

---

## 4. La préparation des données ([donnees.py](scripts/donnees.py))

Trois règles, dans cet ordre :

1. **`systeme_production` vide → `Pluvial`**, le cas par défaut au Sénégal.
2. **Région sans station → climat de la région voisine.** Fatick et Kaffrine prennent le climat de Kaolack, Sedhiou celui de Kolda. Cette règle s'applique aussi en simulation.
3. **Les campagnes sans pluie connue sont écartées** (2 197 sur 9 894), au lieu d'inventer leur climat.

Les températures manquantes (aucune mesure avant 1973) sont remplacées par la médiane d'entraînement, à l'intérieur du modèle.

| Jeu | Années | Campagnes |
| --- | --- | --- |
| train | 1960–2010 | 6 456 |
| test | 2011–2015 | 1 241 |

Le découpage est **temporel** et fait par dbt (colonne `jeu`). Le test sert seulement à mesurer, jamais à choisir.

---

## 5. Le modèle ([entrainement.py](scripts/entrainement.py))

- **Trois modèles linéaires comparés** : régression linéaire, **Ridge** et **Lasso**.
- **Variables ajoutées** : un modèle linéaire donne le même effet à la pluie et à l'année pour toutes les cultures. On ajoute donc le couple **région × culture** (niveau habituel de rendement), et **pluie × culture** et **année × culture** (une pente par culture). Les catégories sont encodées en one-hot, les nombres standardisés.
- **Choix du modèle et de alpha** : chaque candidat apprend sur 1960-2005 et est jugé sur 2006-2010. On retient la plus petite erreur (MAE), soit **Lasso avec alpha = 0,001**.

| Candidat (validation 2006-2010) | MAE (t/ha) |
| --- | --- |
| Régression linéaire | 0,750 |
| Ridge (meilleur alpha = 1) | 0,614 |
| **Lasso (alpha = 0,001)** | **0,578** |

- **Modèle de production** : mêmes réglages, réentraîné sur toutes les années (1960-2015).

Sans les interactions par culture, aucun des trois modèles ne bat la baseline (MAE test ≈ 0,67).

---

## 6. Résultats (test 2011-2015)

| | MAE (t/ha) | RMSE | R² |
| --- | --- | --- | --- |
| Baseline : moyenne région × culture | 0,634 | 1,477 | 0,609 |
| **Lasso (alpha = 0,001)** | **0,608** | **1,387** | **0,655** |

- **Le modèle bat la baseline** : MAE −4 %, RMSE −6 %.
- **Cohérence avec la pluie** : pour 80 % des couples culture pluviale × région, passer de 300 à 600 mm ne baisse pas le rendement prédit.
- Les grosses erreurs viennent du manioc et de la patate douce, aux rendements élevés et très variables.

Détail par culture et par origine du climat : `ml/models/metriques.json`.

---

## 7. L'API ([api/](../api/))

### `GET /api/v1/predictions/simulation/options`

Listes des valeurs acceptées, pour remplir les listes déroulantes du dashboard.

### `POST /api/v1/predictions/simulation`

```json
{
  "produit": "Mil",
  "region": "Kaolack",
  "superficie_ha": 1000,
  "annee": 2027,
  "saison": "Principale",
  "systeme_production": "Pluvial",
  "pluie_cumul_mm": null,
  "tavg_moyenne": null
}
```

Réponse :

```json
{
  "rendement_t_ha": 0.74,
  "production_t": 740.3,
  "climat": {
    "source": "normale_region",
    "pluie_cumul_mm": 498.1,
    "tavg_moyenne": 29.03,
    "pluie_normale_mm": 498.1,
    "station_utilisee": "Kaolack"
  },
  "reperes": {
    "rendement_moyen_historique_t_ha": 0.737,
    "erreur_moyenne_test_t_ha": 0.159
  },
  "modele_version": "20261008_004640"
}
```

- `climat.source` indique d'où vient le climat utilisé : `saisie_utilisateur`, `observe` ou `normale_region`.
- `reperes` sert à situer la prédiction : le rendement moyen historique, et l'erreur moyenne du modèle pour cette culture.
- Une valeur inconnue (ex. `"Mais"` au lieu de `"Maïs"`) renvoie une erreur 422 qui liste les valeurs possibles.

---

## 8. D'où vient le climat observé

Le climat vient de **GalsenAPI** (`/api/v1/climat/observations/`). Airbyte le charge dans Snowflake (`RAW_AIRBYTE_CLIMAT`), puis dbt le transforme (`FCT_CLIMAT`). L'API lit `FCT_CLIMAT` avec le même calcul que l'entraînement : moyenne des stations de la région mois par mois, puis somme des pluies sur les mois de la saison. C'est la même source et le même calcul que pour l'entraînement, donc pas d'écart entre les deux.

Si un mois de la campagne n'est pas encore mesuré (campagne en cours ou future), l'API utilise la normale de la région.

> **Pourquoi pas OpenWeather ?** Le modèle a appris sur les relevés des stations, cumulés sur six mois. OpenWeather donne la météo actuelle et quelques jours de prévision, en général calculées par des modèles météo et non relevées aux stations. Pour l'utiliser, il faudrait reconstituer six mois de pluie et corriger l'écart avec les stations ; les mois futurs resteraient de toute façon inconnus. GalsenAPI fournit déjà ces relevés, au bon format.

---

## 9. Structure du dossier

```text
ml/
├── README.md
├── requirements.txt
├── rapports/          US08 et US09 (PDF)
├── models/            modele_rendement.pkl (non versionné) et metriques.json
├── notebooks/
│   ├── 01_exploration.ipynb         les données du modèle
│   └── 02_modele_simulation.ipynb   résultats et exemples de scénarios
└── scripts/
    ├── config.py              colonnes, chemins, règles métier
    ├── connexion_snowflake.py
    ├── export_dataset.py      Snowflake → data/processed/ (export daté)
    ├── donnees.py             préparation du dataset
    ├── entrainement.py        entraînement, évaluation, sauvegarde
    └── simulation.py          simuler() et lecture du climat observé
api/
├── main.py
├── routers/simulation.py
└── schemas/simulation.py
```

---

## 10. Tests

```bash
pytest tests/test_ml tests/test_api
```

Ils tournent sans Snowflake, sur des données synthétiques. Ils vérifient la règle de la région voisine, l'absence de fuite du jeu de test, l'ordre de priorité du climat, le refus des saisies invalides, et le fait que plus de pluie donne un meilleur rendement.

---

## 11. Limites à connaître

- **Le maïs et le sésame** sont moins bien prédits que par la baseline. Le gain est net pour le manioc et le riz, léger pour le fonio, le niébé et le sorgho ; l'arachide et le mil sont au niveau de la baseline.
- **La patate douce** n'a que 5 campagnes en test : ses prédictions ne sont pas fiables (erreur moyenne de 9 t/ha).
- **L'effet de la pluie est une droite** par culture : il ne représente ni la sécheresse qui fait chuter le rendement, ni le plafond en année très pluvieuse. Il est aussi plus faible que dans la réalité (mil à Kaolack en 2027 : 0,72 t/ha à 250 mm, 0,76 t/ha à 800 mm).
- **Les années futures** prolongent la tendance de chaque culture observée jusqu'en 2015 : plus l'année est lointaine, moins la prédiction est sûre.
- **La contre-saison** n'a de données historiques qu'à Saint-Louis : ailleurs, la simulation la refuse.
- **Le climat observé** n'est disponible que jusqu'à la dernière synchronisation Airbyte.
