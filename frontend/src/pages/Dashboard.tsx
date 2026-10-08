import { useState } from "react";

import {
    Activity,
    AlertTriangle,
    BarChart3,
    Bell,
    Check,
    ChevronDown,
    ChevronLeft,
    CloudRain,
    Droplets,
    Filter,
    Layers,
    LocateFixed,
    Map,
    MapPinned,
    Mountain,
    Search,
    Settings,
    Satellite,
    Sprout,
    Sun,
    Thermometer,
    TrendingUp,
    UserRound,
    Waves,
    Wind,
    X,
    ZoomIn,
    ZoomOut,
} from "lucide-react";

/* =========================================================
   DONNÉES DES COUCHES CARTOGRAPHIQUES

   IMPORTANT :
   Une couche représente un élément géographique
   que l'utilisateur souhaite afficher ou masquer.

   Exemple :
   - Communes
   - Routes
   - Barrages
   - Parcelles
   - Stations météo

   Les variables comme "NDVI", "rendement", "précipitations"
   sont traitées dans VISUALISATION et FILTRES.
========================================================= */

const mapLayers = [
    {
        id: "administration",
        label: "Administration",
        icon: Map,
        color: "text-gray-700",

        layers: [
            {
                id: "regions",
                label: "Régions",
                description: "Limites régionales du Sénégal",
                icon: Map,
            },
            {
                id: "departments",
                label: "Départements",
                description: "Limites départementales",
                icon: Map,
            },
            {
                id: "communes",
                label: "Communes",
                description: "Limites communales",
                icon: Map,
            },
            {
                id: "villages",
                label: "Villages et localités",
                description: "Localités et villages",
                icon: MapPinned,
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
                description: "Superficies agricoles exploitées",
                icon: Sprout,
            },
            {
                id: "parcels",
                label: "Parcelles agricoles",
                description: "Parcelles et exploitations",
                icon: Map,
            },
            {
                id: "irrigated-zones",
                label: "Zones irriguées",
                description: "Périmètres bénéficiant de l'irrigation",
                icon: Waves,
            },
            {
                id: "agricultural-zones",
                label: "Zones agroécologiques",
                description: "Grandes zones agricoles",
                icon: Sprout,
            },
        ],
    },

    {
        id: "hydrology",
        label: "Hydrologie",
        icon: Waves,
        color: "text-cyan-600",

        layers: [
            {
                id: "rivers",
                label: "Fleuves et rivières",
                description: "Réseau hydrographique",
                icon: Waves,
            },
            {
                id: "lakes",
                label: "Lacs et retenues",
                description: "Lacs, retenues et mares",
                icon: Waves,
            },
            {
                id: "dams",
                label: "Barrages",
                description: "Barrages et ouvrages hydrauliques",
                icon: Waves,
            },
            {
                id: "groundwater",
                label: "Nappes phréatiques",
                description: "Informations hydrogéologiques",
                icon: Droplets,
            },
            {
                id: "watersheds",
                label: "Bassins versants",
                description: "Délimitation des bassins versants",
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
                id: "soil-types",
                label: "Types de sols",
                description: "Classification des sols",
                icon: Mountain,
            },
            {
                id: "soil-texture",
                label: "Texture des sols",
                description: "Sableux, argileux, limoneux...",
                icon: Mountain,
            },
            {
                id: "soil-fertility",
                label: "Fertilité",
                description: "Potentiel de fertilité des sols",
                icon: Sprout,
            },
            {
                id: "soil-salinity",
                label: "Salinité",
                description: "Zones affectées par la salinité",
                icon: Waves,
            },
            {
                id: "soil-erosion",
                label: "Érosion",
                description: "Sensibilité à l'érosion",
                icon: Mountain,
            },
        ],
    },

    {
        id: "infrastructure",
        label: "Infrastructures",
        icon: MapPinned,
        color: "text-orange-600",

        layers: [
            {
                id: "markets",
                label: "Marchés",
                description: "Marchés agricoles",
                icon: MapPinned,
            },
            {
                id: "storage",
                label: "Entrepôts et stockage",
                description: "Capacités de stockage",
                icon: MapPinned,
            },
            {
                id: "processing",
                label: "Unités de transformation",
                description: "Industries et unités agroalimentaires",
                icon: MapPinned,
            },
            {
                id: "weather-stations",
                label: "Stations météorologiques",
                description: "Stations d'observation climatique",
                icon: CloudRain,
            },
            {
                id: "boreholes",
                label: "Forages",
                description: "Points d'accès à l'eau",
                icon: Droplets,
            },
            {
                id: "roads",
                label: "Routes et pistes",
                description: "Réseau routier et pistes rurales",
                icon: Map,
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
                id: "weather-stations-climate",
                label: "Stations climatiques",
                description: "Stations de mesure climatique",
                icon: CloudRain,
            },
            {
                id: "climate-zones",
                label: "Zones climatiques",
                description: "Classification climatique",
                icon: CloudRain,
            },
        ],
    },

    {
        id: "satellite",
        label: "Satellite",
        icon: Satellite,
        color: "text-purple-600",

        layers: [
            {
                id: "sentinel",
                label: "Sentinel",
                description: "Imagerie Sentinel",
                icon: Satellite,
            },
            {
                id: "landsat",
                label: "Landsat",
                description: "Imagerie Landsat",
                icon: Satellite,
            },
        ],
    },
];

/* =========================================================
   FILTRES PAR DÉFAUT
========================================================= */

const defaultFilters = {
    /* Géographie */
    region: "Toutes",
    department: "Tous",
    commune: "Toutes",

    /* Agriculture */
    crop: "Toutes",
    season: "Toutes",
    farmingType: "Tous",
    farmType: "Tous",

    /* Engrais */
    fertilizer: "Tous",
    fertilizerMethod: "Tous",
    fertilizerFrequency: "Toutes",
    fertilizerQuantity: 0,

    /* Rendement */
    yieldMin: 0,
    productionMin: 0,

    /* Infrastructure */
    infrastructureType: "Toutes",
    infrastructureStatus: "Tous",
    infrastructureYear: 2026,
    infrastructureHistory: "Tous",

    /* Climat */
    climatePeriod: "2026",
    rainfallMin: 0,
    temperatureMin: 0,

    /* Sol */
    soilType: "Tous",
    soilFertility: "Toutes",
    salinity: "Toutes",

    /* Eau */
    waterAvailability: "Toutes",
    irrigation: "Toutes",

    /* Risques */
    risk: "Tous",
};

/* =========================================================
   HEADER
========================================================= */

const DashboardHeader = ({ onSearch }) => {
    return (
        <header className="absolute left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4">

                {/* LOGO */}

                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
                        <Sprout size={22} />
                    </div>

                    <div>
                        <h1 className="text-base font-bold text-gray-900">
                            ASSAMAN-SUUF
                        </h1>

                        <p className="hidden text-xs text-gray-500 sm:block">
                            Plateforme agroclimatique
                        </p>
                    </div>
                </div>

                {/* RECHERCHE */}

                <div className="mx-4 hidden max-w-xl flex-1 md:block">
                    <div className="relative">

                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            placeholder="Rechercher une région, commune, culture..."
                            onChange={onSearch}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white"
                        />

                    </div>
                </div>

                {/* ACTIONS */}

                <div className="flex items-center gap-2">

                    <button
                        className="hidden h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 sm:flex"
                        title="Alertes"
                    >
                        <Bell size={19} />
                    </button>

                    <button
                        className="hidden h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 sm:flex"
                        title="Paramètres"
                    >
                        <Settings size={19} />
                    </button>

                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600"
                        title="Profil"
                    >
                        <UserRound size={19} />
                    </button>

                </div>
            </div>
        </header>
    );
};

/* =========================================================
   PANNEAU DES COUCHES
========================================================= */

const LayerPanel = ({
                        activeLayers,
                        setActiveLayers,
                        onClose,
                    }) => {
    const [activeCategory, setActiveCategory] =
        useState("administration");

    const toggleLayer = (layerId) => {
        setActiveLayers((previous) => ({
            ...previous,
            [layerId]: !previous[layerId],
        }));
    };

    const currentCategory = mapLayers.find(
        (category) => category.id === activeCategory
    );

    return (
        <aside className="absolute bottom-20 left-4 top-20 z-40 flex w-[400px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur">

            {/* CATÉGORIES */}

            <div className="flex w-[90px] shrink-0 flex-col border-r border-gray-200 bg-gray-50">

                <div className="flex h-14 items-center justify-center border-b border-gray-200">
                    <Layers size={20} className="text-gray-700" />
                </div>

                <div className="flex-1 overflow-y-auto">

                    {mapLayers.map((category) => {
                        const Icon = category.icon;

                        const isActive =
                            activeCategory === category.id;

                        return (
                            <button
                                key={category.id}
                                onClick={() =>
                                    setActiveCategory(category.id)
                                }
                                className={`flex w-full flex-col items-center gap-1 px-1 py-3 text-[10px] transition ${
                                    isActive
                                        ? "bg-white font-semibold text-green-600 shadow-sm"
                                        : "text-gray-500 hover:bg-white"
                                }`}
                            >
                                <Icon size={18} />

                                <span className="text-center">
                  {category.label}
                </span>
                            </button>
                        );
                    })}

                </div>
            </div>

            {/* CONTENU */}

            <div className="flex min-w-0 flex-1 flex-col">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">

                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Couches cartographiques
                        </p>

                        <h2 className="mt-1 text-base font-bold text-gray-900">
                            {currentCategory?.label}
                        </h2>

                        <p className="mt-0.5 text-xs text-gray-500">
                            Afficher les éléments sur la carte
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
                        title="Fermer"
                    >
                        <X size={18} />
                    </button>

                </div>

                {/* LISTE */}

                <div className="flex-1 overflow-y-auto p-3">

                    {currentCategory?.layers.map((layer) => {
                        const Icon = layer.icon;

                        const isActive =
                            Boolean(activeLayers[layer.id]);

                        return (
                            <button
                                key={layer.id}
                                onClick={() => toggleLayer(layer.id)}
                                className={`mb-2 flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                                    isActive
                                        ? "border-green-200 bg-green-50"
                                        : "border-transparent hover:bg-gray-50"
                                }`}
                            >

                                <div className="flex min-w-0 items-center gap-3">

                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            isActive
                                                ? "bg-green-100 text-green-600"
                                                : "bg-gray-100 text-gray-400"
                                        }`}
                                    >
                                        <Icon size={17} />
                                    </div>

                                    <div className="min-w-0">

                                        <p className="truncate text-sm font-medium text-gray-800">
                                            {layer.label}
                                        </p>

                                        <p className="mt-0.5 truncate text-[11px] text-gray-400">
                                            {layer.description}
                                        </p>

                                    </div>

                                </div>

                                {/* SWITCH */}

                                <div
                                    className={`ml-3 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
                                        isActive
                                            ? "bg-green-500"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    <div
                                        className={`h-4 w-4 rounded-full bg-white shadow transition ${
                                            isActive
                                                ? "translate-x-4"
                                                : "translate-x-0"
                                        }`}
                                    />
                                </div>

                            </button>
                        );
                    })}

                </div>

                {/* FOOTER */}

                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">

                    <p className="text-[11px] leading-relaxed text-gray-500">
                        Les couches contrôlent uniquement les
                        éléments géographiques visibles sur la carte.
                        Les critères d'analyse sont disponibles dans
                        Filtres et Visualisation.
                    </p>

                </div>

            </div>
        </aside>
    );
};

/* =========================================================
   PANNEAU DES FILTRES
========================================================= */

const FilterPanel = ({
                         filters,
                         setFilters,
                         onApply,
                         onReset,
                         onClose,
                     }) => {
    const updateFilter = (key, value) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    return (
        <aside className="absolute bottom-20 left-4 top-20 z-40 flex w-[430px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Recherche avancée
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                        Filtres
                    </h2>

                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Définissez précisément les données que
                        vous souhaitez rechercher et analyser.
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    title="Fermer"
                >
                    <X size={18} />
                </button>

            </div>

            {/* CONTENU */}

            <div className="flex-1 overflow-y-auto p-5">

                {/* GÉOGRAPHIE */}

                <FilterSection
                    title="Localisation"
                    icon={MapPinned}
                >
                    <SelectField
                        label="Région"
                        value={filters.region}
                        onChange={(value) =>
                            updateFilter("region", value)
                        }
                        options={[
                            "Toutes",
                            "Dakar",
                            "Thiès",
                            "Diourbel",
                            "Fatick",
                            "Kaolack",
                            "Kaffrine",
                            "Saint-Louis",
                            "Louga",
                            "Matam",
                            "Tambacounda",
                            "Kédougou",
                            "Ziguinchor",
                            "Sédhiou",
                            "Kolda",
                        ]}
                    />

                    <SelectField
                        label="Département"
                        value={filters.department}
                        onChange={(value) =>
                            updateFilter("department", value)
                        }
                        options={[
                            "Tous",
                            "Sélectionner selon la région",
                        ]}
                    />

                    <SelectField
                        label="Commune"
                        value={filters.commune}
                        onChange={(value) =>
                            updateFilter("commune", value)
                        }
                        options={[
                            "Toutes",
                            "Sélectionner selon le département",
                        ]}
                    />
                </FilterSection>

                {/* AGRICULTURE */}

                <FilterSection
                    title="Agriculture"
                    icon={Sprout}
                >
                    <SelectField
                        label="Culture"
                        value={filters.crop}
                        onChange={(value) =>
                            updateFilter("crop", value)
                        }
                        options={[
                            "Toutes",
                            "Arachide",
                            "Mil",
                            "Maïs",
                            "Riz",
                            "Sorgho",
                            "Niébé",
                            "Tomate",
                            "Oignon",
                            "Canne à sucre",
                            "Coton",
                        ]}
                    />

                    <SelectField
                        label="Saison agricole"
                        value={filters.season}
                        onChange={(value) =>
                            updateFilter("season", value)
                        }
                        options={[
                            "Toutes",
                            "Hivernage",
                            "Contre-saison",
                            "Irriguée",
                        ]}
                    />

                    <SelectField
                        label="Mode de culture"
                        value={filters.farmingType}
                        onChange={(value) =>
                            updateFilter(
                                "farmingType",
                                value
                            )
                        }
                        options={[
                            "Tous",
                            "Pluvial",
                            "Irrigué",
                            "Mixte",
                        ]}
                    />

                    <SelectField
                        label="Type d'exploitation"
                        value={filters.farmType}
                        onChange={(value) =>
                            updateFilter("farmType", value)
                        }
                        options={[
                            "Tous",
                            "Familiale",
                            "Individuelle",
                            "Coopérative",
                            "Agro-industrielle",
                        ]}
                    />
                </FilterSection>

                {/* ENGRAIS */}

                <FilterSection
                    title="Intrants et engrais"
                    icon={Sprout}
                >
                    <SelectField
                        label="Type d'engrais"
                        value={filters.fertilizer}
                        onChange={(value) =>
                            updateFilter(
                                "fertilizer",
                                value
                            )
                        }
                        options={[
                            "Tous",
                            "Urée",
                            "NPK",
                            "DAP",
                            "MAP",
                            "Compost",
                            "Fumier",
                            "Engrais organique",
                            "Engrais minéral",
                            "Autre",
                        ]}
                    />

                    <SelectField
                        label="Mode d'application"
                        value={filters.fertilizerMethod}
                        onChange={(value) =>
                            updateFilter(
                                "fertilizerMethod",
                                value
                            )
                        }
                        options={[
                            "Tous",
                            "Épandage",
                            "Localisé",
                            "Fertigation",
                            "Pulvérisation",
                        ]}
                    />

                    <SelectField
                        label="Fréquence d'application"
                        value={filters.fertilizerFrequency}
                        onChange={(value) =>
                            updateFilter(
                                "fertilizerFrequency",
                                value
                            )
                        }
                        options={[
                            "Toutes",
                            "Une fois",
                            "Deux fois",
                            "Trois fois ou plus",
                        ]}
                    />

                    <RangeField
                        label="Quantité d'engrais (kg/ha)"
                        value={filters.fertilizerQuantity}
                        onChange={(value) =>
                            updateFilter(
                                "fertilizerQuantity",
                                value
                            )
                        }
                        min="0"
                        max="1000"
                    />
                </FilterSection>

                {/* RENDEMENT */}

                <FilterSection
                    title="Production et rendement"
                    icon={TrendingUp}
                >
                    <RangeField
                        label="Rendement minimum (t/ha)"
                        value={filters.yieldMin}
                        onChange={(value) =>
                            updateFilter(
                                "yieldMin",
                                value
                            )
                        }
                        min="0"
                        max="10"
                        step="0.1"
                    />

                    <RangeField
                        label="Production minimum (tonnes)"
                        value={filters.productionMin}
                        onChange={(value) =>
                            updateFilter(
                                "productionMin",
                                value
                            )
                        }
                        min="0"
                        max="100000"
                    />
                </FilterSection>

                {/* INFRASTRUCTURES */}

                <FilterSection
                    title="Infrastructures"
                    icon={MapPinned}
                >
                    <SelectField
                        label="Type d'infrastructure"
                        value={filters.infrastructureType}
                        onChange={(value) =>
                            updateFilter(
                                "infrastructureType",
                                value
                            )
                        }
                        options={[
                            "Toutes",
                            "Marché",
                            "Entrepôt",
                            "Silo",
                            "Unité de transformation",
                            "Station météo",
                            "Forage",
                            "Barrage",
                            "Route",
                            "Piste rurale",
                        ]}
                    />

                    <SelectField
                        label="État"
                        value={filters.infrastructureStatus}
                        onChange={(value) =>
                            updateFilter(
                                "infrastructureStatus",
                                value
                            )
                        }
                        options={[
                            "Tous",
                            "Opérationnel",
                            "Partiellement opérationnel",
                            "Dégradé",
                            "Hors service",
                            "Abandonné",
                        ]}
                    />

                    <RangeField
                        label="Année de construction"
                        value={filters.infrastructureYear}
                        onChange={(value) =>
                            updateFilter(
                                "infrastructureYear",
                                value
                            )
                        }
                        min="1950"
                        max="2026"
                    />

                    <SelectField
                        label="Historique"
                        value={filters.infrastructureHistory}
                        onChange={(value) =>
                            updateFilter(
                                "infrastructureHistory",
                                value
                            )
                        }
                        options={[
                            "Tous",
                            "Nouvelle infrastructure",
                            "Rénovée",
                            "Agrandie",
                            "Dégradée",
                            "Réhabilitée",
                            "Fermée",
                        ]}
                    />
                </FilterSection>

                {/* CLIMAT */}

                <FilterSection
                    title="Climat"
                    icon={CloudRain}
                >
                    <SelectField
                        label="Période"
                        value={filters.climatePeriod}
                        onChange={(value) =>
                            updateFilter(
                                "climatePeriod",
                                value
                            )
                        }
                        options={[
                            "2026",
                            "2025",
                            "2024",
                            "2023",
                            "2022",
                            "2021",
                            "2011-2020",
                            "2001-2010",
                        ]}
                    />

                    <RangeField
                        label="Précipitations minimum (mm)"
                        value={filters.rainfallMin}
                        onChange={(value) =>
                            updateFilter(
                                "rainfallMin",
                                value
                            )
                        }
                        min="0"
                        max="2000"
                    />

                    <RangeField
                        label="Température minimum (°C)"
                        value={filters.temperatureMin}
                        onChange={(value) =>
                            updateFilter(
                                "temperatureMin",
                                value
                            )
                        }
                        min="0"
                        max="50"
                    />
                </FilterSection>

                {/* SOLS */}

                <FilterSection
                    title="Sols"
                    icon={Mountain}
                >
                    <SelectField
                        label="Type de sol"
                        value={filters.soilType}
                        onChange={(value) =>
                            updateFilter(
                                "soilType",
                                value
                            )
                        }
                        options={[
                            "Tous",
                            "Sableux",
                            "Argileux",
                            "Limoneux",
                            "Sablo-argileux",
                            "Latéritique",
                            "Alluvial",
                        ]}
                    />

                    <SelectField
                        label="Fertilité"
                        value={filters.soilFertility}
                        onChange={(value) =>
                            updateFilter(
                                "soilFertility",
                                value
                            )
                        }
                        options={[
                            "Toutes",
                            "Faible",
                            "Moyenne",
                            "Élevée",
                        ]}
                    />

                    <SelectField
                        label="Salinité"
                        value={filters.salinity}
                        onChange={(value) =>
                            updateFilter(
                                "salinity",
                                value
                            )
                        }
                        options={[
                            "Toutes",
                            "Faible",
                            "Moyenne",
                            "Forte",
                        ]}
                    />
                </FilterSection>

                {/* EAU */}

                <FilterSection
                    title="Eau et irrigation"
                    icon={Droplets}
                >
                    <SelectField
                        label="Disponibilité en eau"
                        value={filters.waterAvailability}
                        onChange={(value) =>
                            updateFilter(
                                "waterAvailability",
                                value
                            )
                        }
                        options={[
                            "Toutes",
                            "Faible",
                            "Moyenne",
                            "Bonne",
                            "Très bonne",
                        ]}
                    />

                    <SelectField
                        label="Irrigation"
                        value={filters.irrigation}
                        onChange={(value) =>
                            updateFilter(
                                "irrigation",
                                value
                            )
                        }
                        options={[
                            "Toutes",
                            "Irrigué",
                            "Non irrigué",
                        ]}
                    />
                </FilterSection>

                {/* RISQUES */}

                <FilterSection
                    title="Risques"
                    icon={AlertTriangle}
                >
                    <SelectField
                        label="Risque principal"
                        value={filters.risk}
                        onChange={(value) =>
                            updateFilter("risk", value)
                        }
                        options={[
                            "Tous",
                            "Sécheresse",
                            "Inondation",
                            "Stress thermique",
                            "Stress hydrique",
                            "Érosion",
                            "Salinisation",
                            "Risque phytosanitaire",
                        ]}
                    />
                </FilterSection>
            </div>

            {/* FOOTER */}

            <div className="flex gap-2 border-t border-gray-200 bg-gray-50 p-4">

                <button
                    onClick={onReset}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                    Réinitialiser
                </button>

                <button
                    onClick={onApply}
                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                    Appliquer
                </button>

            </div>
        </aside>
    );
};

/* =========================================================
   PANNEAU VISUALISATION
========================================================= */

const VisualizationPanel = ({
                                visualization,
                                setVisualization,
                                onClose,
                            }) => {
    const variables = [
        ["none", "Aucune"],
        ["rainfall", "Précipitations"],
        ["temperature", "Température"],
        ["yield", "Rendement agricole"],
        ["ndvi", "NDVI"],
        ["soil-fertility", "Fertilité des sols"],
        ["water-stress", "Stress hydrique"],
        ["drought", "Risque de sécheresse"],
        [
            "infrastructure-density",
            "Densité des infrastructures",
        ],
    ];

    const modes = [
        ["choropleth", "Choroplèthe"],
        ["gradient", "Gradient"],
        ["heatmap", "Heatmap"],
        ["points", "Points"],
        ["isoline", "Iso-lignes"],
        ["risk", "Classes de risque"],
    ];

    return (
        <aside className="absolute bottom-20 right-4 top-20 z-40 w-[360px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Analyse cartographique
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                        Visualisation
                    </h2>

                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Ajoutez une représentation analytique
                        aux couches déjà visibles.
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    title="Fermer"
                >
                    <X size={18} />
                </button>

            </div>

            <div className="space-y-6 p-5">

                {/* VARIABLE */}

                <section>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Variable à visualiser
                    </p>

                    <div className="space-y-2">

                        {variables.map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() =>
                                    setVisualization((previous) => ({
                                        ...previous,
                                        variable: id,
                                    }))
                                }
                                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                                    visualization.variable === id
                                        ? "border-green-200 bg-green-50"
                                        : "border-gray-100 hover:bg-gray-50"
                                }`}
                            >

                <span className="text-sm text-gray-700">
                  {label}
                </span>

                                {visualization.variable === id && (
                                    <Check
                                        size={17}
                                        className="text-green-600"
                                    />
                                )}

                            </button>
                        ))}

                    </div>
                </section>

                {/* MODE */}

                <section>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Mode de représentation
                    </p>

                    <div className="grid grid-cols-2 gap-2">

                        {modes.map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() =>
                                    setVisualization((previous) => ({
                                        ...previous,
                                        mode: id,
                                    }))
                                }
                                className={`rounded-xl border p-3 text-xs font-medium transition ${
                                    visualization.mode === id
                                        ? "border-green-300 bg-green-50 text-green-700"
                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {label}
                            </button>
                        ))}

                    </div>
                </section>

                {/* OPACITÉ */}

                <section>

                    <div className="mb-2 flex justify-between">

            <span className="text-xs font-medium text-gray-500">
              Opacité
            </span>

                        <span className="text-xs font-semibold text-green-600">
              {visualization.opacity}%
            </span>

                    </div>

                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={visualization.opacity}
                        onChange={(event) =>
                            setVisualization((previous) => ({
                                ...previous,
                                opacity: event.target.value,
                            }))
                        }
                        className="w-full accent-green-600"
                    />

                </section>

            </div>
        </aside>
    );
};

/* =========================================================
   COMPOSANTS FILTRES
========================================================= */

const FilterSection = ({
                           title,
                           icon: Icon,
                           children,
                       }) => {
    return (
        <section className="mb-6">

            <div className="mb-3 flex items-center gap-2">

                <Icon
                    size={16}
                    className="text-green-600"
                />

                <h3 className="text-sm font-semibold text-gray-900">
                    {title}
                </h3>

            </div>

            <div className="space-y-3">
                {children}
            </div>

        </section>
    );
};

const SelectField = ({
                         label,
                         value,
                         onChange,
                         options,
                     }) => {
    return (
        <label className="block">

      <span className="mb-1.5 block text-xs font-medium text-gray-500">
        {label}
      </span>

            <div className="relative">

                <select
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-9 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:bg-white"
                >
                    {options.map((option) => (
                        <option
                            key={option}
                            value={option}
                        >
                            {option}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

            </div>
        </label>
    );
};

const RangeField = ({
                        label,
                        value,
                        onChange,
                        min,
                        max,
                        step = "1",
                    }) => {
    return (
        <label className="block">

            <div className="mb-1.5 flex items-center justify-between">

        <span className="text-xs font-medium text-gray-500">
          {label}
        </span>

                <span className="text-xs font-semibold text-green-600">
          {value}
        </span>

            </div>

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="w-full accent-green-600"
            />

        </label>
    );
};

/* =========================================================
   CARTE
========================================================= */

const LocationMapDashboard = ({
                                  zoom,
                                  setZoom,
                                  onLocation,
                                  onSelectZone,
                                  activeLayers,
                                  filters,
                                  visualization,
                              }) => {
    return (
        <main className="absolute inset-0 overflow-hidden bg-[#e8eee7] pt-16">

            {/* =================================================
          FOND DE CARTE
      ================================================= */}

            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(230,238,230,0.55), rgba(220,232,220,0.65)), url('/images/senegal-map.png')",
                }}
            >

                {/* =================================================
            EXEMPLES DE ZONES
        ================================================= */}

                <button
                    onClick={() =>
                        onSelectZone("Kaffrine")
                    }
                    className="absolute left-[48%] top-[52%] h-8 w-8 rounded-full border-4 border-white bg-green-600 shadow-lg transition hover:scale-125"
                    title="Kaffrine"
                />

                <button
                    onClick={() =>
                        onSelectZone("Kaolack")
                    }
                    className="absolute left-[43%] top-[60%] h-8 w-8 rounded-full border-4 border-white bg-orange-500 shadow-lg transition hover:scale-125"
                    title="Kaolack"
                />

                <button
                    onClick={() =>
                        onSelectZone("Saint-Louis")
                    }
                    className="absolute left-[47%] top-[27%] h-8 w-8 rounded-full border-4 border-white bg-blue-500 shadow-lg transition hover:scale-125"
                    title="Saint-Louis"
                />

                {/* =================================================
            VISUALISATION DEMO

            Cette partie est temporaire.

            Dans la version MapLibre, cette visualisation
            sera réellement appliquée aux sources
            cartographiques.
        ================================================= */}

                {visualization.variable !== "none" && (
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            opacity:
                                Number(
                                    visualization.opacity
                                ) / 100,
                        }}
                    >
                        <div className="absolute left-[35%] top-[35%] h-48 w-48 rounded-full bg-green-400/20 blur-3xl" />

                        <div className="absolute left-[50%] top-[50%] h-56 w-56 rounded-full bg-yellow-400/20 blur-3xl" />

                        <div className="absolute left-[58%] top-[65%] h-48 w-48 rounded-full bg-red-400/20 blur-3xl" />
                    </div>
                )}

            </div>

            {/* =================================================
          RECHERCHE MOBILE
      ================================================= */}

            <div className="absolute left-4 right-4 top-20 md:hidden">

                <div className="relative">

                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        placeholder="Rechercher une zone..."
                        className="w-full rounded-xl border border-gray-200 bg-white/95 py-3 pl-10 pr-4 text-sm shadow-lg outline-none"
                    />

                </div>

            </div>

            {/* =================================================
          CONTRÔLES CARTE
      ================================================= */}

            <div className="absolute right-4 top-24 z-30 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">

                <button
                    onClick={() =>
                        setZoom((value) => value + 1)
                    }
                    className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-50"
                    title="Zoom avant"
                >
                    <ZoomIn size={19} />
                </button>

                <button
                    onClick={() =>
                        setZoom((value) =>
                            Math.max(1, value - 1)
                        )
                    }
                    className="flex h-11 w-11 items-center justify-center border-t border-gray-100 text-gray-600 hover:bg-gray-50"
                    title="Zoom arrière"
                >
                    <ZoomOut size={19} />
                </button>

                <button
                    onClick={onLocation}
                    className="flex h-11 w-11 items-center justify-center border-t border-gray-100 text-gray-600 hover:bg-gray-50"
                    title="Ma position"
                >
                    <LocateFixed size={19} />
                </button>

                <button
                    className="flex h-11 w-11 items-center justify-center border-t border-gray-100 text-gray-600 hover:bg-gray-50"
                    title="Changer le fond"
                >
                    <Map size={19} />
                </button>

            </div>

            {/* =================================================
          INFORMATIONS VISUALISATION
      ================================================= */}

            {visualization.variable !== "none" && (
                <div className="absolute right-4 top-[245px] z-20 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg">

                    <p className="text-[10px] font-semibold uppercase text-gray-400">
                        Visualisation
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                        {visualization.variable}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                        {visualization.mode}
                    </p>

                </div>
            )}

            {/* =================================================
          ZOOM
      ================================================= */}

            <div className="absolute bottom-24 right-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow">
                Zoom {zoom}
            </div>

            {/* =================================================
          LÉGENDE
      ================================================= */}

            <div className="absolute bottom-24 left-4 hidden rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg sm:block">

                <p className="mb-3 text-xs font-semibold uppercase text-gray-400">
                    Légende
                </p>

                <div className="space-y-2">

                    <LegendItem
                        color="bg-blue-500"
                        label="Climat"
                    />

                    <LegendItem
                        color="bg-green-500"
                        label="Agriculture"
                    />

                    <LegendItem
                        color="bg-orange-500"
                        label="Infrastructure"
                    />

                    <LegendItem
                        color="bg-red-500"
                        label="Risque"
                    />

                </div>
            </div>

        </main>
    );
};

/* =========================================================
   LÉGENDE
========================================================= */

const LegendItem = ({
                        color,
                        label,
                    }) => {
    return (
        <div className="flex items-center gap-2">

      <span
          className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

            <span className="text-xs text-gray-600">
        {label}
      </span>

        </div>
    );
};

/* =========================================================
   PANNEAU ZONE
========================================================= */

const ZoneInformationPanel = ({
                                  zone,
                                  onClose,
                              }) => {
    if (!zone) return null;

    const zoneData = {
        Kaffrine: {
            rainfall: "542 mm",
            temperature: "29.4 °C",
            ndvi: "0.61",
            crop: "Arachide",
            drought: "Moyen",
            agriculture: "Favorable",

            fertilizer: "NPK",
            fertilizerQuantity: "150 kg/ha",
            infrastructure: "Entrepôt agricole",
            infrastructureStatus: "Opérationnel",
            infrastructureYear: "2015",
        },

        Kaolack: {
            rainfall: "615 mm",
            temperature: "28.9 °C",
            ndvi: "0.58",
            crop: "Arachide / Mil",
            drought: "Faible",
            agriculture: "Favorable",

            fertilizer: "Urée / NPK",
            fertilizerQuantity: "180 kg/ha",
            infrastructure: "Marché agricole",
            infrastructureStatus: "Opérationnel",
            infrastructureYear: "2018",
        },

        "Saint-Louis": {
            rainfall: "287 mm",
            temperature: "30.8 °C",
            ndvi: "0.42",
            crop: "Riz / Maraîchage",
            drought: "Élevé",
            agriculture: "À surveiller",

            fertilizer: "Urée",
            fertilizerQuantity: "120 kg/ha",
            infrastructure: "Station météo",
            infrastructureStatus: "Opérationnel",
            infrastructureYear: "2019",
        },
    };

    const data = zoneData[zone];

    if (!data) return null;

    return (
        <aside className="absolute bottom-20 right-4 top-20 z-40 w-[360px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">

                <div>

                    <p className="text-xs font-medium uppercase text-gray-400">
                        Zone sélectionnée
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                        {zone}
                    </h2>

                </div>

                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    title="Fermer"
                >
                    <X size={18} />
                </button>

            </div>

            <div className="space-y-5 p-5">

                {/* CLIMAT */}

                <section>

                    <SectionTitle
                        icon={CloudRain}
                        title="Climat"
                    />

                    <div className="mt-3 grid grid-cols-2 gap-3">

                        <Metric
                            label="Précipitations"
                            value={data.rainfall}
                        />

                        <Metric
                            label="Température"
                            value={data.temperature}
                        />

                        <Metric
                            label="NDVI"
                            value={data.ndvi}
                        />

                        <Metric
                            label="Culture dominante"
                            value={data.crop}
                        />

                    </div>
                </section>

                {/* ENGRAIS */}

                <section>

                    <SectionTitle
                        icon={Sprout}
                        title="Agriculture et intrants"
                    />

                    <div className="mt-3 grid grid-cols-2 gap-3">

                        <Metric
                            label="Engrais"
                            value={data.fertilizer}
                        />

                        <Metric
                            label="Quantité"
                            value={data.fertilizerQuantity}
                        />

                    </div>

                </section>

                {/* INFRASTRUCTURE */}

                <section>

                    <SectionTitle
                        icon={MapPinned}
                        title="Infrastructure"
                    />

                    <div className="mt-3 space-y-2">

                        <Metric
                            label="Type"
                            value={data.infrastructure}
                        />

                        <Metric
                            label="État"
                            value={data.infrastructureStatus}
                        />

                        <Metric
                            label="Année"
                            value={data.infrastructureYear}
                        />

                    </div>

                </section>

                {/* RISQUES */}

                <section>

                    <SectionTitle
                        icon={AlertTriangle}
                        title="Risques"
                    />

                    <div className="mt-3 rounded-xl bg-yellow-50 p-4">

                        <div className="flex items-center justify-between">

              <span className="text-sm text-gray-700">
                Risque de sécheresse
              </span>

                            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                {data.drought}
              </span>

                        </div>

                    </div>

                </section>

                {/* POTENTIEL AGRICOLE */}

                <section>

                    <SectionTitle
                        icon={Sprout}
                        title="Agriculture"
                    />

                    <div className="mt-3 rounded-xl bg-green-50 p-4">

                        <p className="text-xs text-green-700">
                            Potentiel agricole
                        </p>

                        <p className="mt-1 text-lg font-semibold text-green-800">
                            {data.agriculture}
                        </p>

                    </div>

                </section>

                {/* ACTION */}

                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700">

                    <BarChart3 size={17} />

                    Analyser cette zone

                </button>

            </div>

        </aside>
    );
};

/* =========================================================
   TITRE DE SECTION
========================================================= */

const SectionTitle = ({
                          icon: Icon,
                          title,
                      }) => {
    return (
        <div className="flex items-center gap-2">

            <Icon
                size={17}
                className="text-green-600"
            />

            <h3 className="text-sm font-semibold text-gray-900">
                {title}
            </h3>

        </div>
    );
};

/* =========================================================
   METRIC
========================================================= */

const Metric = ({
                    label,
                    value,
                }) => {
    return (
        <div className="rounded-xl bg-gray-50 p-3">

            <p className="text-[11px] text-gray-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
                {value}
            </p>

        </div>
    );
};

/* =========================================================
   PANNEAU ANALYSE
========================================================= */

const AnalysisPanel = ({
                           onClose,
                           selectedZone,
                       }) => {
    return (
        <aside className="absolute bottom-20 right-4 top-20 z-40 w-[380px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                <div>
                    <p className="text-[10px] font-semibold uppercase text-gray-400">
                        Décision territoriale
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                        Analyse
                    </h2>
                </div>

                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <X size={18} />
                </button>

            </div>

            <div className="space-y-5 p-5">

                <div className="rounded-xl bg-green-50 p-4">

                    <p className="text-xs text-green-700">
                        Zone analysée
                    </p>

                    <p className="mt-1 text-xl font-bold text-green-800">
                        {selectedZone || "Sélectionnez une zone"}
                    </p>

                </div>

                <div className="grid grid-cols-2 gap-3">

                    <Metric
                        label="Potentiel agricole"
                        value="Élevé"
                    />

                    <Metric
                        label="Stress hydrique"
                        value="Modéré"
                    />

                    <Metric
                        label="État des cultures"
                        value="Bon"
                    />

                    <Metric
                        label="Risque climatique"
                        value="Moyen"
                    />

                </div>

                <section>

                    <SectionTitle
                        icon={TrendingUp}
                        title="Synthèse"
                    />

                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        Cette section présentera progressivement
                        une analyse croisée du climat, des sols,
                        de l'agriculture, de l'eau, des
                        infrastructures et des risques.
                    </p>

                </section>

                <button className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700">
                    Générer une analyse détaillée
                </button>

            </div>
        </aside>
    );
};

/* =========================================================
   PANNEAU RISQUES
========================================================= */

const RiskPanel = ({
                       onClose,
                   }) => {
    const risks = [
        {
            name: "Sécheresse",
            level: "Modéré",
            icon: AlertTriangle,
        },
        {
            name: "Inondation",
            level: "Faible",
            icon: Waves,
        },
        {
            name: "Stress thermique",
            level: "Élevé",
            icon: Thermometer,
        },
        {
            name: "Stress hydrique",
            level: "Modéré",
            icon: Droplets,
        },
    ];

    return (
        <aside className="absolute bottom-20 right-4 top-20 z-40 w-[360px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                <div>

                    <p className="text-[10px] font-semibold uppercase text-gray-400">
                        Surveillance
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                        Risques
                    </h2>

                </div>

                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <X size={18} />
                </button>

            </div>

            <div className="space-y-3 p-5">

                {risks.map((risk) => {
                    const Icon = risk.icon;

                    return (
                        <div
                            key={risk.name}
                            className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
                        >

                            <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
                                    <Icon size={17} />
                                </div>

                                <span className="text-sm font-medium text-gray-700">
                  {risk.name}
                </span>

                            </div>

                            <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                {risk.level}
              </span>

                        </div>
                    );
                })}

            </div>
        </aside>
    );
};

/* =========================================================
   PANNEAU HISTORIQUE
========================================================= */

const HistoryPanel = ({
                          onClose,
                      }) => {
    return (
        <aside className="absolute bottom-20 right-4 top-20 z-40 w-[390px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                <div>

                    <p className="text-[10px] font-semibold uppercase text-gray-400">
                        Évolution temporelle
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                        Historique
                    </h2>

                </div>

                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <X size={18} />
                </button>

            </div>

            <div className="space-y-5 p-5">

                <SelectField
                    label="Période de comparaison"
                    value="2022 - 2026"
                    onChange={() => {}}
                    options={[
                        "2022 - 2026",
                        "2021 - 2026",
                        "2016 - 2026",
                        "2006 - 2026",
                    ]}
                />

                <div className="space-y-3">

                    {[
                        ["2022", "Situation initiale"],
                        ["2023", "Évolution"],
                        ["2024", "Évolution"],
                        ["2025", "Évolution"],
                        ["2026", "Situation actuelle"],
                    ].map(([year, label]) => (
                        <div
                            key={year}
                            className="flex items-center gap-4 rounded-xl bg-gray-50 p-3"
                        >

              <span className="text-sm font-bold text-green-600">
                {year}
              </span>

                            <span className="text-sm text-gray-600">
                {label}
              </span>

                        </div>
                    ))}

                </div>

                <p className="text-xs leading-relaxed text-gray-500">
                    L'historique permettra de comparer les
                    précipitations, rendements, surfaces cultivées,
                    infrastructures, risques, NDVI et autres
                    indicateurs sur plusieurs années.
                </p>

            </div>
        </aside>
    );
};

/* =========================================================
   PANNEAU SATELLITE
========================================================= */

const SatellitePanel = ({
                            onClose,
                            visualization,
                            setVisualization,
                        }) => {
    return (
        <aside className="absolute bottom-20 right-4 top-20 z-40 w-[360px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                <div>

                    <p className="text-[10px] font-semibold uppercase text-gray-400">
                        Télédétection
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                        Satellite
                    </h2>

                </div>

                <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <X size={18} />
                </button>

            </div>

            <div className="space-y-3 p-5">

                {[
                    ["ndvi", "NDVI", "État de la végétation"],
                    ["evi", "EVI", "Indice de végétation amélioré"],
                    ["ndwi", "NDWI", "Eau et humidité"],
                    [
                        "land-temperature",
                        "Température de surface",
                        "Température de la surface terrestre",
                    ],
                ].map(([id, label, description]) => (

                    <button
                        key={id}
                        onClick={() =>
                            setVisualization((previous) => ({
                                ...previous,
                                variable: id,
                            }))
                        }
                        className={`w-full rounded-xl border p-4 text-left transition ${
                            visualization.variable === id
                                ? "border-purple-200 bg-purple-50"
                                : "border-gray-100 hover:bg-gray-50"
                        }`}
                    >

                        <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                <Satellite size={17} />
                            </div>

                            <div>

                                <p className="text-sm font-semibold text-gray-800">
                                    {label}
                                </p>

                                <p className="mt-0.5 text-xs text-gray-400">
                                    {description}
                                </p>

                            </div>

                        </div>

                    </button>

                ))}

            </div>
        </aside>
    );
};

/* =========================================================
   NAVIGATION INFÉRIEURE
========================================================= */

const BottomNavigation = ({
                              activeView,
                              setActiveView,
                          }) => {
    const items = [
        {
            id: "map",
            label: "Carte",
            icon: Map,
        },
        {
            id: "filters",
            label: "Filtres",
            icon: Filter,
        },
        {
            id: "analysis",
            label: "Analyse",
            icon: BarChart3,
        },
        {
            id: "risks",
            label: "Risques",
            icon: AlertTriangle,
        },
        {
            id: "history",
            label: "Historique",
            icon: TrendingUp,
        },
        {
            id: "satellite",
            label: "Satellite",
            icon: Satellite,
        },
        {
            id: "layers",
            label: "Couches",
            icon: Layers,
        },
        {
            id: "visualization",
            label: "Visualisation",
            icon: Activity,
        },
    ];

    return (
        <nav className="absolute bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">

            {items.map((item) => {
                const Icon = item.icon;

                const isActive =
                    activeView === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() =>
                            setActiveView(item.id)
                        }
                        className={`flex min-w-[75px] shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 transition ${
                            isActive
                                ? "bg-green-50 text-green-600"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                    >

                        <Icon size={18} />

                        <span className="text-[10px] font-medium">
              {item.label}
            </span>

                    </button>
                );
            })}

        </nav>
    );
};

/* =========================================================
   DASHBOARD PRINCIPAL
========================================================= */

const Dashboard = () => {
    /* =======================================================
       ZONE SÉLECTIONNÉE
    ======================================================= */

    const [selectedZone, setSelectedZone] =
        useState(null);

    /* =======================================================
       ZOOM
    ======================================================= */

    const [zoom, setZoom] = useState(6);

    /* =======================================================
       VUE ACTIVE
    ======================================================= */

    const [activeView, setActiveView] =
        useState("map");

    /* =======================================================
       COUCHES ACTIVES
    ======================================================= */

    const [activeLayers, setActiveLayers] =
        useState({
            /* Administration */
            regions: true,
            departments: false,
            communes: false,
            villages: false,

            /* Agriculture */
            "cultivated-zones": true,
            parcels: false,
            "irrigated-zones": false,
            "agricultural-zones": false,

            /* Hydrologie */
            rivers: false,
            lakes: false,
            dams: false,
            groundwater: false,
            watersheds: false,

            /* Sols */
            "soil-types": false,
            "soil-texture": false,
            "soil-fertility": false,
            "soil-salinity": false,
            "soil-erosion": false,

            /* Infrastructure */
            markets: false,
            storage: false,
            processing: false,
            "weather-stations": false,
            boreholes: false,
            roads: false,

            /* Climat */
            "weather-stations-climate": false,
            "climate-zones": false,

            /* Satellite */
            sentinel: false,
            landsat: false,
        });

    /* =======================================================
       FILTRES
    ======================================================= */

    const [filters, setFilters] =
        useState(defaultFilters);

    /* =======================================================
       VISUALISATION
    ======================================================= */

    const [visualization, setVisualization] =
        useState({
            variable: "none",
            mode: "choropleth",
            opacity: 70,
        });

    /* =======================================================
       RECHERCHE
    ======================================================= */

    const handleSearch = (event) => {
        const value = event.target.value;

        if (!value) return;

        /*
          Plus tard :

          Recherche géographique :

          React
            ↓
          FastAPI
            ↓
          PostGIS
            ↓
          Région / commune / village / infrastructure
        */

        console.log("Recherche :", value);
    };

    /* =======================================================
       POSITION
    ======================================================= */

    const handleLocation = () => {
        console.log(
            "Recherche de la position actuelle..."
        );
    };

    /* =======================================================
       APPLICATION FILTRES
    ======================================================= */

    const handleApplyFilters = () => {
        console.log(
            "Filtres appliqués :",
            filters
        );

        /*
          Architecture future :

          Filtres
             ↓
          FastAPI
             ↓
          PostgreSQL / PostGIS
             ↓
          Données filtrées
             ↓
          MapLibre
        */
    };

    /* =======================================================
       RESET FILTRES
    ======================================================= */

    const handleResetFilters = () => {
        setFilters(defaultFilters);
    };

    /* =======================================================
       CHANGEMENT DE VUE
    ======================================================= */

    const handleChangeView = (view) => {
        setActiveView(view);
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-100">

            {/* ===================================================
          HEADER
      =================================================== */}

            <DashboardHeader
                onSearch={handleSearch}
            />

            {/* ===================================================
          CARTE
      =================================================== */}

            <LocationMapDashboard
                zoom={zoom}
                setZoom={setZoom}
                onLocation={handleLocation}
                onSelectZone={setSelectedZone}
                activeLayers={activeLayers}
                filters={filters}
                visualization={visualization}
            />

            {/* ===================================================
          FILTRES
      =================================================== */}

            {activeView === "filters" && (
                <FilterPanel
                    filters={filters}
                    setFilters={setFilters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    onClose={() =>
                        setActiveView("map")
                    }
                />
            )}

            {/* ===================================================
          COUCHES
      =================================================== */}

            {activeView === "layers" && (
                <LayerPanel
                    activeLayers={activeLayers}
                    setActiveLayers={setActiveLayers}
                    onClose={() =>
                        setActiveView("map")
                    }
                />
            )}

            {/* ===================================================
          VISUALISATION
      =================================================== */}

            {activeView === "visualization" && (
                <VisualizationPanel
                    visualization={visualization}
                    setVisualization={setVisualization}
                    onClose={() =>
                        setActiveView("map")
                    }
                />
            )}

            {/* ===================================================
          ANALYSE
      =================================================== */}

            {activeView === "analysis" && (
                <AnalysisPanel
                    selectedZone={selectedZone}
                    onClose={() =>
                        setActiveView("map")
                    }
                />
            )}

            {/* ===================================================
          RISQUES
      =================================================== */}

            {activeView === "risks" && (
                <RiskPanel
                    onClose={() =>
                        setActiveView("map")
                    }
                />
            )}

            {/* ===================================================
          HISTORIQUE
      =================================================== */}

            {activeView === "history" && (
                <HistoryPanel
                    onClose={() =>
                        setActiveView("map")
                    }
                />
            )}

            {/* ===================================================
          SATELLITE
      =================================================== */}

            {activeView === "satellite" && (
                <SatellitePanel
                    visualization={visualization}
                    setVisualization={setVisualization}
                    onClose={() =>
                        setActiveView("map")
                    }
                />
            )}

            {/* ===================================================
          INFORMATIONS ZONE
      =================================================== */}

            <ZoneInformationPanel
                zone={selectedZone}
                onClose={() =>
                    setSelectedZone(null)
                }
            />

            {/* ===================================================
          NAVIGATION PRINCIPALE
      =================================================== */}

            <BottomNavigation
                activeView={activeView}
                setActiveView={handleChangeView}
            />

        </div>
    );
};

export default Dashboard;