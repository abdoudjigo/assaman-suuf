import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import AppNav from "../components/layout/AppNav";
import MapFilters from "../components/maps/MapFilters";
import MapLegend from "../components/maps/MapLegend";
import RegionDetails from "../components/maps/RegionDetails";
import HachuresDefs from "../components/maps/HachuresDefs";
import { estDisponible, INDICATEUR_PAR_DEFAUT, STYLE_HACHURES } from "../config/mapIndicators";
import { useCartographie, useRegionsGeo, useStations } from "../hooks/useCartographieData";
import { useRegionLayer, useStationLayer } from "../hooks/useMapLayers";
import { formatEvolution, formatValeur, type CarteFiltres } from "../utils/cartographieAggregates";
import {
    Activity, AlertTriangle, BarChart3, Bell, Building2, Check, ChevronDown,
    CloudRain, Droplets, Filter, Gauge, Layers, LocateFixed,
    Map as MapIcon, MapPinned, Minus, Mountain, MoveDown, MoveUp, Plus,
    Search, Settings2, Satellite, SlidersHorizontal, Sprout, Sun, Thermometer,
    TrendingUp, UserRound, Waves, Wind, X,
} from "lucide-react";

/**
 * DashboardMap — carte interactive Assaman-Suuf (version Leaflet).
 * Les 14 régions (public/data/senegal-regions.geojson) sont colorées selon
 * l'indicateur choisi, agrégé côté client depuis l'API (voir useCartographie) ;
 * les stations climatiques sont positionnées sur la carte.
 * Les autres couches du catalogue restent à connecter.
 */

type Panel = "layers" | "filters" | "analysis" | "alerts" | "history" | "satellite" | "profile" | "settings" | "notifications" | "more" | null;
type LayerDefinition = {
    id: string; label: string; description: string; category: string;
    icon: typeof Layers; color: string;
};

const layerCategories: { id: string; label: string; icon: typeof Layers; layers: LayerDefinition[] }[] = [
    { id: "geography", label: "Limites géographiques", icon: MapPinned, layers: [
            { id: "regions", label: "Régions", description: "Limites administratives régionales", category: "geography", icon: MapPinned, color: "#64748b" },
            { id: "departments", label: "Départements", description: "Limites des départements", category: "geography", icon: MapPinned, color: "#64748b" },
            { id: "agricultural-zones", label: "Zones agricoles", description: "Zones de production", category: "geography", icon: Sprout, color: "#16a34a" },
        ]},
    { id: "climate", label: "Climat", icon: CloudRain, layers: [
            { id: "rainfall", label: "Précipitations", description: "Répartition des précipitations", category: "climate", icon: CloudRain, color: "#0284c7" },
            { id: "temperature", label: "Température", description: "Température de surface / air", category: "climate", icon: Thermometer, color: "#ea580c" },
            { id: "humidity", label: "Humidité", description: "Humidité relative", category: "climate", icon: Droplets, color: "#0891b2" },
            { id: "wind", label: "Vent", description: "Direction et intensité du vent", category: "climate", icon: Wind, color: "#64748b" },
            { id: "solar", label: "Rayonnement solaire", description: "Potentiel solaire", category: "climate", icon: Sun, color: "#ca8a04" },
            { id: "evapotranspiration", label: "Évapotranspiration", description: "Évapotranspiration estimée", category: "climate", icon: Activity, color: "#7c3aed" },
        ]},
    { id: "agriculture", label: "Agriculture", icon: Sprout, layers: [
            { id: "cultivated-zones", label: "Zones cultivées", description: "Emprises agricoles", category: "agriculture", icon: Sprout, color: "#16a34a" },
            { id: "crop-distribution", label: "Répartition des cultures", description: "Cultures dominantes", category: "agriculture", icon: Sprout, color: "#65a30d" },
            { id: "yield", label: "Rendements", description: "Rendement par territoire", category: "agriculture", icon: TrendingUp, color: "#15803d" },
            { id: "production", label: "Production agricole", description: "Volumes de production", category: "agriculture", icon: BarChart3, color: "#4d7c0f" },
            { id: "irrigated-zones", label: "Zones irriguées", description: "Zones agricoles irriguées", category: "agriculture", icon: Waves, color: "#0891b2" },
        ]},
    { id: "soil-water", label: "Sols et eau", icon: Mountain, layers: [
            { id: "soil-type", label: "Types de sols", description: "Classification des sols", category: "soil-water", icon: Mountain, color: "#a16207" },
            { id: "soil-fertility", label: "Fertilité des sols", description: "Indice de fertilité", category: "soil-water", icon: Sprout, color: "#65a30d" },
            { id: "rivers", label: "Cours d'eau", description: "Réseau hydrographique", category: "soil-water", icon: Waves, color: "#0284c7" },
            { id: "water-availability", label: "Disponibilité en eau", description: "Ressource en eau", category: "soil-water", icon: Droplets, color: "#0891b2" },
        ]},
    { id: "satellite", label: "Observation satellite", icon: Satellite, layers: [
            { id: "satellite-imagery", label: "Imagerie satellite", description: "Fond d'imagerie", category: "satellite", icon: Satellite, color: "#7c3aed" },
            { id: "ndvi", label: "NDVI", description: "Indice de végétation", category: "satellite", icon: Satellite, color: "#16a34a" },
            { id: "evi", label: "EVI", description: "Indice de végétation amélioré", category: "satellite", icon: Satellite, color: "#65a30d" },
            { id: "ndwi", label: "NDWI", description: "Indice différentiel de l'eau", category: "satellite", icon: Waves, color: "#0284c7" },
            { id: "land-surface-temperature", label: "Température de surface", description: "Température terrestre", category: "satellite", icon: Thermometer, color: "#ea580c" },
        ]},
    { id: "risks", label: "Risques", icon: AlertTriangle, layers: [
            { id: "drought", label: "Sécheresse", description: "Indice de risque de sécheresse", category: "risks", icon: AlertTriangle, color: "#dc2626" },
            { id: "flood", label: "Inondations", description: "Zones exposées aux inondations", category: "risks", icon: Waves, color: "#2563eb" },
            { id: "heat-stress", label: "Stress thermique", description: "Exposition aux fortes chaleurs", category: "risks", icon: Thermometer, color: "#ea580c" },
            { id: "water-stress", label: "Stress hydrique", description: "Pression sur la ressource en eau", category: "risks", icon: Droplets, color: "#0891b2" },
        ]},
    { id: "infrastructure", label: "Infrastructures", icon: Building2, layers: [
            { id: "markets", label: "Marchés agricoles", description: "Localisation des marchés", category: "infrastructure", icon: Building2, color: "#c2410c" },
            { id: "weather-stations", label: "Stations météo", description: "Stations de mesure", category: "infrastructure", icon: CloudRain, color: "#0284c7" },
            { id: "boreholes", label: "Forages", description: "Points d'accès à l'eau", category: "infrastructure", icon: Droplets, color: "#0891b2" },
            { id: "roads", label: "Routes", description: "Réseau routier", category: "infrastructure", icon: MapIcon, color: "#64748b" },
        ]},
    { id: "quantification", label: "Quantification et densité", icon: Gauge, layers: [
            { id: "exploitation-count", label: "Nombre d'exploitations", description: "Exploitations par zone", category: "quantification", icon: Building2, color: "#4f46e5" },
            { id: "production-volume", label: "Volume de production", description: "Volume spatial de production", category: "quantification", icon: BarChart3, color: "#4f46e5" },
            { id: "farm-density", label: "Densité des exploitations", description: "Concentration des exploitations", category: "quantification", icon: Activity, color: "#a21caf" },
        ]},
];

const flatLayers = layerCategories.flatMap((category) => category.layers);
// Couches réellement alimentées : "regions" (choroplèthe) et "weather-stations".
const initialActiveLayers: Record<string, boolean> = {
    regions: true, "weather-stations": true,
};

const FILTRES_INITIAUX: CarteFiltres = { indicateur: INDICATEUR_PAR_DEFAUT, annee: null, produit: null, systeme: null };

// Fonds de carte raster Esri : aucune clé API requise.
const baseMaps = [
    { id: "Clair", label: "Clair", icon: MapIcon,
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles © Esri — Sources: Esri, HERE, Garmin, OpenStreetMap contributors", subdomains: "" },
    { id: "Sombre", label: "Sombre", icon: MapIcon,
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles © Esri — Sources: Esri, HERE, Garmin, OpenStreetMap contributors", subdomains: "" },
    { id: "Terrain", label: "Terrain", icon: Mountain,
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap, SRTM · © OpenTopoMap", subdomains: "abc" },
    { id: "Satellite", label: "Satellite", icon: Satellite,
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Imagerie © Esri, Maxar, Earthstar Geographics", subdomains: "" },
];

function IconButton({ title, onClick, children, active = false }: { title: string; onClick: () => void; children: ReactNode; active?: boolean }) {
    return <button type="button" title={title} aria-label={title} onClick={onClick} className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition ${active ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-50"}`}>{children}</button>;
}

function PanelFrame({ title, subtitle, icon: Icon, onClose, children, wide = false }: { title: string; subtitle: string; icon: typeof Layers; onClose: () => void; children: ReactNode; wide?: boolean }) {
    return <aside className={`absolute bottom-20 left-4 top-24 z-30 flex max-h-[calc(100%-7rem)] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl ${wide ? "md:w-[470px]" : ""}`}>
        <header className="flex items-start gap-3 border-b border-slate-100 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700"><Icon size={19}/></div>
            <div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>
            <button type="button" onClick={onClose} aria-label="Fermer le panneau" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={17}/></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>;
}

export default function DashboardMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const tileRef = useRef<TileLayer | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState("");
    const [zoom, setZoom] = useState(5.5);
    const [panel, setPanel] = useState<Panel>(null);
    const [baseMap, setBaseMap] = useState("Clair");
    const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>(initialActiveLayers);
    const [layerOrder, setLayerOrder] = useState<string[]>(Object.keys(initialActiveLayers).filter((id) => initialActiveLayers[id]));
    const [opacity, setOpacity] = useState<Record<string, number>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ climate: true, agriculture: true });
    const [layerSearch, setLayerSearch] = useState("");
    const [activeOnly, setActiveOnly] = useState(false);
    const [selection, setSelection] = useState<string | null>(null);
    const [filtres, setFiltres] = useState<CarteFiltres>(FILTRES_INITIAUX);
    const [profileMenu, setProfileMenu] = useState(false);
    const [leafletMap, setLeafletMap] = useState<LeafletMap | null>(null);

    const activeLayerIds = useMemo(() => layerOrder.filter((id) => activeLayers[id]), [layerOrder, activeLayers]);

    const regionsGeo = useRegionsGeo();
    const stations = useStations();
    const carto = useCartographie(filtres);
    useRegionLayer(leafletMap, regionsGeo.data, carto, {
        visible: !!activeLayers.regions,
        opacite: (opacity.regions ?? 75) / 100,
        selection,
        onSelect: setSelection,
    });
    useStationLayer(leafletMap, stations.data, !!activeLayers["weather-stations"], setSelection);
    const classement = useMemo(
        () => [...(carto.regions?.values() ?? [])].sort((a, b) => (b.valeur ?? -Infinity) - (a.valeur ?? -Infinity)),
        [carto.regions],
    );

    // Création de la carte (une seule fois)
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;
        const map = L.map(mapContainer.current, {
            center: [14.5, -14.7],
            zoom: 5.5,
            zoomSnap: 0.5,
            minZoom: 4,
            maxZoom: 17,
            zoomControl: false,        // on utilise nos propres boutons +/−
            attributionControl: true,
        });
        mapRef.current = map;
        L.control.scale({ maxWidth: 100, metric: true, imperial: false, position: "bottomright" }).addTo(map);

        // Fond initial
        const first = baseMaps[0];
        const tiles = L.tileLayer(first.url, {
            attribution: first.attribution,
            subdomains: first.subdomains || "abc",
            maxZoom: 19,
        }).addTo(map);
        tiles.on("tileerror", () => setMapError("Certaines tuiles du fond de carte ne se chargent pas. Vérifie ta connexion."));
        tileRef.current = tiles;

        map.on("zoomend", () => setZoom(map.getZoom()));
        map.whenReady(() => {
            setMapReady(true);
            setLeafletMap(map); // les couches régions / stations s'y attachent
        });

        // Recalcule la taille si le conteneur change (panneaux, redimensionnement)
        const resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(mapContainer.current);

        return () => {
            resizeObserver.disconnect();
            setLeafletMap(null);
            map.remove();
            mapRef.current = null;
            tileRef.current = null;
        };
    }, []);

    // Changement de fond de carte : on remplace uniquement les tuiles,
    // les marqueurs restent en place.
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const chosen = baseMaps.find((item) => item.id === baseMap);
        if (!chosen) return;
        if (tileRef.current) map.removeLayer(tileRef.current);
        const tiles = L.tileLayer(chosen.url, {
            attribution: chosen.attribution,
            subdomains: chosen.subdomains || "abc",
            maxZoom: 19,
        }).addTo(map);
        tiles.bringToBack();
        tiles.on("tileerror", () => setMapError("Certaines tuiles du fond de carte ne se chargent pas. Vérifie ta connexion."));
        tileRef.current = tiles;
    }, [baseMap]);

    const changeBaseMap = useCallback((id: string) => setBaseMap(id), []);
    const toggleLayer = (id: string) => {
        setActiveLayers((current) => ({ ...current, [id]: !current[id] }));
        setLayerOrder((current) => activeLayers[id] ? current.filter((item) => item !== id) : [...current.filter((item) => item !== id), id]);
    };
    const removeLayer = (id: string) => {
        setActiveLayers((current) => ({ ...current, [id]: false }));
        setLayerOrder((current) => current.filter((item) => item !== id));
    };
    const clearLayers = () => {
        setActiveLayers({});
        setLayerOrder([]);
    };
    const applyPreset = (preset: string) => {
        const ids = preset === "Agriculture" ? ["cultivated-zones", "crop-distribution", "yield", "production", "irrigated-zones"] :
            preset === "Climat" ? ["rainfall", "temperature", "humidity", "wind", "evapotranspiration"] :
                preset === "Risques" ? ["drought", "flood", "heat-stress", "water-stress"] :
                    ["markets", "weather-stations", "boreholes", "exploitation-count"];
        setActiveLayers(Object.fromEntries(flatLayers.map((layer) => [layer.id, ids.includes(layer.id)])));
        setLayerOrder(ids);
    };
    const locate = () => {
        const map = mapRef.current;
        if (!map) return;
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => map.flyTo([position.coords.latitude, position.coords.longitude], 11),
                () => setMapError("Localisation refusée ou indisponible. Vérifie les autorisations du navigateur."),
                { enableHighAccuracy: true, timeout: 8000 },
            );
        } else setMapError("La géolocalisation n'est pas disponible dans ce navigateur.");
    };
    const zoomBy = (delta: number) => { const map = mapRef.current; if (map) map.setZoom(map.getZoom() + delta); };
    const filteredCategories = layerCategories.map((category) => ({
        ...category,
        layers: category.layers.filter((layer) =>
            (!layerSearch || `${layer.label} ${layer.description}`.toLowerCase().includes(layerSearch.toLowerCase())) &&
            (!activeOnly || !!activeLayers[layer.id])),
    })).filter((category) => category.layers.length > 0);

    return <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-slate-200 text-slate-900">
        {/* z-0 : isole les panneaux internes de Leaflet pour qu'ils restent sous l'interface */}
        <div ref={mapContainer} className="absolute inset-0 z-0" aria-label="Carte interactive du Sénégal"/>
        <HachuresDefs/>
        {regionsGeo.isError && <div role="alert" className="absolute left-1/2 top-36 z-40 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-red-700 shadow"><AlertTriangle size={15}/><span>{regionsGeo.error instanceof Error ? regionsGeo.error.message : String(regionsGeo.error)}</span><button onClick={() => regionsGeo.refetch()} className="font-semibold underline">Réessayer</button></div>}
        {!mapReady && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/70"><div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600 shadow">Chargement de la carte…</div></div>}
        {mapError && <div role="status" className="absolute left-1/2 top-24 z-40 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-amber-800 shadow"><AlertTriangle size={15}/><span>{mapError}</span><button onClick={() => setMapError("")} aria-label="Fermer"><X size={14}/></button></div>}

        {/* En-tête */}
        <header className="absolute left-4 right-4 top-4 z-20 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-lg backdrop-blur-xl md:left-6 md:right-6 md:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white"><Sprout size={21}/></div>
            <div className="min-w-0 flex-1"><h1 className="text-base font-extrabold tracking-tight text-slate-900 md:text-lg">Assaman-Suuf</h1><p className="truncate text-[11px] text-slate-500 md:text-xs">Plateforme de décision agroclimatique · Sénégal</p></div>
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Carte active</span>
            <AppNav className="hidden sm:flex"/>
            <div className="relative flex items-center gap-1">
                <IconButton title="Profil utilisateur" onClick={() => setPanel("profile")}><UserRound size={18}/></IconButton>
                <IconButton title="Paramètres" onClick={() => setPanel("settings")}><Settings2 size={18}/></IconButton>
                <IconButton title="Notifications" onClick={() => setPanel("notifications")}><Bell size={18}/></IconButton>
                <IconButton title="Autres options" onClick={() => setProfileMenu((value) => !value)}><span className="text-lg leading-none">···</span></IconButton>
                {profileMenu && <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {[["Historique", "history"], ["Observation satellite", "satellite"], ["À propos", "more"]].map(([label, id]) => <button key={id} onClick={() => { setPanel(id as Panel); setProfileMenu(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">{label}</button>)}
                </div>}
            </div>
        </header>

        {/* Commandes cartographiques */}
        <div className="absolute left-4 top-24 z-20 flex flex-col gap-2 md:left-6 md:top-28">
            <IconButton title="Ouvrir les couches" active={panel === "layers"} onClick={() => setPanel(panel === "layers" ? null : "layers")}><Layers size={18}/></IconButton>
            <IconButton title="Ouvrir les filtres" active={panel === "filters"} onClick={() => setPanel(panel === "filters" ? null : "filters")}><SlidersHorizontal size={18}/></IconButton>
            <IconButton title="Changer le fond de carte" active={panel === "satellite"} onClick={() => setPanel(panel === "satellite" ? null : "satellite")}><Satellite size={18}/></IconButton>
            <IconButton title="Me localiser" onClick={locate}><LocateFixed size={18}/></IconButton>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm">
                <button className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50" title="Zoom avant" onClick={() => zoomBy(1)}><Plus size={17}/></button>
                <div className="mx-2 border-t border-slate-100"/>
                <button className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50" title="Zoom arrière" onClick={() => zoomBy(-1)}><Minus size={17}/></button>
            </div>
        </div>

        {/* Résumé des couches actives */}
        {activeLayerIds.length > 0 && <div className="absolute bottom-24 left-4 z-10 hidden w-64 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur md:block">
            <div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-bold">Couches sélectionnées</p><p className="text-[10px] text-slate-500">{activeLayerIds.length} couche(s) dans la vue</p></div><Layers size={16} className="text-slate-400"/></div>
            <div className="space-y-1.5">{activeLayerIds.slice(0, 4).map((id) => {
                const layer = flatLayers.find((item) => item.id === id);
                if (!layer) return null;
                return <div key={id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layer.color }}/><span className="min-w-0 flex-1 truncate text-[11px] text-slate-700">{layer.label}</span><button onClick={() => removeLayer(id)} aria-label={`Retirer ${layer.label}`}><X size={13} className="text-slate-400 hover:text-red-500"/></button></div>;
            })}</div>
            {activeLayerIds.length > 4 && <p className="mt-2 text-center text-[10px] text-slate-400">+ {activeLayerIds.length - 4} autres couches</p>}
        </div>}

        <div className="absolute bottom-24 right-4 z-10 md:right-6">
            <MapLegend carto={carto} onEdit={() => setPanel("filters")} footer={<>Sénégal · Fond : {baseMap} · Zoom {zoom.toFixed(1)}</>}/>
        </div>

        {/* Navigation principale */}
        <nav className="absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-white/70 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl">
            {[
                { id: "layers", label: "Couches", icon: Layers },
                { id: "filters", label: "Filtres", icon: Filter },
                { id: "analysis", label: "Indicateurs", icon: BarChart3 },
                { id: "alerts", label: "Alertes", icon: AlertTriangle },
                { id: "history", label: "Historique", icon: Activity },
            ].map((item) => {
                const Icon = item.icon;
                const bientot = item.id === "alerts" && !estDisponible("alertes");
                return <button key={item.id} disabled={bientot} title={bientot ? "Bientôt disponible" : item.label} onClick={() => setPanel(panel === item.id ? null : item.id as Panel)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:text-slate-300 ${panel === item.id ? "bg-green-700 text-white" : "text-slate-600 hover:bg-slate-100 disabled:hover:bg-transparent"}`}><Icon size={15}/><span className="hidden sm:inline">{item.label}</span>{bientot && <span className="hidden rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 sm:inline">Bientôt</span>}</button>;
            })}
        </nav>

        {/* Panneau Couches */}
        {panel === "layers" && <PanelFrame title="Couches cartographiques" subtitle="Choisis les données à représenter sur la carte" icon={Layers} onClose={() => setPanel(null)} wide>
            <div className="rounded-xl border border-green-100 bg-green-50 p-3"><p className="text-xs font-bold text-green-900">Vues prédéfinies</p><div className="mt-2 grid grid-cols-2 gap-2">{["Agriculture", "Climat", "Risques", "Aide à la décision"].map((preset) => <button key={preset} onClick={() => applyPreset(preset)} className="rounded-lg border border-green-100 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-green-400">{preset}</button>)}</div></div>
            <div className="mt-4 flex gap-2"><div className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={layerSearch} onChange={(e) => setLayerSearch(e.target.value)} placeholder="Rechercher une couche…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-green-500"/></div><button onClick={() => setActiveOnly((value) => !value)} className={`flex items-center gap-1 rounded-xl border px-3 text-xs ${activeOnly ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200"}`}><Check size={14}/>Actives</button></div>
            {activeLayerIds.length > 0 && <section className="mt-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold">Actives ({activeLayerIds.length})</h3><button onClick={clearLayers} className="text-[10px] font-semibold text-red-600">Tout retirer</button></div><div className="space-y-2">{activeLayerIds.map((id, index) => { const layer = flatLayers.find((item) => item.id === id); if (!layer) return null; const Icon = layer.icon; return <div key={id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-2"><Icon size={16} style={{ color: layer.color }}/><span className="min-w-0 flex-1 text-xs font-semibold">{layer.label}</span><button onClick={() => removeLayer(id)} title="Retirer"><X size={14}/></button><button disabled={index === 0} onClick={() => setLayerOrder((current) => { const next = [...current]; const i = next.indexOf(id); if (i > 0) [next[i - 1], next[i]] = [next[i], next[i - 1]]; return next; })} title="Monter" className="disabled:opacity-30"><MoveUp size={14}/></button><button disabled={index === activeLayerIds.length - 1} onClick={() => setLayerOrder((current) => { const next = [...current]; const i = next.indexOf(id); if (i >= 0 && i < next.length - 1) [next[i], next[i + 1]] = [next[i + 1], next[i]]; return next; })} title="Descendre" className="disabled:opacity-30"><MoveDown size={14}/></button></div><label className="mt-3 block text-[10px] text-slate-500">Opacité de la couche : {opacity[id] ?? 75}%<input type="range" min="10" max="100" value={opacity[id] ?? 75} onChange={(e) => setOpacity((current) => ({ ...current, [id]: Number(e.target.value) }))} className="mt-1 w-full accent-green-600"/></label></div>; })}</div></section>}
            <section className="mt-5"><h3 className="mb-2 text-xs font-bold">Catalogue des couches</h3><div className="space-y-2">{filteredCategories.map((category) => { const CategoryIcon = category.icon; const isExpanded = !!expanded[category.id]; return <div key={category.id} className="overflow-hidden rounded-xl border border-slate-200"><button onClick={() => setExpanded((current) => ({ ...current, [category.id]: !current[category.id] }))} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50"><CategoryIcon size={17} className="text-slate-500"/><span className="flex-1 text-xs font-semibold">{category.label}<span className="ml-2 text-[10px] font-normal text-slate-400">{category.layers.filter((item) => activeLayers[item.id]).length} active(s)</span></span><ChevronDown size={15} className={`transition ${isExpanded ? "rotate-180" : ""}`}/></button>{isExpanded && <div className="border-t border-slate-100 p-2">{category.layers.map((layer) => { const Icon = layer.icon; const isActive = !!activeLayers[layer.id]; return <button key={layer.id} onClick={() => toggleLayer(layer.id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-left ${isActive ? "bg-green-50" : "hover:bg-slate-50"}`}><Icon size={16} style={{ color: layer.color }}/><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold">{layer.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{layer.description}</span></span><span className={`flex h-5 w-5 items-center justify-center rounded-md border ${isActive ? "border-green-600 bg-green-600 text-white" : "border-slate-300"}`}>{isActive && <Check size={12}/>}</span></button>; })}</div>}</div>; })}</div></section>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-[10px] leading-4 text-amber-800">Couches alimentées par l'API : « Régions » (indicateur choisi dans les filtres) et « Stations météo ». Les autres couches du catalogue sont préparées côté interface et restent à connecter.</p>
        </PanelFrame>}

        {/* Panneau Filtres */}
        {panel === "filters" && <PanelFrame title="Indicateur et filtres" subtitle="Données agrégées depuis l'API, par région" icon={SlidersHorizontal} onClose={() => setPanel(null)}>
            <MapFilters filtres={filtres} onChange={setFiltres} carto={carto}/>
            <button onClick={() => setFiltres(FILTRES_INITIAUX)} className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold hover:bg-slate-50">Réinitialiser</button>
        </PanelFrame>}

        {/* Panneaux complémentaires */}
        {panel === "analysis" && <PanelFrame title="Classement des régions" subtitle={`${carto.indicateur.label}${carto.indicateur.unite ? ` (${carto.indicateur.unite})` : ""} · ${carto.annee ?? "—"}`} icon={BarChart3} onClose={() => setPanel(null)}>
            {carto.statut.kind === "loading" ? <div role="status" className="space-y-2">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-7 animate-pulse rounded-lg bg-slate-100"/>)}</div> :
                carto.statut.kind === "error" ? <p className="text-xs text-red-700">{carto.statut.message}</p> :
                    <table className="w-full text-left text-[11px]">
                        <thead><tr className="text-[9px] uppercase tracking-wide text-slate-400"><th className="py-1 font-medium">Région</th><th className="py-1 text-right font-medium">Valeur</th><th className="py-1 text-right font-medium">vs N-1</th></tr></thead>
                        <tbody>{classement.map((r) => <tr key={r.cle} onClick={() => setSelection(r.cle)} className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${selection === r.cle ? "bg-green-50" : ""}`}>
                            <td className="py-1.5"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-4 rounded-sm border border-black/5" style={r.valeur === null ? STYLE_HACHURES : { backgroundColor: carto.echelle.couleur(r.valeur) ?? undefined }}/>{r.nom}</span></td>
                            {r.valeur === null ? <td colSpan={2} className="py-1.5 text-right text-slate-400">Donnée non disponible</td> : <>
                                <td className="py-1.5 text-right tabular-nums font-semibold">{formatValeur(carto.indicateur, r.valeur)}</td>
                                <td className="py-1.5 text-right tabular-nums text-slate-600">{formatEvolution(carto.indicateur, r.evolution)}</td>
                            </>}
                        </tr>)}</tbody>
                    </table>}
        </PanelFrame>}
        {panel === "alerts" && <PanelFrame title="Risques et alertes" subtitle="Surveillance agroclimatique" icon={AlertTriangle} onClose={() => setPanel(null)}><div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">Bientôt disponible : les alertes seront alimentées par le service de surveillance.</div></PanelFrame>}
        {panel === "history" && <PanelFrame title="Historique" subtitle="Année affichée sur la carte" icon={Activity} onClose={() => setPanel(null)}>
            <div className="grid grid-cols-3 gap-2">{carto.options.annees.slice(0, 12).map((year) => {
                const avecDonnees = carto.anneesIndicateur.includes(year);
                return <button key={year} onClick={() => setFiltres((f) => ({ ...f, annee: year }))} title={avecDonnees ? undefined : "Pas de donnée pour cet indicateur"} className={`rounded-xl border p-3 text-xs font-bold ${carto.annee === year ? "border-green-500 bg-green-50 text-green-700" : avecDonnees ? "border-slate-200" : "border-slate-100 text-slate-300"}`}>{year}</button>;
            })}</div>
            {carto.statut.kind === "loading" && <p className="mt-3 text-[10px] text-slate-500">Chargement des années disponibles…</p>}
        </PanelFrame>}
        {panel === "satellite" && <PanelFrame title="Fond cartographique" subtitle="Choisis le style de la carte" icon={Satellite} onClose={() => setPanel(null)}><div className="grid grid-cols-2 gap-3">{baseMaps.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => changeBaseMap(item.id)} className={`rounded-xl border p-4 ${baseMap === item.id ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 hover:bg-slate-50"}`}><Icon size={21} className="mx-auto"/><p className="mt-2 text-xs font-semibold">{item.label}</p></button>; })}</div><p className="mt-4 text-[10px] leading-4 text-slate-500">Fonds : CARTO / OpenStreetMap (Clair, Sombre), OpenTopoMap (Terrain) et Esri World Imagery (Satellite). Vérifie leurs conditions d'usage avant la mise en production.</p></PanelFrame>}
        {panel === "profile" && <PanelFrame title="Profil utilisateur" subtitle="Compte de démonstration" icon={UserRound} onClose={() => setPanel(null)}><p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">L'espace de profil sera connecté au système d'authentification.</p></PanelFrame>}
        {panel === "settings" && <PanelFrame title="Paramètres" subtitle="Préférences de la carte" icon={Settings2} onClose={() => setPanel(null)}><button onClick={() => { setBaseMap(baseMap === "Sombre" ? "Clair" : "Sombre"); }} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-xs"><span>Basculer le thème de la carte</span><span className="font-semibold">{baseMap === "Sombre" ? "Sombre" : "Clair"}</span></button><p className="mt-3 text-[10px] text-slate-500">Les préférences persistantes seront ajoutées ultérieurement.</p></PanelFrame>}
        {panel === "notifications" && <PanelFrame title="Notifications" subtitle="Événements de la plateforme" icon={Bell} onClose={() => setPanel(null)}><div className="rounded-xl border border-slate-200 p-3"><p className="text-xs font-semibold">Aucune nouvelle notification</p><p className="mt-1 text-[10px] text-slate-500">Les alertes seront alimentées par les services de suivi terrain.</p></div></PanelFrame>}
        {panel === "more" && <PanelFrame title="À propos d'Assaman-Suuf" subtitle="Plateforme agroclimatique" icon={Sprout} onClose={() => setPanel(null)}><p className="text-xs leading-5 text-slate-600">Assaman-Suuf vise à réunir les données climatiques, agricoles, hydriques et territoriales pour soutenir la prise de décision au Sénégal.</p></PanelFrame>}

        {/* Fiche région sélectionnée */}
        {selection && <RegionDetails cle={selection} carto={carto} onClose={() => setSelection(null)}/>}
    </section>;
}
