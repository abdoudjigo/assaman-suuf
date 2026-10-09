import { useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Droplets,
  Filter,
  Layers,
  LocateFixed,
  Map,
  MapPinned,
  Menu,
  Minus,
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
   DONNÉES DES COUCHES
========================================================= */

const mapLayers = [
  {
    id: "climat",
    label: "Climat",
    icon: CloudRain,
    color: "text-blue-600",
    layers: [
      {
        id: "rainfall",
        label: "Précipitations",
        icon: CloudRain,
      },
      {
        id: "temperature",
        label: "Température",
        icon: Thermometer,
      },
      {
        id: "humidity",
        label: "Humidité",
        icon: Droplets,
      },
      {
        id: "wind",
        label: "Vent",
        icon: Wind,
      },
      {
        id: "solar",
        label: "Rayonnement solaire",
        icon: Sun,
      },
      {
        id: "evapotranspiration",
        label: "Évapotranspiration",
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
        id: "cultures",
        label: "Zones cultivées",
        icon: Sprout,
      },
      {
        id: "yield",
        label: "Rendements",
        icon: TrendingUp,
      },
      {
        id: "production",
        label: "Production agricole",
        icon: BarChart3,
      },
      {
        id: "irrigation",
        label: "Zones irriguées",
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
        icon: Mountain,
      },
      {
        id: "soil-fertility",
        label: "Fertilité",
        icon: Sprout,
      },
      {
        id: "soil-salinity",
        label: "Salinité",
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
        icon: Waves,
      },
      {
        id: "lakes",
        label: "Lacs et retenues",
        icon: Waves,
      },
      {
        id: "groundwater",
        label: "Nappes phréatiques",
        icon: Droplets,
      },
      {
        id: "water-availability",
        label: "Disponibilité en eau",
        icon: Droplets,
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
        id: "ndvi",
        label: "NDVI",
        icon: Satellite,
      },
      {
        id: "evi",
        label: "EVI",
        icon: Satellite,
      },
      {
        id: "ndwi",
        label: "NDWI",
        icon: Waves,
      },
      {
        id: "land-temperature",
        label: "Température de surface",
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
        icon: AlertTriangle,
      },
      {
        id: "flood",
        label: "Inondation",
        icon: Waves,
      },
      {
        id: "heat",
        label: "Stress thermique",
        icon: Thermometer,
      },
      {
        id: "phytosanitary",
        label: "Risques phytosanitaires",
        icon: Sprout,
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
        icon: MapPinned,
      },
      {
        id: "storage",
        label: "Stockage",
        icon: MapPinned,
      },
      {
        id: "processing",
        label: "Transformation",
        icon: MapPinned,
      },
      {
        id: "weather-stations",
        label: "Stations météo",
        icon: CloudRain,
      },
    ],
  },
];

/* =========================================================
   COMPOSANT : HEADER
========================================================= */

const DashboardHeader = ({ onSearch }) => {
  return (
    <header className="absolute left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
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

        {/* Recherche */}
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

        {/* Actions */}
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
   COMPOSANT : MENU DES COUCHES
========================================================= */

const MenuFilterDashboard = ({
  activeCategory,
  setActiveCategory,
  activeLayers,
  setActiveLayers,
}) => {
  const [isOpen, setIsOpen] = useState(true);

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
    <aside
      className={`absolute bottom-20 left-4 top-20 z-40 flex transition-all duration-300 ${
  isOpen ? "w-80" : "w-14"
}`}
    >
      {/* Bouton principal */}
      <div className="flex h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur">
        {/* Catégories */}
        <div
          className={`flex flex-col border-r border-gray-200 bg-gray-50 ${
  isOpen ? "w-16" : "w-14"
}`}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-14 items-center justify-center border-b border-gray-200 text-gray-600 hover:bg-white"
          >
            {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>

          {isOpen &&
            mapLayers.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  title={category.label}
                  className={`flex flex-col items-center gap-1 px-1 py-3 text-[10px] transition ${
  activeCategory === category.id
      ? "bg-white font-semibold text-green-600"
      : "text-gray-500 hover:bg-white hover:text-gray-800"
}`}
                >
                  <Icon size={19} />
                  <span>{category.label}</span>
                </button>
              );
            })}
        </div>

        {/* Sous-couches */}
        {isOpen && currentCategory && (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <div>
                <p className="text-xs text-gray-400">COUCHES</p>

                <h2 className="mt-0.5 text-sm font-semibold text-gray-900">
                  {currentCategory.label}
                </h2>
              </div>

              <Layers
                size={18}
                className={currentCategory.color}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {currentCategory.layers.map((layer) => {
                const Icon = layer.icon;
                const isActive = activeLayers[layer.id];

                return (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className="mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={
                          isActive
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      />

                      <span className="text-sm text-gray-700">
                        {layer.label}
                      </span>
                    </div>

                    <div
                      className={`h-5 w-9 rounded-full p-0.5 transition ${
  isActive
      ? "bg-green-500"
      : "bg-gray-200"
}`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white shadow transition ${
  isActive ? "translate-x-4" : "translate-x-0"
}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

/* =========================================================
   COMPOSANT : CARTE
========================================================= */

const LocationMapDashboard = ({
  zoom,
  setZoom,
  onLocation,
  onSelectZone,
}) => {
  return (
    <main className="absolute inset-0 overflow-hidden bg-[#e8eee7] pt-16">
      {/* Placeholder carte */}

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(230,238,230,0.55), rgba(220,232,220,0.65)), url('/images/senegal-map.png')",
        }}
      >
        {/* Zone interactive exemple */}
        <button
          onClick={() => onSelectZone("Kaffrine")}
          className="absolute left-[48%] top-[52%] h-8 w-8 rounded-full border-4 border-white bg-green-600 shadow-lg transition hover:scale-125"
          title="Kaffrine"
        />

        <button
          onClick={() => onSelectZone("Kaolack")}
          className="absolute left-[43%] top-[60%] h-8 w-8 rounded-full border-4 border-white bg-orange-500 shadow-lg transition hover:scale-125"
          title="Kaolack"
        />

        <button
          onClick={() => onSelectZone("Saint-Louis")}
          className="absolute left-[47%] top-[27%] h-8 w-8 rounded-full border-4 border-white bg-blue-500 shadow-lg transition hover:scale-125"
          title="Saint-Louis"
        />
      </div>

      {/* Barre de recherche mobile */}
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

      {/* Contrôles carte */}
      <div className="absolute right-4 top-24 z-30 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        <button
          onClick={() => setZoom((value) => value + 1)}
          className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-50"
          title="Zoom avant"
        >
          <ZoomIn size={19} />
        </button>

        <button
          onClick={() => setZoom((value) => Math.max(1, value - 1))}
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

      {/* Zoom indicator */}
      <div className="absolute bottom-24 right-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow">
        Zoom {zoom}
      </div>

      {/* Légende */}
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

const LegendItem = ({ color, label }) => {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
};

/* =========================================================
   PANNEAU DE ZONE
========================================================= */

const ZoneInformationPanel = ({ zone, onClose }) => {
  if (!zone) return null;

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

  const data = zoneData[zone];

  return (
    <aside className="absolute bottom-20 right-4 top-20 z-40 w-[340px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
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
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5 p-5">
        {/* Climat */}
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

        {/* Risques */}
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

        {/* Agriculture */}
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

        {/* Action */}
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

const SectionTitle = ({ icon: Icon, title }) => {
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

const Metric = ({ label, value }) => {
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
   BARRE INFÉRIEURE
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
      id: "analysis",
      label: "Analyse",
      icon: BarChart3,
    },
    {
      id: "history",
      label: "Historique",
      icon: TrendingUp,
    },
    {
      id: "alerts",
      label: "Alertes",
      icon: AlertTriangle,
    },
  ];

  return (
    <nav className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-4 py-2 transition ${
  isActive
      ? "bg-green-50 text-green-600"
      : "text-gray-500 hover:bg-gray-50"
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
   DASHBOARD
========================================================= */

const Dashboard = () => {
  const [activeCategory, setActiveCategory] =
    useState("climat");

  const [activeLayers, setActiveLayers] = useState({
    rainfall: true,
    temperature: false,
    humidity: false,
    wind: false,
    solar: false,
    evapotranspiration: false,

    cultures: true,
    yield: false,
    production: false,
    irrigation: false,

    "soil-type": false,
    "soil-fertility": false,
    "soil-salinity": false,

    rivers: false,
    lakes: false,
    groundwater: false,
    "water-availability": false,

    ndvi: false,
    evi: false,
    ndwi: false,
    "land-temperature": false,

    drought: false,
    flood: false,
    heat: false,
    phytosanitary: false,

    markets: false,
    storage: false,
    processing: false,
    "weather-stations": false,
  });

  const [selectedZone, setSelectedZone] = useState(null);

  const [zoom, setZoom] = useState(6);

  const [activeView, setActiveView] = useState("map");

  const handleSearch = (event) => {
    const value = event.target.value;

    if (!value) return;

    // Ici tu pourras connecter ton moteur de recherche géographique.
    console.log("Recherche :", value);
  };

  const handleLocation = () => {
    console.log("Recherche de la position actuelle...");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-100">
      {/* HEADER */}
      <DashboardHeader onSearch={handleSearch} />

      {/* CARTE */}
      <LocationMapDashboard
        zoom={zoom}
        setZoom={setZoom}
        onLocation={handleLocation}
        onSelectZone={setSelectedZone}
      />

      {/* MENU DES COUCHES */}
      <MenuFilterDashboard
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
      />

      {/* PANNEAU ZONE */}
      <ZoneInformationPanel
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
      />

      {/* NAVIGATION BASSE */}
      <BottomNavigation
        activeView={activeView}
        setActiveView={setActiveView}
      />
    </div>
  );
};

export default Dashboard;