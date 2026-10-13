# Dashboard DataFlow360

Application React de suivi agricole et climatique au Sénégal. Le dashboard
propose une vue stratégique pour les ministères et une vue opérationnelle pour
les ONG.

## Prérequis

- Node.js 20 ou une version plus récente compatible avec Vite 8
- npm
- Pour le déploiement conteneurisé : Docker

## Installation et démarrage local

Depuis le dossier `dashboard/` :

```bash
npm ci
npm run dev
```

Vite affiche l'adresse locale à ouvrir dans le navigateur. Pour générer et
prévisualiser la version de production :

```bash
npm run build
npm run preview
```

Les tests unitaires des calculs d'anomalies se lancent avec :

```bash
npm test
```

## Source des données

La configuration utilise les données locales par défaut :

- `VITE_UTILISER_API=false` charge `public/donnees.json`.
- `VITE_UTILISER_API=true` charge toutes les pages de
  `GET /api/v1/agroclimat?page=N&page_size=200`.
- `VITE_API_URL` définit l'adresse de base de l'API ; sa valeur par défaut est
  `http://localhost:8001`.

Pour activer l'API en développement, créer `dashboard/.env.local` :

```env
VITE_UTILISER_API=true
VITE_API_URL=http://localhost:8001
```

Les variables `VITE_*` sont intégrées lors de la compilation. Après leur
modification, redémarrer Vite ou reconstruire l'image Docker. En mode API, le
navigateur doit pouvoir joindre l'adresse configurée et l'API doit autoriser
l'origine du dashboard.

## Image Docker

La première étape du Dockerfile construit l'application avec Node.js 20 et
`npm ci`. La seconde sert les fichiers statiques avec Nginx sur le port 80.
Les valeurs API peuvent être passées au moment de la construction :

```bash
docker build \
  --build-arg VITE_API_URL=http://localhost:8001 \
  --build-arg VITE_UTILISER_API=true \
  -t dataflow360-dashboard .
docker run --rm -p 5500:80 dataflow360-dashboard
```

Ouvrir ensuite `http://localhost:5500`. Pour un accès depuis un autre poste,
remplacer `VITE_API_URL` par une adresse d'API joignable depuis le navigateur
des utilisateurs, puis reconstruire l'image.

## Dépendances principales

- React et React DOM : interface en composants et hooks.
- Chart.js et `react-chartjs-2` : visualisations interactives.
- Vite et son plugin React : serveur de développement et compilation.

Le projet n'utilise pas de bibliothèque de composants UI supplémentaire.

## Sources cartographiques

Les limites ADM1 des 14 régions proviennent de
[geoBoundaries pour le Sénégal](https://www.geoboundaries.org/api/current/gbOpen/SEN/ADM1/)
(source indiquée : Government of Senegal, OCHA ROWCA ; licence CC BY 3.0 IGO).
La carte affiche uniquement les polygones régionaux sur un fond uni ; elle
attribue les frontières à geoBoundaries directement sur la carte.

## Anomalies agricoles et vulnérabilité

La vue Ministères calcule les anomalies agricoles à partir de l'historique de
chaque couple région-produit. Les seuils (`SEUIL_PLUIE_MM`,
`SEUIL_TEMPERATURE`, `SEUIL_ANOMALIE_AGRICOLE` et `HISTORIQUE_MINIMUM`) ainsi
que la source (`SOURCE_ANOMALIES`) sont configurables dans `src/config.js`.
Les données de qualité douteuse sont exclues par défaut ; l'interface permet
de les inclure. La source `modele` est réservée à une future API groupée et
n'est pas implémentée.
