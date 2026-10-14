import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, type ExpressionSpecification, type GeoJSONSource, type StyleSpecification } from "maplibre-gl";import "maplibre-gl/dist/maplibre-gl.css";
import type { ZoneValues } from "./useZoneData";
import { normaliserRegion as norm } from "../utils/regions";

/*
 * Carte MapLibre pour le dashboard agro-climatique.
 * Prérequis : un GeoJSON des régions du Sénégal (ADM1) dans /public/data/senegal-adm1.geojson
 * (geoBoundaries "SEN ADM1" ou GADM niveau 1). Le nom de région est lu dans
 * properties.name | shapeName | NAME_1.
 */
const GEOJSON_URL = "/data/senegal-adm1.geojson";
const SRC = "zones";

/* Fonds de carte : à remplacer par MapTiler / vos tuiles en production (conditions d'usage des fournisseurs). */
const BASES: Record<string, { tiles: string[]; attribution: string; maxzoom?: number }> = {
    Clair: { tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"], attribution: "© OpenStreetMap © CARTO" },
    Sombre: { tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"], attribution: "© OpenStreetMap © CARTO" },
    Satellite: { tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], attribution: "Esri, Maxar, Earthstar Geographics" },
    Terrain: { tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"], attribution: "© OpenTopoMap", maxzoom: 17 },
};
/* "Atlas" (ou tout autre nom inconnu) = fond parchemin sans tuiles, style carte de jeu. */

/* Couche active (id de dashboardConfig) -> propriété GeoJSON + palette. */
const INDICATORS: Record<string, { prop: string; stops: [number, string][] }> = {
    rainfall: { prop: "rainfall", stops: [[200, "#efe3b0"], [600, "#7fb6d6"], [1200, "#1e5a96"]] },
    temperature: { prop: "temperature", stops: [[26, "#fde7b0"], [29, "#f0a04b"], [32, "#b23a22"]] },
    drought: { prop: "drought", stops: [[0, "#e8e4a0"], [50, "#e08a3a"], [100, "#a62d22"]] },
    ndvi: { prop: "ndvi", stops: [[0.2, "#e6d9a0"], [0.45, "#8abf62"], [0.7, "#1d6b3a"]] },
};

const style = (): StyleSpecification => ({
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: Object.fromEntries(
        Object.entries(BASES).map(([k, b]) => [`base-${k}`, { type: "raster", tiles: b.tiles, tileSize: 256, attribution: b.attribution, maxzoom: b.maxzoom ?? 18 }])
    ),
    layers: [
        { id: "bg", type: "background", paint: { "background-color": "#e9dcb8" } },
        ...Object.keys(BASES).map((k) => ({ id: `base-${k}`, type: "raster" as const, source: `base-${k}`, layout: { visibility: (k === "Clair" ? "visible" : "none") as "visible" | "none" } })),
    ],
});

function bbox(geom: any): [number, number, number, number] {
    let a = 180, b = 90, c = -180, d = -90;
    const walk = (x: any) => {
        if (typeof x[0] === "number") { a = Math.min(a, x[0]); c = Math.max(c, x[0]); b = Math.min(b, x[1]); d = Math.max(d, x[1]); }
        else x.forEach(walk);
    };
    walk(geom.coordinates);
    return [a, b, c, d];
}

type Props = {
    selectedZone: string | null;
    onSelectZone: (zone: string | null) => void;
    baseMap: string;
    activeLayerIds: string[];
    layerSettings: Record<string, { opacity: number; visible: boolean }>;
    values: ZoneValues;
    zoom: number;
    setZoom: (z: number) => void;
};

export default function AgroMap({ selectedZone, onSelectZone, baseMap, activeLayerIds, layerSettings, values, zoom, setZoom }: Props) {
    const box = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const geoRef = useRef<any>(null);
    const hoverRef = useRef<string | null>(null);
    const prevSel = useRef<string | null>(null);
    const selectCb = useRef(onSelectZone);
    const zoomCb = useRef(setZoom);
    selectCb.current = onSelectZone;
    zoomCb.current = setZoom;
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Initialisation */
    useEffect(() => {
        if (!box.current) return;
        const map = new MapLibreMap({
            container: box.current,
            style: style(),
            center: [-14.5, 14.5],
            zoom: 6.2,
            minZoom: 5,
            maxBounds: [[-21, 10], [-8, 19]],
            attributionControl: { compact: true },
        });
        mapRef.current = map;

        map.on("load", async () => {
            try {
                const res = await fetch(GEOJSON_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const g = await res.json();
                g.features.forEach((f: any) => { f.properties = { ...f.properties, name: f.properties.name ?? f.properties.shapeName ?? f.properties.NAME_1 }; });
                geoRef.current = g;
            } catch (e) {
                setError(`GeoJSON introuvable (${GEOJSON_URL}). Ajoutez le fichier des régions dans /public/data.`);
                return;
            }
            map.addSource(SRC, { type: "geojson", data: geoRef.current, promoteId: "name" });
            map.addLayer({ id: "zones-fill", type: "fill", source: SRC, paint: { "fill-color": "#d8c690", "fill-opacity": 0.2 } });
            map.addLayer({ id: "zones-3d", type: "fill-extrusion", source: SRC, filter: ["==", ["get", "name"], ""], paint: { "fill-extrusion-color": "#e7c76a", "fill-extrusion-height": 14000, "fill-extrusion-opacity": 0.92 } });
            map.addLayer({
                id: "zones-line", type: "line", source: SRC,
                paint: {
                    "line-color": ["case", ["boolean", ["feature-state", "selected"], false], "#fff6d0", "#c9a24a"],
                    "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, ["boolean", ["feature-state", "hover"], false], 2.2, 1],
                },
            });
            map.addLayer({
                id: "zones-label", type: "symbol", source: SRC,
                layout: { "text-field": ["get", "name"], "text-font": ["Open Sans Regular"], "text-size": 12 },
                paint: { "text-color": "#2a2314", "text-halo-color": "#f6eccb", "text-halo-width": 1.6 },
            });

            map.on("mousemove", "zones-fill", (e) => {
                const name = e.features?.[0]?.properties?.name ?? null;
                map.getCanvas().style.cursor = "pointer";
                if (name === hoverRef.current) return;
                if (hoverRef.current) map.setFeatureState({ source: SRC, id: hoverRef.current }, { hover: false });
                hoverRef.current = name;
                if (name) map.setFeatureState({ source: SRC, id: name }, { hover: true });
            });
            map.on("mouseleave", "zones-fill", () => {
                map.getCanvas().style.cursor = "";
                if (hoverRef.current) map.setFeatureState({ source: SRC, id: hoverRef.current }, { hover: false });
                hoverRef.current = null;
            });
            map.on("click", (e) => {
                const f = map.queryRenderedFeatures(e.point, { layers: ["zones-fill"] })[0];
                selectCb.current(f ? f.properties?.name : null);
            });
            map.on("zoomend", () => zoomCb.current(Math.round(map.getZoom())));
            setReady(true);
        });

        return () => { map.remove(); mapRef.current = null; setReady(false); };
    }, []);

    /* Données API -> propriétés des régions */
    useEffect(() => {
        const map = mapRef.current;
        if (!ready || !map || !geoRef.current) return;
        const byKey = Object.fromEntries(Object.entries(values).map(([k, v]) => [norm(k), v]));
        const data = { ...geoRef.current, features: geoRef.current.features.map((f: any) => ({ ...f, properties: { ...f.properties, ...byKey[norm(f.properties.name)] } })) };
        (map.getSource(SRC) as GeoJSONSource).setData(data);
    }, [ready, values]);

    /* Fond de carte */
    useEffect(() => {
        const map = mapRef.current;
        if (!ready || !map) return;
        Object.keys(BASES).forEach((k) => map.setLayoutProperty(`base-${k}`, "visibility", k === baseMap ? "visible" : "none"));
    }, [ready, baseMap]);

    /* Couches actives : la dernière couche indicateur visible colore les régions */
    useEffect(() => {
        const map = mapRef.current;
        if (!ready || !map) return;
        const id = [...activeLayerIds].reverse().find((l) => INDICATORS[l] && layerSettings[l]?.visible !== false);
        if (!id) { map.setPaintProperty("zones-fill", "fill-opacity", 0.12); return; }
        const { prop, stops } = INDICATORS[id];
        const expr = ["interpolate", ["linear"], ["coalesce", ["get", prop], stops[0][0]], ...stops.flat()] as ExpressionSpecification;
        map.setPaintProperty("zones-fill", "fill-color", expr);
        map.setPaintProperty("zones-fill", "fill-opacity", (layerSettings[id]?.opacity ?? 75) / 100);
        map.setPaintProperty("zones-3d", "fill-extrusion-color", expr);
    }, [ready, activeLayerIds, layerSettings]);

    /* Sélection : surbrillance, relief 3D et cadrage */
    useEffect(() => {
        const map = mapRef.current;
        if (!ready || !map) return;
        if (prevSel.current) map.setFeatureState({ source: SRC, id: prevSel.current }, { selected: false });
        prevSel.current = selectedZone;
        map.setFilter("zones-3d", ["==", ["get", "name"], selectedZone ?? ""]);
        if (!selectedZone) { map.easeTo({ center: [-14.5, 14.5], zoom: 6.2, pitch: 0, bearing: 0, duration: 800 }); return; }
        map.setFeatureState({ source: SRC, id: selectedZone }, { selected: true });
        const f = geoRef.current?.features.find((x: any) => x.properties.name === selectedZone);
        if (!f) return;
        const [a, b, c, d] = bbox(f.geometry);
        map.fitBounds([[a, b], [c, d]], { padding: { top: 90, bottom: 110, left: 60, right: window.innerWidth > 900 ? 420 : 60 }, pitch: 35, bearing: -8, maxZoom: 8, duration: 1000 });
    }, [ready, selectedZone]);

    /* Zoom piloté par MapControls */
    useEffect(() => {
        const map = mapRef.current;
        if (ready && map && Math.abs(map.getZoom() - zoom) > 0.6) map.easeTo({ zoom, duration: 300 });
    }, [ready, zoom]);

    return (
        <>
            <div ref={box} className="absolute inset-0" />
            {error && (
                <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-xl border border-red-200 bg-white/95 px-4 py-3 text-xs text-red-700 shadow-xl">
                    {error}
                </div>
            )}
        </>
    );
}
