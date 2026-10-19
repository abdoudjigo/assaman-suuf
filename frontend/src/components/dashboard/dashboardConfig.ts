import {
    Activity, AlertTriangle, BarChart3, Building2, CloudRain, Droplets, Gauge,
    Map as MapIcon, MapPinned, Mountain, Satellite, Sprout, Sun, Thermometer, TrendingUp,
    Waves, Wind,
} from "lucide-react";

export const zoneData = {
    Kaffrine: {
        rainfall: "542 mm",
        temperature: "29.4 °C",
        ndvi: "0.61",
        crop: "Arachide",
        drought: "Moyen",
        agriculture: "Favorable",
    },
    Kaolack: {
        rainfall: "615 mm",
        temperature: "28.9 °C",
        ndvi: "0.58",
        crop: "Arachide / Mil",
        drought: "Faible",
        agriculture: "Favorable",
    },
    "Saint-Louis": {
        rainfall: "287 mm",
        temperature: "30.8 °C",
        ndvi: "0.42",
        crop: "Riz / Maraîchage",
        drought: "Élevé",
        agriculture: "À surveiller",
    },
};

/*
|--------------------------------------------------------------------------
| FILTRES
|--------------------------------------------------------------------------
| Les filtres répondent à :
| "QUELLES DONNÉES veux-je analyser ?"
|
| Ils ne déterminent PAS directement ce qui est dessiné sur la carte.
|--------------------------------------------------------------------------
*/

export const defaultFilters = {
    geography: {
        region: "",
        department: "",
        commune: "",
        locality: "",
        agriculturalZone: "",
        watershed: "",
    },

    climate: {
        periodStart: "1960",
        periodEnd: "2026",
        rainfallMin: "",
        rainfallMax: "",
        temperatureMin: "",
        temperatureMax: "",
        humidity: "",
        wind: "",
        radiation: "",
        evapotranspiration: "",
    },

    agriculture: {
        crop: "",
        season: "",
        areaMin: "",
        areaMax: "",
        yieldMin: "",
        yieldMax: "",
        productionMin: "",
        productionMax: "",
        farmingType: "",
        irrigation: "",
    },

    practices: {
        fertilizerType: "",
        fertilizerDose: "",
        fertilizerApplicationPeriod: "",
        pesticide: "",
        irrigationMethod: "",
        tillage: "",
        seedVariety: "",
    },

    soil: {
        soilType: "",
        texture: "",
        ph: "",
        fertility: "",
        organicMatter: "",
        salinity: "",
        drainage: "",
    },

    water: {
        availability: "",
        groundwater: "",
        irrigation: "",
        waterStress: "",
    },

    remoteSensing: {
        index: "",
        minValue: "",
        maxValue: "",
    },

    risks: {
        selected: [],
        severity: "",
    },

    infrastructure: {
        types: [],
        status: "",
        fromYear: "",
        toYear: "",
    },

    historical: {
        yearStart: "",
        yearEnd: "",
        cropHistory: "",
        yieldHistory: "",
        climateHistory: "",
        fertilizerHistory: "",
        practiceHistory: "",
        infrastructureHistory: "",
        landUseChange: "",
    },
};

/*
|--------------------------------------------------------------------------
| COUCHES CARTOGRAPHIQUES
|--------------------------------------------------------------------------
| Les couches répondent à :
| "COMMENT représenter les données sur la carte ?"
|
| Une couche peut être :
| - une carte thématique
| - un point
| - une heatmap
| - une densité
| - un symbole proportionnel
| - un compteur
| - une limite géographique
| - une image satellite
| - etc.
|--------------------------------------------------------------------------
*/

export const layerCategories = [
    {
        id: "administrative",
        label: "Limites géographiques",
        icon: MapPinned,
        color: "text-slate-600",
        layers: [
            {
                id: "regions",
                label: "Régions",
                description: "Limites administratives régionales",
                type: "boundary",
                visualization: "polygons",
                icon: MapPinned,
            },
            {
                id: "departments",
                label: "Départements",
                description: "Limites des départements",
                type: "boundary",
                visualization: "polygons",
                icon: MapPinned,
            },
            {
                id: "communes",
                label: "Communes",
                description: "Limites communales",
                type: "boundary",
                visualization: "polygons",
                icon: MapPinned,
            },
            {
                id: "agricultural-zones",
                label: "Zones agricoles",
                description: "Découpage des principales zones agricoles",
                type: "boundary",
                visualization: "polygons",
                icon: Sprout,
            },
        ],
    },

    {
        id: "climate",
        label: "Climat",
        icon: CloudRain,
        color: "text-blue-600",
        layers: [
            {
                id: "rainfall",
                label: "Précipitations",
                description: "Carte thématique des précipitations",
                type: "thematic-map",
                visualization: "choropleth",
                icon: CloudRain,
            },
            {
                id: "temperature",
                label: "Température",
                description: "Distribution spatiale de la température",
                type: "thematic-map",
                visualization: "heatmap",
                icon: Thermometer,
            },
            {
                id: "humidity",
                label: "Humidité",
                description: "Distribution spatiale de l'humidité",
                type: "thematic-map",
                visualization: "heatmap",
                icon: Droplets,
            },
            {
                id: "wind",
                label: "Vent",
                description: "Direction et intensité du vent",
                type: "thematic-map",
                visualization: "flow",
                icon: Wind,
            },
            {
                id: "solar",
                label: "Rayonnement solaire",
                description: "Potentiel de rayonnement solaire",
                type: "thematic-map",
                visualization: "heatmap",
                icon: Sun,
            },
            {
                id: "evapotranspiration",
                label: "Évapotranspiration",
                description: "Évapotranspiration spatiale",
                type: "thematic-map",
                visualization: "choropleth",
                icon: Activity,
            },
        ],
    },

    {
        id: "agriculture",
        label: "Agriculture",
        icon: Sprout,
        color: "text-green-600",
        layers: [
            {
                id: "cultivated-zones",
                label: "Zones cultivées",
                description: "Localisation des zones agricoles cultivées",
                type: "thematic-map",
                visualization: "polygons",
                icon: Sprout,
            },
            {
                id: "crop-distribution",
                label: "Répartition des cultures",
                description: "Répartition spatiale des cultures",
                type: "thematic-map",
                visualization: "categorical-map",
                icon: Sprout,
            },
            {
                id: "yield",
                label: "Rendements",
                description: "Rendement agricole par zone",
                type: "thematic-map",
                visualization: "choropleth",
                icon: TrendingUp,
            },
            {
                id: "production",
                label: "Production agricole",
                description: "Production agricole par territoire",
                type: "thematic-map",
                visualization: "choropleth",
                icon: BarChart3,
            },
            {
                id: "irrigated-zones",
                label: "Zones irriguées",
                description: "Zones agricoles bénéficiant de l'irrigation",
                type: "thematic-map",
                visualization: "polygons",
                icon: Waves,
            },
        ],
    },

    {
        id: "soil",
        label: "Sols",
        icon: Mountain,
        color: "text-amber-700",
        layers: [
            {
                id: "soil-type",
                label: "Types de sols",
                description: "Classification spatiale des sols",
                type: "thematic-map",
                visualization: "categorical-map",
                icon: Mountain,
            },
            {
                id: "soil-fertility",
                label: "Fertilité",
                description: "Indice de fertilité des sols",
                type: "thematic-map",
                visualization: "choropleth",
                icon: Sprout,
            },
            {
                id: "soil-salinity",
                label: "Salinité",
                description: "Niveau de salinité des sols",
                type: "thematic-map",
                visualization: "heatmap",
                icon: Waves,
            },
        ],
    },

    {
        id: "water",
        label: "Eau",
        icon: Waves,
        color: "text-cyan-600",
        layers: [
            {
                id: "rivers",
                label: "Cours d'eau",
                description: "Réseau hydrographique",
                type: "point-line",
                visualization: "lines",
                icon: Waves,
            },
            {
                id: "lakes",
                label: "Lacs et retenues",
                description: "Plans et retenues d'eau",
                type: "point-polygon",
                visualization: "polygons",
                icon: Waves,
            },
            {
                id: "groundwater",
                label: "Nappes phréatiques",
                description: "Informations spatiales sur les nappes",
                type: "thematic-map",
                visualization: "choropleth",
                icon: Droplets,
            },
            {
                id: "water-availability",
                label: "Disponibilité en eau",
                description: "Indice de disponibilité de la ressource",
                type: "thematic-map",
                visualization: "choropleth",
                icon: Droplets,
            },
        ],
    },

    {
        id: "satellite",
        label: "Observation satellite",
        icon: Satellite,
        color: "text-purple-600",
        layers: [
            {
                id: "satellite-imagery",
                label: "Imagerie satellite",
                description: "Fond d'imagerie satellite",
                type: "raster",
                visualization: "imagery",
                icon: Satellite,
            },
            {
                id: "ndvi",
                label: "NDVI",
                description: "Indice de végétation NDVI",
                type: "raster",
                visualization: "raster-gradient",
                icon: Satellite,
            },
            {
                id: "evi",
                label: "EVI",
                description: "Indice de végétation amélioré",
                type: "raster",
                visualization: "raster-gradient",
                icon: Satellite,
            },
            {
                id: "ndwi",
                label: "NDWI",
                description: "Indice différentiel de l'eau",
                type: "raster",
                visualization: "raster-gradient",
                icon: Waves,
            },
            {
                id: "land-surface-temperature",
                label: "Température de surface",
                description: "Température de surface terrestre",
                type: "raster",
                visualization: "heatmap",
                icon: Thermometer,
            },
        ],
    },

    {
        id: "risks",
        label: "Risques",
        icon: AlertTriangle,
        color: "text-red-600",
        layers: [
            {
                id: "drought",
                label: "Sécheresse",
                description: "Niveau spatial du risque de sécheresse",
                type: "risk-map",
                visualization: "choropleth",
                icon: AlertTriangle,
            },
            {
                id: "flood",
                label: "Inondation",
                description: "Zones potentiellement exposées aux inondations",
                type: "risk-map",
                visualization: "polygons",
                icon: Waves,
            },
            {
                id: "heat-stress",
                label: "Stress thermique",
                description: "Zones exposées au stress thermique",
                type: "risk-map",
                visualization: "heatmap",
                icon: Thermometer,
            },
            {
                id: "phytosanitary",
                label: "Risque phytosanitaire",
                description: "Zones présentant un risque phytosanitaire",
                type: "risk-map",
                visualization: "choropleth",
                icon: Sprout,
            },
            {
                id: "water-stress",
                label: "Stress hydrique",
                description: "Niveau de stress hydrique",
                type: "risk-map",
                visualization: "choropleth",
                icon: Droplets,
            },
        ],
    },

    {
        id: "infrastructure",
        label: "Infrastructures",
        icon: Building2,
        color: "text-orange-600",
        layers: [
            {
                id: "markets",
                label: "Marchés agricoles",
                description: "Localisation des marchés",
                type: "point",
                visualization: "marker",
                icon: MapPinned,
            },
            {
                id: "storage",
                label: "Entrepôts / stockage",
                description: "Infrastructures de stockage",
                type: "point",
                visualization: "marker",
                icon: Building2,
            },
            {
                id: "processing",
                label: "Unités de transformation",
                description: "Unités de transformation agricole",
                type: "point",
                visualization: "marker",
                icon: Building2,
            },
            {
                id: "weather-stations",
                label: "Stations météorologiques",
                description: "Stations de mesure météorologique",
                type: "point",
                visualization: "marker",
                icon: CloudRain,
            },
            {
                id: "boreholes",
                label: "Forages",
                description: "Localisation des forages",
                type: "point",
                visualization: "marker",
                icon: Droplets,
            },
            {
                id: "dams",
                label: "Barrages / retenues",
                description: "Ouvrages hydrauliques",
                type: "point-polygon",
                visualization: "marker",
                icon: Waves,
            },
            {
                id: "roads",
                label: "Routes",
                description: "Réseau routier utile à la chaîne agricole",
                type: "line",
                visualization: "lines",
                icon: MapIcon,
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | SURCOUCHES DE QUANTIFICATION
    |--------------------------------------------------------------------------
    | Ces couches sont particulièrement importantes pour Assaman-Suuf.
    |
    | Elles ne montrent pas seulement "où se trouve quelque chose".
    | Elles permettent également de représenter COMBIEN d'éléments
    | correspondent aux critères actifs.
    |--------------------------------------------------------------------------
    */

    {
        id: "quantification",
        label: "Quantification spatiale",
        icon: Gauge,
        color: "text-indigo-600",
        layers: [
            {
                id: "exploitation-count",
                label: "Nombre d'exploitations",
                description:
                    "Nombre d'exploitations correspondant aux filtres actifs",
                type: "quantitative-overlay",
                visualization: "proportional-symbol",
                icon: Building2,
            },
            {
                id: "plot-count",
                label: "Nombre de parcelles",
                description: "Nombre de parcelles agricoles par zone",
                type: "quantitative-overlay",
                visualization: "proportional-symbol",
                icon: Sprout,
            },
            {
                id: "infrastructure-count",
                label: "Nombre d'infrastructures",
                description:
                    "Nombre d'infrastructures correspondant aux filtres actifs",
                type: "quantitative-overlay",
                visualization: "bubble",
                icon: Building2,
            },
            {
                id: "production-volume",
                label: "Volume de production",
                description: "Volume de production représenté spatialement",
                type: "quantitative-overlay",
                visualization: "proportional-symbol",
                icon: BarChart3,
            },
            {
                id: "cultivated-area",
                label: "Surface cultivée",
                description: "Surface agricole cultivée par zone",
                type: "quantitative-overlay",
                visualization: "proportional-symbol",
                icon: Sprout,
            },
            {
                id: "yield-indicator",
                label: "Indicateur de rendement",
                description: "Représentation quantitative du rendement",
                type: "quantitative-overlay",
                visualization: "graduated-symbol",
                icon: TrendingUp,
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | DENSITÉ / CONCENTRATION
    |--------------------------------------------------------------------------
    */

    {
        id: "density",
        label: "Densité et concentration",
        icon: Activity,
        color: "text-fuchsia-600",
        layers: [
            {
                id: "farm-density",
                label: "Densité des exploitations",
                description: "Concentration spatiale des exploitations",
                type: "density",
                visualization: "heatmap",
                icon: Sprout,
            },
            {
                id: "infrastructure-density",
                label: "Densité des infrastructures",
                description: "Concentration des infrastructures",
                type: "density",
                visualization: "heatmap",
                icon: Building2,
            },
            {
                id: "risk-density",
                label: "Concentration des risques",
                description: "Concentration spatiale des zones à risque",
                type: "density",
                visualization: "heatmap",
                icon: AlertTriangle,
            },
        ],
    },
];

/*
|--------------------------------------------------------------------------
| FONDS DE CARTE
|--------------------------------------------------------------------------
*/

export const baseMaps = [
    {
        id: "light",
        label: "Clair",
        icon: MapIcon,
    },
    {
        id: "satellite",
        label: "Satellite",
        icon: Satellite,
    },
    {
        id: "terrain",
        label: "Terrain",
        icon: Mountain,
    },
    {
        id: "dark",
        label: "Sombre",
        icon: MapIcon,
    },
];

/*
|--------------------------------------------------------------------------
| PRESETS DE COUCHES
|--------------------------------------------------------------------------
*/

export const layerPresets = [
    {
        id: "agriculture",
        label: "Agriculture",
        description: "Cultures, rendements, surfaces et eau",
        layers: [
            "cultivated-zones",
            "crop-distribution",
            "yield",
            "production",
            "irrigated-zones",
            "water-availability",
        ],
    },
    {
        id: "climate",
        label: "Climat",
        description: "Principales variables climatiques",
        layers: [
            "rainfall",
            "temperature",
            "humidity",
            "wind",
            "evapotranspiration",
        ],
    },
    {
        id: "risks",
        label: "Risques",
        description: "Sécheresse, inondation et stress",
        layers: [
            "drought",
            "flood",
            "heat-stress",
            "water-stress",
            "phytosanitary",
        ],
    },
    {
        id: "decision",
        label: "Aide à la décision",
        description: "Infrastructure, agriculture et quantification",
        layers: [
            "markets",
            "storage",
            "processing",
            "weather-stations",
            "boreholes",
            "exploitation-count",
            "infrastructure-count",
        ],
    },
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

export const flattenLayers = () =>
    layerCategories.flatMap((category) =>
        category.layers.map((layer) => ({
            ...layer,
            categoryId: category.id,
            categoryLabel: category.label,
        }))
    );

export const allLayers = flattenLayers();

export const getLayerById = (layerId: string) =>
    allLayers.find((layer) => layer.id === layerId);

/*
|--------------------------------------------------------------------------
| INITIALISATION DES COUCHES
|--------------------------------------------------------------------------
*/

export const initialActiveLayers = {
    regions: true,
    departments: false,
    communes: false,
    "agricultural-zones": false,

    rainfall: true,
    temperature: false,
    humidity: false,
    wind: false,
    solar: false,
    evapotranspiration: false,

    "cultivated-zones": true,
    "crop-distribution": false,
    yield: false,
    production: false,
    "irrigated-zones": false,

    "soil-type": false,
    "soil-fertility": false,
    "soil-salinity": false,

    rivers: false,
    lakes: false,
    groundwater: false,
    "water-availability": false,

    "satellite-imagery": false,
    ndvi: false,
    evi: false,
    ndwi: false,
    "land-surface-temperature": false,

    drought: false,
    flood: false,
    "heat-stress": false,
    phytosanitary: false,
    "water-stress": false,

    markets: false,
    storage: false,
    processing: false,
    "weather-stations": false,
    boreholes: false,
    dams: false,
    roads: false,

    "exploitation-count": false,
    "plot-count": false,
    "infrastructure-count": false,
    "production-volume": false,
    "cultivated-area": false,
    "yield-indicator": false,

    "farm-density": false,
    "infrastructure-density": false,
    "risk-density": false,
};

export const initialLayerSettings = Object.fromEntries(
    allLayers.map((layer) => [
        layer.id,
        {
            opacity: 75,
            visible: true,
            style: layer.visualization,
        },
    ])
);

