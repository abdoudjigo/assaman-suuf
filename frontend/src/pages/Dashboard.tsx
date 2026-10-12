import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Code2,
    Database,
    RefreshCw,
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
| NOUVEAUX COMPOSANTS (MapLibre + dashboard en direct)
|--------------------------------------------------------------------------
*/
import AgroMap from "../components/AgroMap.tsx";
import ZoneDashboard from "../components/ZoneDashboard.tsx";
import { toZoneValues } from "../components/useZoneData.ts";

import { ApiResultsPanel, DashboardMapsServices, type ApiLogEntry } from "../components/DashboardApiPanels.tsx";

import {
    defaultFilters, layerCategories, baseMaps, layerPresets,
    flattenLayers, allLayers, getLayerById, initialActiveLayers, initialLayerSettings,
} from "../components/dashboard/dashboardConfig.ts";

/*
|--------------------------------------------------------------------------
| PILE DES COUCHES ACTIVES
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
        <div className="absolute bottom-24 left-[20rem] z-20 hidden w-56 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur-xl lg:block">
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
| CARTE (MapLibre GL JS)
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
                                  values,
                                  onRemoveLayer,
                                  onLocate,
                                  onHandleUserProfile,
                                  onHandleUserSettings,
                                  onHandleUserBells,
                                  onHandleUserOthersOptions,
                                  onQueryApi,
                                  apiLoading,
                              }) {
    return (
        <main className="absolute inset-0 overflow-hidden bg-slate-200">
            <AgroMap
                selectedZone={selectedZone}
                onSelectZone={onSelectZone}
                baseMap={baseMap}
                activeLayerIds={activeLayerIds}
                layerSettings={layerSettings}
                values={values}
                zoom={zoom}
                setZoom={setZoom}
            />

            <MapControls
                zoom={zoom}
                setZoom={setZoom}
                onLocate={onLocate}
                baseMap={baseMap}
                onOpenBaseMap={onOpenBaseMap}
            />

            <button
                type="button"
                onClick={onQueryApi}
                disabled={apiLoading}
                title={apiLoading ? "Interrogation de l'API en cours" : "Interroger l'API des zones"}
                aria-label={apiLoading ? "Interrogation de l'API en cours" : "Interroger l'API des zones"}
                className={`absolute bottom-36 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/95 text-slate-700 shadow-xl backdrop-blur transition hover:bg-green-50 hover:text-green-800 disabled:cursor-wait disabled:opacity-70 ${
                    selectedZone ? "right-4 lg:right-[25rem]" : "right-4"
                }`}
            >
                {apiLoading ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
            </button>

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
                <ZoneDashboard
                    zone={selectedZone}
                    onClose={() => onSelectZone(null)}
                />
            )}
        </main>
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
                                            onClick={() => moveLayer(layerId, "up")}
                                            className="rounded-lg bg-white px-2 text-slate-500 disabled:opacity-30"
                                            title="Monter"
                                        >
                                            <MoveUp size={13} />
                                        </button>

                                        <button
                                            disabled={index === activeLayerIds.length - 1}
                                            onClick={() => moveLayer(layerId, "down")}
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
                        const expanded = expandedCategories[category.id];

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
                                                    onClick={() => toggleLayer(layer.id)}
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
                <RiskRow title="Sécheresse" value="Moyen" level="medium" />
                <RiskRow title="Inondation" value="Faible" level="low" />
                <RiskRow title="Stress thermique" value="Élevé" level="high" />
                <RiskRow title="Stress hydrique" value="Moyen" level="medium" />
                <RiskRow title="Risque phytosanitaire" value="À surveiller" level="medium" />
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
                        <Satellite size={17} className="text-purple-600" />

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
| PANNEAU DE FOND DE CARTE
|--------------------------------------------------------------------------
*/

function BaseMapPanel({ baseMap, setBaseMap, onClose }) {
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
                            <Icon size={20} className="mx-auto" />

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

    const [filters, setFilters] = useState(defaultFilters);

    const [activeLayers, setActiveLayers] = useState(initialActiveLayers);

    const [layerSettings, setLayerSettings] = useState(initialLayerSettings);

    const [activeLayerOrder, setActiveLayerOrder] = useState(
        Object.keys(initialActiveLayers).filter(
            (id) => initialActiveLayers[id]
        )
    );

    const activeLayerIds = activeLayerOrder.filter(
        (id) => activeLayers[id]
    );

    const [resultsOpen, setResultsOpen] = useState(false);
    const [apiConsoleOpen, setApiConsoleOpen] = useState(false);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [apiResults, setApiResults] = useState<unknown>(null);
    const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);

    // Valeurs par région utilisées pour colorer la carte (API ou démonstration)
    const values = useMemo(() => toZoneValues(apiResults), [apiResults]);

    // silent = true : chargement automatique, sans ouvrir les panneaux de résultats
    const handleQueryZones = async (silent = false) => {
        const endpoint = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/v1/zones`;
        const startedAt = performance.now();
        setApiLoading(true);
        setApiError(null);

        if (!silent) {
            setResultsOpen(true);
            setApiConsoleOpen(true);
        }

        try {
            const response = await fetch(endpoint, {
                method: "GET",
                headers: { Accept: "application/json" },
            });
            const durationMs = Math.round(performance.now() - startedAt);
            const responseText = await response.text();
            let payload: unknown = null;

            try {
                payload = responseText ? JSON.parse(responseText) : null;
            } catch {
                payload = responseText;
            }

            if (!response.ok) {
                const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
                throw new Error(`HTTP ${response.status} — ${detail || response.statusText}`);
            }

            setApiResults(payload);
            setApiLogs((current) => [{
                id: `${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                method: "GET",
                endpoint,
                status: response.status,
                durationMs,
                message: "Requête exécutée avec succès",
            }, ...current].slice(0, 50));
        } catch (error) {
            const durationMs = Math.round(performance.now() - startedAt);
            const message = error instanceof Error ? error.message : "Erreur inconnue pendant la requête";
            setApiError(message);
            setApiLogs((current) => [{
                id: `${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                method: "GET",
                endpoint,
                status: "ERROR",
                durationMs,
                message,
            }, ...current].slice(0, 50));
        } finally {
            setApiLoading(false);
        }
    };

    // Chargement initial des zones (silencieux)
    useEffect(() => {
        handleQueryZones(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                return <RiskPanel onClose={() => setActiveView(null)} />;

            case "history":
                return <HistoryPanel onClose={() => setActiveView(null)} />;

            case "satellite":
                return <SatellitePanel onClose={() => setActiveView(null)} />;

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 text-slate-900">
            <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-slate-200">
                <DashboardHeader
                    onOpenSearch={() => setActiveView("filters")}
                />

                <LocationMapDashboard
                    selectedZone={selectedZone}
                    onSelectZone={setSelectedZone}
                    zoom={zoom}
                    setZoom={setZoom}
                    baseMap={baseMap}
                    onOpenBaseMap={() => setActiveView("base-map")}
                    activeLayerIds={activeLayerIds}
                    layerSettings={layerSettings}
                    values={values}
                    onRemoveLayer={handleRemoveLayer}
                    onLocate={handleLocate}
                    onHandleUserProfile={handleUserProfile}
                    onHandleUserSettings={handleUserSettings}
                    onHandleUserBells={handleUserBells}
                    onHandleUserOthersOptions={handleUserOthersOptions}
                    onQueryApi={() => handleQueryZones()}
                    apiLoading={apiLoading}
                />

                {activeView === "base-map" && (
                    <BaseMapPanel
                        baseMap={baseMap}
                        setBaseMap={setBaseMap}
                        onClose={() => setActiveView(null)}
                    />
                )}

                {renderPanel()}

                <ApiResultsPanel
                    open={resultsOpen}
                    loading={apiLoading}
                    error={apiError}
                    data={apiResults}
                    logs={apiLogs}
                    consoleOpen={apiConsoleOpen}
                    onToggleConsole={() => setApiConsoleOpen((open) => !open)}
                    onClose={() => setResultsOpen(false)}
                    onRefresh={() => handleQueryZones()}
                />

                <BottomNavigation
                    activeView={activeView}
                    setActiveView={setActiveView}
                    activeLayerCount={activeLayerIds.length}
                />
            </section>

            <DashboardMapsServices
                loading={apiLoading}
                error={apiError}
                data={apiResults}
                logs={apiLogs}
                onRefresh={() => handleQueryZones()}
            />
        </div>
    );
}
