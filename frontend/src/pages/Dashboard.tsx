import { useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Bell,
    Building2,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CloudRain,
    Droplets,
    Eye,
    EyeOff,
    Filter,
    Gauge,
    Layers,
    LocateFixed,
    Map as MapIcon,
    MapPinned,
    Minus,
    Mountain,
    MoveDown,
    MoveUp,
    Plus,
    Search,
    Settings,
    Satellite,
    SlidersHorizontal,
    Sprout,
    Sun,
    Thermometer,
    TrendingUp,
    UserRound,
    Waves,
    Wind,
    X,
} from "lucide-react";

import BottomNavigation from "./BottomNavigation.tsx"
import MapControls from "./MapControls.tsx"
import DashboardHeader from "./DashboardHeader.tsx";
import PanelShell from "./PanelShell.tsx";
import FilterPanel from "./FilterPanel.tsx";
import LogControlOptions from "./LogControlOptions.tsx";
import {SectionTitle,FilterSection,InputField,SelectField,CheckOption} from "./ComposantField.tsx"

/*
|--------------------------------------------------------------------------
| DONNÉES DE DÉMONSTRATION
|--------------------------------------------------------------------------
| Les valeurs affichées sur la carte sont uniquement des exemples UI.
| Elles devront être remplacées par les données provenant de l'API
| FastAPI / PostgreSQL / PostGIS / services raster ou autres sources GIS.
|--------------------------------------------------------------------------
*/

const zoneData = {
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

const defaultFilters = {
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

const layerCategories = [
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

const baseMaps = [
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

const layerPresets = [
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

const flattenLayers = () =>
    layerCategories.flatMap((category) =>
        category.layers.map((layer) => ({
            ...layer,
            categoryId: category.id,
            categoryLabel: category.label,
        }))
    );

const allLayers = flattenLayers();

const getLayerById = (layerId) =>
    allLayers.find((layer) => layer.id === layerId);

/*
|--------------------------------------------------------------------------
| INITIALISATION DES COUCHES
|--------------------------------------------------------------------------
*/

const initialActiveLayers = {
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

const initialLayerSettings = Object.fromEntries(
    allLayers.map((layer) => [
        layer.id,
        {
            opacity: 75,
            visible: true,
            style: layer.visualization,
        },
    ])
);


/*
|--------------------------------------------------------------------------
| APERÇU DES COUCHES SUR LA CARTE
|--------------------------------------------------------------------------
| Ceci montre visuellement le concept de superposition.
| Dans la vraie application, MapLibre GL JS / Leaflet rendra réellement
| les données GIS.
|--------------------------------------------------------------------------
*/

function ActiveLayerStack({
                              activeLayerIds,
                              layerSettings,
                              onRemove,
                          }) {
    if (activeLayerIds.length === 0) {
        return null;
    }

    return (
        <div className="absolute bottom-24 left-4 z-20 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-900">
                        Couches actives
                    </p>
                    <p className="text-[10px] text-slate-500">
                        {activeLayerIds.length} surcouche
                        {activeLayerIds.length > 1 ? "s" : ""}
                    </p>
                </div>

                <Layers size={16} className="text-slate-400" />
            </div>

            <div className="space-y-1.5">
                {activeLayerIds.slice(0, 5).map((layerId) => {
                    const layer = getLayerById(layerId);

                    if (!layer) return null;

                    return (
                        <div
                            key={layer.id}
                            className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
                                <layer.icon size={14} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[11px] font-medium text-slate-800">
                                    {layer.label}
                                </p>

                                <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-green-500"
                                        style={{
                                            width: `${layerSettings[layer.id]?.opacity ?? 75}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => onRemove(layer.id)}
                                className="text-slate-400 hover:text-red-500"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {activeLayerIds.length > 5 && (
                <p className="mt-2 text-center text-[10px] text-slate-400">
                    + {activeLayerIds.length - 5} autres couches
                </p>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| MARQUEURS DE DÉMONSTRATION
|--------------------------------------------------------------------------
*/

function DemoMarkers({ onSelectZone }) {
    const markers = [
        {
            name: "Kaffrine",
            position: "left-[45%] top-[55%]",
            color: "bg-green-600",
        },
        {
            name: "Kaolack",
            position: "left-[39%] top-[65%]",
            color: "bg-blue-600",
        },
        {
            name: "Saint-Louis",
            position: "left-[38%] top-[30%]",
            color: "bg-orange-500",
        },
    ];

    return (
        <>
            {markers.map((marker) => (
                <button
                    key={marker.name}
                    onClick={() => onSelectZone(marker.name)}
                    className={`absolute ${marker.position} z-10 group`}
                >
          <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${marker.color} text-white shadow-lg ring-4 ring-white/70 transition group-hover:scale-110`}
          >
            <MapPinned size={17} />
          </span>

                    <span className="absolute left-1/2 top-11 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-md">
            {marker.name}
          </span>
                </button>
            ))}
        </>
    );
}

/*
|--------------------------------------------------------------------------
| LÉGENDE
|--------------------------------------------------------------------------
*/

function MapLegend({ activeLayerIds }) {
    const visibleLayers = activeLayerIds
        .map((id) => getLayerById(id))
        .filter(Boolean)
        .slice(0, 4);

    if (visibleLayers.length === 0) return null;

    return (
        <div className="absolute bottom-24 right-4 z-20 hidden w-56 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur-xl lg:block">
            <div className="mb-2 flex items-center gap-2">
                <Eye size={15} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-900">
          Légende cartographique
        </span>
            </div>

            <div className="space-y-2">
                {visibleLayers.map((layer) => (
                    <div key={layer.id} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-slate-300" />

                        <span className="flex-1 text-[10px] text-slate-600">
              {layer.label}
            </span>

                        <span className="text-[9px] text-slate-400">
              {layer.visualization}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| CARTE
|--------------------------------------------------------------------------
*/

function LocationMapDashboard({
                                  selectedZone,
                                  onSelectZone,
                                  zoom,
                                  setZoom,
                                  baseMap,
                                  onOpenBaseMap,
                                  activeLayerIds,
                                  layerSettings,
                                  onRemoveLayer,
                                  onLocate,
                                  onHandleUserProfile,
                                  onHandleUserSettings,
                                  onHandleUserBells,
                                  onHandleUserOthersOptions,
                              }) {
    return (
        <main className="absolute inset-0 overflow-hidden bg-slate-200">
            {/* Placeholder cartographique */}
            <div className="absolute inset-0">
                <img
                    src="/images/carte_senegal.png"
                    alt="Carte du Sénégal"
                    className={`h-full w-full object-cover ${
                        baseMap === "Sombre"
                            ? "brightness-50 grayscale"
                            : baseMap === "Satellite"
                                ? "brightness-90 saturate-125"
                                : baseMap === "Terrain"
                                    ? "sepia-[0.15]"
                                    : ""
                    }`}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-slate-900/20" />

                {/* Démonstration visuelle des couches */}
                {activeLayerIds.includes("rainfall") && (
                    <div className="pointer-events-none absolute inset-0 bg-blue-500/10" />
                )}

                {activeLayerIds.includes("temperature") && (
                    <div className="pointer-events-none absolute inset-0 bg-orange-500/10 mix-blend-multiply" />
                )}

                {activeLayerIds.includes("drought") && (
                    <div className="pointer-events-none absolute inset-0 bg-red-500/10 mix-blend-multiply" />
                )}

                {activeLayerIds.includes("ndvi") && (
                    <div className="pointer-events-none absolute inset-0 bg-green-500/10 mix-blend-multiply" />
                )}

                {activeLayerIds.includes("farm-density") && (
                    <div className="pointer-events-none absolute left-[35%] top-[45%] h-52 w-52 rounded-full bg-purple-500/20 blur-3xl" />
                )}

                {activeLayerIds.includes("infrastructure-density") && (
                    <div className="pointer-events-none absolute left-[45%] top-[55%] h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
                )}
            </div>

            <MapControls
                zoom={zoom}
                setZoom={setZoom}
                onLocate={onLocate}
                baseMap={baseMap}
                onOpenBaseMap={onOpenBaseMap}
            />

            <DemoMarkers onSelectZone={onSelectZone} />

            <ActiveLayerStack
                activeLayerIds={activeLayerIds}
                layerSettings={layerSettings}
                onRemove={onRemoveLayer}
            />

            <MapLegend activeLayerIds={activeLayerIds} />

            <LogControlOptions
                onHandleUserProfile={onHandleUserProfile}
                onHandleUserSettings={onHandleUserSettings}
                onHandleUserBells={onHandleUserBells}
                onHandleUserOthersOptions={onHandleUserOthersOptions}
            />

            {selectedZone && (
                <ZoneInformationPanel
                    zone={selectedZone}
                    onClose={() => onSelectZone(null)}
                />
            )}

            <div className="absolute bottom-24 left-1/2 z-10 hidden -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-[10px] text-slate-500 shadow-lg backdrop-blur md:block">
                Démonstration cartographique — données GIS à connecter
            </div>
        </main>
    );
}

/*
|--------------------------------------------------------------------------
| INFORMATIONS D'UNE ZONE
|--------------------------------------------------------------------------
*/

function ZoneInformationPanel({ zone, onClose }) {
    const data = zoneData[zone];

    if (!data) return null;

    return (
        <aside className="absolute bottom-24 left-4 z-30 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Zone sélectionnée
                    </p>
                    <h2 className="text-base font-bold text-slate-900">{zone}</h2>
                </div>

                <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                    <X size={17} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
                <Metric label="Précipitations" value={data.rainfall} />
                <Metric label="Température" value={data.temperature} />
                <Metric label="NDVI" value={data.ndvi} />
                <Metric label="Culture" value={data.crop} />
                <Metric label="Sécheresse" value={data.drought} />
                <Metric label="Agriculture" value={data.agriculture} />
            </div>
        </aside>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[9px] uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-800">{value}</p>
        </div>
    );
}


/*
|--------------------------------------------------------------------------
| PANNEAU COUCHES
|--------------------------------------------------------------------------
*/

function LayerPanel({
                        activeLayers,
                        setActiveLayers,
                        layerSettings,
                        setLayerSettings,
                        activeLayerOrder,
                        setActiveLayerOrder,
                        baseMap,
                        setBaseMap,
                        onClose,
                    }) {
    const [search, setSearch] = useState("");
    const [expandedCategories, setExpandedCategories] = useState(
        Object.fromEntries(
            layerCategories.map((category) => [category.id, false])
        )
    );

    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [showPresets, setShowPresets] = useState(true);

    const activeLayerIds = activeLayerOrder.filter(
        (id) => activeLayers[id]
    );

    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase();

        return layerCategories
            .map((category) => ({
                ...category,
                layers: category.layers.filter((layer) => {
                    const matchesSearch =
                        !query ||
                        layer.label.toLowerCase().includes(query) ||
                        layer.description.toLowerCase().includes(query);

                    const matchesActive =
                        !showActiveOnly || activeLayers[layer.id];

                    return matchesSearch && matchesActive;
                }),
            }))
            .filter((category) => category.layers.length > 0);
    }, [search, showActiveOnly, activeLayers]);

    const toggleCategory = (categoryId) => {
        setExpandedCategories((current) => ({
            ...current,
            [categoryId]: !current[categoryId],
        }));
    };

    const toggleLayer = (layerId) => {
        setActiveLayers((current) => ({
            ...current,
            [layerId]: !current[layerId],
        }));

        setActiveLayerOrder((current) => {
            if (activeLayers[layerId]) {
                return current.filter((id) => id !== layerId);
            }

            return [...current.filter((id) => id !== layerId), layerId];
        });
    };

    const updateLayerSetting = (layerId, key, value) => {
        setLayerSettings((current) => ({
            ...current,
            [layerId]: {
                ...current[layerId],
                [key]: value,
            },
        }));
    };

    const removeLayer = (layerId) => {
        setActiveLayers((current) => ({
            ...current,
            [layerId]: false,
        }));

        setActiveLayerOrder((current) =>
            current.filter((id) => id !== layerId)
        );
    };

    const moveLayer = (layerId, direction) => {
        setActiveLayerOrder((current) => {
            const index = current.indexOf(layerId);

            if (index === -1) return current;

            const nextIndex =
                direction === "up"
                    ? Math.max(0, index - 1)
                    : Math.min(current.length - 1, index + 1);

            if (index === nextIndex) return current;

            const next = [...current];
            [next[index], next[nextIndex]] = [
                next[nextIndex],
                next[index],
            ];

            return next;
        });
    };

    const clearAllLayers = () => {
        setActiveLayers((current) =>
            Object.fromEntries(
                Object.keys(current).map((key) => [key, false])
            )
        );

        setActiveLayerOrder([]);
    };

    const applyPreset = (preset) => {
        const presetIds = new Set(preset.layers);

        setActiveLayers((current) =>
            Object.fromEntries(
                Object.keys(current).map((key) => [
                    key,
                    presetIds.has(key),
                ])
            )
        );

        setActiveLayerOrder(preset.layers);
    };

    return (
        <PanelShell
            title="Couches cartographiques"
            subtitle="Composez la représentation de votre territoire"
            icon={Layers}
            onClose={onClose}
            width="w-[470px]"
        >
            {/* Explication */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600">
                        <Layers size={16} />
                    </div>

                    <div>
                        <p className="text-xs font-bold text-indigo-900">
                            Construisez votre vue cartographique
                        </p>

                        <p className="mt-1 text-[10px] leading-4 text-indigo-700">
                            Les couches ajoutent des cartes, repères, densités,
                            compteurs et autres représentations par-dessus le fond
                            cartographique.
                        </p>
                    </div>
                </div>
            </div>

            {/* Fond de carte */}
            <section className="mt-4">
                <SectionTitle
                    icon={MapIcon}
                    title="Fond de carte"
                />

                <div className="grid grid-cols-4 gap-2">
                    {baseMaps.map((map) => {
                        const Icon = map.icon;
                        const selected = baseMap === map.label;

                        return (
                            <button
                                key={map.id}
                                onClick={() => setBaseMap(map.label)}
                                className={`rounded-xl border p-2 transition ${
                                    selected
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                                <Icon size={17} className="mx-auto" />
                                <span className="mt-1 block text-[9px] font-medium">
                  {map.label}
                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Recherche */}
            <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Rechercher une couche..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-green-500 focus:bg-white"
                    />
                </div>

                <button
                    onClick={() => setShowActiveOnly((value) => !value)}
                    className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-semibold ${
                        showActiveOnly
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-slate-200 bg-white text-slate-500"
                    }`}
                >
                    <Check size={14} />
                    Actives
                </button>
            </div>

            {/* Presets */}
            <section className="mt-4">
                <button
                    onClick={() => setShowPresets((value) => !value)}
                    className="flex w-full items-center justify-between"
                >
                    <SectionTitle
                        icon={Gauge}
                        title="Vues prédéfinies"
                    />

                    {showPresets ? (
                        <ChevronUp size={15} />
                    ) : (
                        <ChevronDown size={15} />
                    )}
                </button>

                {showPresets && (
                    <div className="grid grid-cols-2 gap-2">
                        {layerPresets.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => applyPreset(preset)}
                                className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-green-300 hover:bg-green-50"
                            >
                                <p className="text-xs font-semibold text-slate-800">
                                    {preset.label}
                                </p>
                                <p className="mt-1 text-[9px] leading-4 text-slate-400">
                                    {preset.description}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Couches actives */}
            {activeLayerIds.length > 0 && (
                <section className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                        <SectionTitle
                            icon={Eye}
                            title={`Couches actives (${activeLayerIds.length})`}
                        />

                        <button
                            onClick={clearAllLayers}
                            className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                        >
                            Tout retirer
                        </button>
                    </div>

                    <div className="space-y-2">
                        {activeLayerIds.map((layerId, index) => {
                            const layer = getLayerById(layerId);

                            if (!layer) return null;

                            const settings = layerSettings[layerId];

                            return (
                                <div
                                    key={layerId}
                                    className="rounded-xl border border-green-100 bg-green-50/60 p-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-green-700">
                                            <layer.icon size={15} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-slate-800">
                                                {layer.label}
                                            </p>

                                            <p className="text-[9px] text-slate-400">
                                                {layer.visualization}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => removeLayer(layerId)}
                                            className="text-slate-400 hover:text-red-500"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>

                                    <div className="mt-3">
                                        <div className="mb-1 flex justify-between text-[9px] text-slate-500">
                                            <span>Opacité</span>
                                            <span>{settings.opacity}%</span>
                                        </div>

                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            value={settings.opacity}
                                            onChange={(event) =>
                                                updateLayerSetting(
                                                    layerId,
                                                    "opacity",
                                                    Number(event.target.value)
                                                )
                                            }
                                            className="w-full accent-green-600"
                                        />
                                    </div>

                                    <div className="mt-2 flex gap-1">
                                        <button
                                            onClick={() =>
                                                updateLayerSetting(
                                                    layerId,
                                                    "visible",
                                                    !settings.visible
                                                )
                                            }
                                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[9px] font-semibold text-slate-600"
                                        >
                                            {settings.visible ? (
                                                <Eye size={12} />
                                            ) : (
                                                <EyeOff size={12} />
                                            )}
                                            {settings.visible ? "Visible" : "Masquée"}
                                        </button>

                                        <button
                                            disabled={index === 0}
                                            onClick={() =>
                                                moveLayer(layerId, "up")
                                            }
                                            className="rounded-lg bg-white px-2 text-slate-500 disabled:opacity-30"
                                            title="Monter"
                                        >
                                            <MoveUp size={13} />
                                        </button>

                                        <button
                                            disabled={
                                                index === activeLayerIds.length - 1
                                            }
                                            onClick={() =>
                                                moveLayer(layerId, "down")
                                            }
                                            className="rounded-lg bg-white px-2 text-slate-500 disabled:opacity-30"
                                            title="Descendre"
                                        >
                                            <MoveDown size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Catalogue des couches */}
            <section className="mt-5">
                <SectionTitle
                    icon={Layers}
                    title="Catalogue des couches"
                />

                <div className="space-y-2">
                    {filteredCategories.map((category) => {
                        const CategoryIcon = category.icon;
                        const expanded =
                            expandedCategories[category.id];

                        const activeCount = category.layers.filter(
                            (layer) => activeLayers[layer.id]
                        ).length;

                        return (
                            <div
                                key={category.id}
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                            >
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                                        <CategoryIcon
                                            size={16}
                                            className={category.color}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-slate-800">
                                            {category.label}
                                        </p>

                                        <p className="text-[9px] text-slate-400">
                                            {category.layers.length} couches
                                            {activeCount > 0 &&
                                                ` · ${activeCount} active${
                                                    activeCount > 1 ? "s" : ""
                                                }`}
                                        </p>
                                    </div>

                                    {expanded ? (
                                        <ChevronUp size={15} />
                                    ) : (
                                        <ChevronDown size={15} />
                                    )}
                                </button>

                                {expanded && (
                                    <div className="border-t border-slate-100 p-2">
                                        {category.layers.map((layer) => {
                                            const LayerIcon = layer.icon;
                                            const active = activeLayers[layer.id];

                                            return (
                                                <button
                                                    key={layer.id}
                                                    onClick={() =>
                                                        toggleLayer(layer.id)
                                                    }
                                                    className={`mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                                                        active
                                                            ? "bg-green-50"
                                                            : "hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                                            active
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-slate-100 text-slate-500"
                                                        }`}
                                                    >
                                                        <LayerIcon size={15} />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] font-semibold text-slate-800">
                                                            {layer.label}
                                                        </p>

                                                        <p className="mt-0.5 text-[9px] leading-4 text-slate-400">
                                                            {layer.description}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                                            active
                                                                ? "border-green-600 bg-green-600 text-white"
                                                                : "border-slate-300 bg-white"
                                                        }`}
                                                    >
                                                        {active && <Check size={12} />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Légende */}
            {activeLayerIds.length > 0 && (
                <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                        <Eye size={15} className="text-slate-500" />
                        <p className="text-xs font-semibold text-slate-800">
                            Légende générée
                        </p>
                    </div>

                    <div className="mt-3 space-y-2">
                        {activeLayerIds.map((layerId) => {
                            const layer = getLayerById(layerId);

                            return (
                                <div
                                    key={layerId}
                                    className="flex items-center gap-2"
                                >
                                    <span className="h-3 w-3 rounded-sm bg-slate-300" />

                                    <span className="flex-1 text-[10px] text-slate-600">
                    {layer?.label}
                  </span>

                                    <span className="text-[9px] text-slate-400">
                    {layer?.visualization}
                  </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </PanelShell>
    );
}

/*
|--------------------------------------------------------------------------
| ANALYSE
|--------------------------------------------------------------------------
*/

function AnalysisPanel({ onClose, selectedZone }) {
    return (
        <PanelShell
            title="Analyse territoriale"
            subtitle="Analysez les relations entre climat, agriculture, eau et risques"
            icon={BarChart3}
            onClose={onClose}
        >
            <div className="space-y-3">
                <AnalysisCard
                    icon={CloudRain}
                    title="Climat"
                    description="Précipitations, température, humidité et évapotranspiration."
                />

                <AnalysisCard
                    icon={Sprout}
                    title="Agriculture"
                    description="Cultures dominantes, surfaces, rendement et production."
                />

                <AnalysisCard
                    icon={Droplets}
                    title="Ressource en eau"
                    description="Disponibilité, irrigation, nappes et stress hydrique."
                />

                <AnalysisCard
                    icon={AlertTriangle}
                    title="Risques"
                    description="Sécheresse, inondation, chaleur et risques phytosanitaires."
                />

                <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-xs font-bold text-green-900">
                        Potentiel agricole global
                    </p>

                    <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-green-700">
              78
            </span>

                        <span className="pb-1 text-xs text-green-600">
              / 100
            </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-100">
                        <div className="h-full w-[78%] rounded-full bg-green-600" />
                    </div>

                    <p className="mt-2 text-[10px] text-green-700">
                        Indicateur illustratif à remplacer par le moteur
                        d'analyse réel.
                    </p>
                </div>

                {selectedZone && (
                    <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-[10px] uppercase text-slate-400">
                            Zone analysée
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                            {selectedZone}
                        </p>
                    </div>
                )}
            </div>
        </PanelShell>
    );
}

function AnalysisCard({ icon: Icon, title, description }) {
    return (
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <Icon size={17} />
            </div>

            <div>
                <p className="text-xs font-semibold text-slate-800">
                    {title}
                </p>

                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| RISQUES
|--------------------------------------------------------------------------
*/

function RiskPanel({ onClose }) {
    return (
        <PanelShell
            title="Risques & alertes"
            subtitle="Surveillez les principaux risques agro-climatiques"
            icon={AlertTriangle}
            onClose={onClose}
        >
            <div className="space-y-2">
                <RiskRow
                    title="Sécheresse"
                    value="Moyen"
                    level="medium"
                />

                <RiskRow
                    title="Inondation"
                    value="Faible"
                    level="low"
                />

                <RiskRow
                    title="Stress thermique"
                    value="Élevé"
                    level="high"
                />

                <RiskRow
                    title="Stress hydrique"
                    value="Moyen"
                    level="medium"
                />

                <RiskRow
                    title="Risque phytosanitaire"
                    value="À surveiller"
                    level="medium"
                />
            </div>
        </PanelShell>
    );
}

function RiskRow({ title, value, level }) {
    const styles = {
        low: "bg-green-50 text-green-700",
        medium: "bg-orange-50 text-orange-700",
        high: "bg-red-50 text-red-700",
    };

    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles[level]}`}
            >
                <AlertTriangle size={16} />
            </div>

            <div className="flex-1">
                <p className="text-xs font-semibold text-slate-800">
                    {title}
                </p>
                <p className="text-[9px] text-slate-400">
                    Niveau actuel
                </p>
            </div>

            <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${styles[level]}`}
            >
        {value}
      </span>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| HISTORIQUE
|--------------------------------------------------------------------------
*/

function HistoryPanel({ onClose }) {
    return (
        <PanelShell
            title="Historique"
            subtitle="Comparez l'évolution du territoire dans le temps"
            icon={Activity}
            onClose={onClose}
        >
            <div className="grid grid-cols-3 gap-2">
                {["2024", "2025", "2026"].map((year) => (
                    <button
                        key={year}
                        className="rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-green-400 hover:bg-green-50"
                    >
                        {year}
                    </button>
                ))}
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-800">
                    Comparaison temporelle
                </p>

                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Les données historiques pourront être comparées
                    pour les cultures, rendements, infrastructures,
                    précipitations, NDVI et risques.
                </p>

                <div className="mt-4 h-32 rounded-xl border border-dashed border-slate-300 bg-white">
                    <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                        Graphique historique à connecter
                    </div>
                </div>
            </div>
        </PanelShell>
    );
}

/*
|--------------------------------------------------------------------------
| SATELLITE
|--------------------------------------------------------------------------
*/

function SatellitePanel({ onClose }) {
    return (
        <PanelShell
            title="Observation satellite"
            subtitle="Sélectionnez une variable issue de l'observation de la Terre"
            icon={Satellite}
            onClose={onClose}
        >
            <div className="grid grid-cols-2 gap-2">
                {[
                    ["NDVI", "Végétation"],
                    ["EVI", "Végétation améliorée"],
                    ["NDWI", "Eau"],
                    ["LAI", "Indice foliaire"],
                    ["LST", "Température surface"],
                    ["Sentinel", "Imagerie"],
                ].map(([title, description]) => (
                    <button
                        key={title}
                        className="rounded-xl border border-slate-200 p-3 text-left hover:border-purple-300 hover:bg-purple-50"
                    >
                        <Satellite
                            size={17}
                            className="text-purple-600"
                        />

                        <p className="mt-2 text-xs font-bold text-slate-800">
                            {title}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                            {description}
                        </p>
                    </button>
                ))}
            </div>
        </PanelShell>
    );
}

/*
|--------------------------------------------------------------------------
| PANNEAU DE BASE MAP
|--------------------------------------------------------------------------
*/

function BaseMapPanel({
                          baseMap,
                          setBaseMap,
                          onClose,
                      }) {
    return (
        <PanelShell
            title="Fond cartographique"
            subtitle="Choisissez la représentation de base"
            icon={MapIcon}
            onClose={onClose}
            width="w-80"
        >
            <div className="grid grid-cols-2 gap-2">
                {baseMaps.map((map) => {
                    const Icon = map.icon;
                    const selected = baseMap === map.label;

                    return (
                        <button
                            key={map.id}
                            onClick={() => setBaseMap(map.label)}
                            className={`rounded-xl border p-4 ${
                                selected
                                    ? "border-green-500 bg-green-50"
                                    : "border-slate-200"
                            }`}
                        >
                            <Icon
                                size={20}
                                className="mx-auto"
                            />

                            <p className="mt-2 text-xs font-semibold">
                                {map.label}
                            </p>
                        </button>
                    );
                })}
            </div>
        </PanelShell>
    );
}



/*
|--------------------------------------------------------------------------
| DASHBOARD PRINCIPAL
|--------------------------------------------------------------------------
*/

export default function Dashboard() {
    const [activeView, setActiveView] = useState("map");

    const [selectedZone, setSelectedZone] = useState(null);

    const [zoom, setZoom] = useState(6);

    const [baseMap, setBaseMap] = useState("Clair");

    const [filters, setFilters] =
        useState(defaultFilters);

    const [activeLayers, setActiveLayers] = useState(
        initialActiveLayers
    );

    const [layerSettings, setLayerSettings] =
        useState(initialLayerSettings);

    const [activeLayerOrder, setActiveLayerOrder] =
        useState(
            Object.keys(initialActiveLayers).filter(
                (id) => initialActiveLayers[id]
            )
        );

    const activeLayerIds = activeLayerOrder.filter(
        (id) => activeLayers[id]
    );

    const handleApplyFilters = () => {
        /*
         * À remplacer plus tard par :
         *
         * GET /api/agriculture?
         * region=Kaffrine&
         * crop=Arachide&
         * fertilizer=NPK&
         * ...
         *
         * Les résultats pourront ensuite alimenter les couches
         * quantitatives et cartographiques.
         */

        console.log("Filtres appliqués :", filters);

        setActiveView("map");
    };

    const handleResetFilters = () => {
        setFilters(defaultFilters);
    };

    const handleLocate = () => {
        /*
         * À remplacer par la géolocalisation réelle ou
         * la position sélectionnée dans MapLibre.
         */

        console.log("Localisation demandée");
    };

    // Gestionnaires provisoires des boutons de compte utilisateur.
    // Ils pourront ensuite ouvrir de vrais panneaux ou dialogues.
    const handleUserProfile = () => {
        console.log("Ouverture du profil utilisateur");
    };

    const handleUserSettings = () => {
        console.log("Ouverture des paramètres utilisateur");
    };

    const handleUserBells = () => {
        console.log("Ouverture des notifications");
    };

    const handleUserOthersOptions = () => {
        console.log("Ouverture des autres options utilisateur");
    };

    const handleRemoveLayer = (layerId) => {
        setActiveLayers((current) => ({
            ...current,
            [layerId]: false,
        }));

        setActiveLayerOrder((current) =>
            current.filter((id) => id !== layerId)
        );
    };

    const renderPanel = () => {
        switch (activeView) {
            case "filters":
                return (
                    <FilterPanel
                        filters={filters}
                        setFilters={setFilters}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                        onClose={() => setActiveView(null)}
                    />
                );

            case "layers":
                return (
                    <LayerPanel
                        activeLayers={activeLayers}
                        setActiveLayers={setActiveLayers}
                        layerSettings={layerSettings}
                        setLayerSettings={setLayerSettings}
                        activeLayerOrder={activeLayerOrder}
                        setActiveLayerOrder={setActiveLayerOrder}
                        baseMap={baseMap}
                        setBaseMap={setBaseMap}
                        onClose={() => setActiveView(null)}
                    />
                );

            case "analysis":
                return (
                    <AnalysisPanel
                        selectedZone={selectedZone}
                        onClose={() => setActiveView(null)}
                    />
                );

            case "risks":
                return (
                    <RiskPanel
                        onClose={() => setActiveView(null)}
                    />
                );

            case "history":
                return (
                    <HistoryPanel
                        onClose={() => setActiveView(null)}
                    />
                );

            case "satellite":
                return (
                    <SatellitePanel
                        onClose={() => setActiveView(null)}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-100 text-slate-900">
            {/*<DashboardHeader*/}
            {/*    onOpenSearch={() => setActiveView("filters")}*/}
            {/*/>*/}

            <LocationMapDashboard
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                zoom={zoom}
                setZoom={setZoom}
                baseMap={baseMap}
                onOpenBaseMap={() =>
                    setActiveView("base-map")
                }
                activeLayerIds={activeLayerIds}
                layerSettings={layerSettings}
                onRemoveLayer={handleRemoveLayer}
                onLocate={handleLocate}
                onHandleUserProfile={handleUserProfile}
                onHandleUserSettings={handleUserSettings}
                onHandleUserBells={handleUserBells}
                onHandleUserOthersOptions={handleUserOthersOptions}
            />

            {activeView === "base-map" && (
                <BaseMapPanel
                    baseMap={baseMap}
                    setBaseMap={setBaseMap}
                    onClose={() => setActiveView(null)}
                />
            )}

            {renderPanel()}

            <BottomNavigation
                activeView={activeView}
                setActiveView={setActiveView}
                activeLayerCount={activeLayerIds.length}
            />
        </div>
    );
}
