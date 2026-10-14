# Assaman-Suuf — Frontend

Application React de la plateforme agroclimatique **DataFlow360** : cartographie, dashboard agroclimatique, prédiction du rendement et supervision de l'API FastAPI.

---

## 1. Stack

| Besoin | Outil |
| --- | --- |
| Framework | React 19 + TypeScript, Vite |
| Routage | React Router 7 |
| Données serveur & cache | TanStack Query (react-query) + axios |
| Graphiques | Recharts |
| Cartographie | Leaflet |
| Styles | Tailwind CSS 4, icônes lucide-react |

Aucune autre dépendance : réutiliser celles-ci avant d'en ajouter une.

---

## 2. Lancer

Prérequis : Node 22, et l'API FastAPI démarrée (voir [api/README.md](../api/README.md), port **8001**).

```bash
cd frontend
cp .env.example .env     # puis ajuster si besoin
npm install
npm run dev              # http://localhost:5173
```

| Variable | Rôle |
| --- | --- |
| `VITE_API_BASE_URL` | URL de base de l'API, ex. `http://localhost:8001`. Vide : même origine que le frontend ; en dev, le proxy Vite redirige `/api` vers `127.0.0.1:8001` ([vite.config.ts](vite.config.ts)). |

Autres commandes :

```bash
npm run lint      # ESLint
npm run build     # tsc -b puis build Vite dans dist/
npm run preview   # sert dist/
```

---

## 3. Pages

Le menu commun ([AppNav.tsx](src/components/layout/AppNav.tsx)) relie les pages principales.

| Route | Page | Données |
| --- | --- | --- |
| `/` | Accueil : carte + supervision API | — |
| `/dashboard` | [Dashboard.tsx](src/pages/Dashboard.tsx) — agroclimat | `/api/v1/agroclimat/agregats`, `/agroclimat/nuage`, `/climat/annuel`, `/zones`, `/produits` |
| `/prediction` | [Prediction.tsx](src/pages/Prediction.tsx) — rendement & prédiction | `/api/v1/predictions/simulation/options`, `/predictions/simulation`, `/agroclimat/agregats` |
| `/cartographie` | [DashboardMap.tsx](src/pages/DashboardMap.tsx) — carte Leaflet | données de démonstration |
| `/supervision` | [DashboardApiRun.tsx](src/pages/DashboardApiRun.tsx) — console de l'API | toutes les routes |

### Dashboard (`/dashboard`)

- **Filtres** : année, région, catégorie, culture, système de production.
- **KPI** : production (t), superficie (ha), rendement (t/ha), évolution de la production par rapport à N-1, couverture climatique.
- **Graphiques** : production et rendement par année ; production et rendement par culture ; classement des régions ; pluie et température par année ; nuage pluie cumulée × rendement par culture.

### Prédiction (`/prediction`)

- **Formulaire** : culture, région, superficie (> 0), année, saison, système de production. Pluie et température sont facultatives (scénario « et si… »).
- **Résultat** : rendement, production, climat utilisé avec sa source, pluie normale, repères et version du modèle.
- **Avertissements** affichés en évidence. Une erreur 422 (ex. contre-saison hors Saint-Louis) affiche le message de l'API.
- **Courbe de scénarios** : rendement prédit pour une pluie de 200 à 1 000 mm, par pas de 50 mm (17 appels). Seule la pluie varie, la température reste celle de la simulation.
- **Rendement observé** : rendements réels par année pour la région × culture, comparés à la prédiction et à la moyenne historique.

---

## 4. Règles métier (à respecter dans tout nouvel écran)

- **Rendement = Σ production / Σ superficie**, jamais une moyenne de rendements. Le calcul est fait côté API (Snowflake), sur les campagnes ayant les deux valeurs.
- **null ≠ 0** : une valeur manquante est ignorée et affichée « — », jamais remplacée par 0. Les courbes laissent un trou (`connectNulls={false}`).
- **Couverture climatique** : seules ~59 % des campagnes ont des données climat. Elle est affichée à côté de toute analyse pluie × rendement.
- **Pas de causalité** : un nuage de points pluie × rendement montre une association, et la page le précise.
- **Pas de graphique à deux axes Y** : deux mesures d'unités différentes vont dans deux graphiques.

---

## 5. Structure

```text
src/
├── main.tsx                     QueryClientProvider (react-query) + App
├── routes/AppRoutes.tsx         routes
├── pages/                       une page par route (+ composants historiques de la carte)
├── components/
│   ├── layout/
│   │   ├── AppNav.tsx           menu principal
│   │   └── PageHeader.tsx       en-tête commun (identité, menu, actions)
│   └── dashboard/
│       └── DashboardBlocks.tsx  ChartCard (états chargement/erreur/vide), KpiCard,
│                                FilterBar, FilterSelect, NumberField
├── hooks/
│   ├── useDashboardData.ts      agrégats, nuage, climat annuel, zones, produits
│   └── usePrediction.ts         options, simulation, courbe de scénarios
├── services/
│   ├── dashboardApi.ts          client axios des routes du Dashboard
│   └── prediction/
│       └── predictionClient.ts  client des routes de simulation (erreurs → PredictionError)
├── types/prediction.ts          types des requêtes/réponses de simulation
└── utils/agroAggregates.ts      filtres, variation %, formatage fr-FR
```

### Conventions

- **Appels API** : toujours via un hook react-query (`hooks/`) qui s'appuie sur un service (`services/`), jamais `fetch` dans un composant.
- **Cache** : 1 h par combinaison de filtres. Pendant un changement de filtre, l'ancien résultat reste affiché, grisé.
- **États** : chaque bloc gère ses propres états chargement, erreur (avec « Réessayer ») et vide, via `ChartCard` / `KpiCard`.
- **Textes et formats** : en français ; nombres formatés avec `fmt` (fr-FR).
- **Styles** : `index.css` impose `button, input, select { font: inherit }` en dehors des couches Tailwind, ce qui annule `text-xs`/`text-sm` posés sur ces éléments. Mettre la taille sur un parent ou sur un `<span>` à l'intérieur.

---

## 6. Points connus

- **Build de production** : `npm run build` échoue tant que [MapLibreView.tsx](src/components/maps/MapLibreView.tsx) contient une erreur de syntaxe (fichier antérieur, non utilisé). Le `Dockerfile` de production est donc bloqué ; `npx vite build` fonctionne.
- **Docker de dev** : [docker-compose.yaml](docker-compose.yaml) définit `VITE_API_URL`, alors que le code lit `VITE_API_BASE_URL`.
- **Lint** : `npm run lint` remonte des erreurs dans des fichiers antérieurs (`AgroMap.tsx`, `useZoneData.ts`, …). Les fichiers du Dashboard et de la Prédiction sont propres.
- **Cartographie** : les indicateurs de la carte sont encore des données de démonstration.
