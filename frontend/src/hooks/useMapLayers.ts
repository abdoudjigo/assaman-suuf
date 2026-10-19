import { useEffect, useRef } from "react";
import L from "leaflet";
import type { GeoJSON as GeoJSONLayer, LayerGroup, Map as LeafletMap, Path, PathOptions } from "leaflet";
import type { Feature } from "geojson";
import { ID_MOTIF_HACHURES } from "../config/mapIndicators";
import type { Cartographie, RegionsGeo } from "./useCartographieData";
import type { StationItem } from "../services/dashboardApi";
import { formatEvolution, formatValeur } from "../utils/cartographieAggregates";
import { coordonneesStation, nomRegion, normaliserRegion } from "../utils/regions";

/* =========================================================
   Couches Leaflet de la Cartographie : régions (choroplèthe)
   et stations climatiques. La carte est créée par DashboardMap ;
   ces hooks ajoutent / mettent à jour leurs couches.
   ========================================================= */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const cleFeature = (feature: Feature | undefined) => normaliserRegion((feature?.properties as { nom?: string } | null)?.nom);

function contenuTooltip(cle: string, carto: Cartographie): string {
    const { indicateur, annee, regions, statut } = carto;
    const titre = `<strong>${esc(nomRegion(cle))}</strong>`;
    if (statut.kind === "loading") return `${titre}<br/><span class="text-slate-500">Chargement des données…</span>`;
    if (statut.kind === "error") return `${titre}<br/><span class="text-slate-500">Données indisponibles (erreur API)</span>`;

    const stat = regions?.get(cle);
    if (!stat || stat.valeur === null) {
        const raison = indicateur.famille === "climat" && stat?.sansStation
            ? "Aucune station climatique dans la région"
            : indicateur.famille === "agriculture" && !stat?.nbCampagnes
                ? `Aucune campagne en ${annee ?? "—"} pour ces filtres`
                : null;
        return `${titre}<br/>Donnée non disponible${raison ? `<br/><span class="text-slate-500">${raison}</span>` : ""}`;
    }
    const lignes = [
        `${esc(indicateur.label)} ${annee} : <strong>${formatValeur(indicateur, stat.valeur)}</strong>`,
        `Évolution vs ${annee !== null ? annee - 1 : "N-1"} : ${formatEvolution(indicateur, stat.evolution)}`,
    ];
    if (indicateur.famille === "agriculture") lignes.push(`Campagnes : ${stat.nbCampagnes}`);
    return `${titre}<br/>${lignes.join("<br/>")}`;
}

type RegionLayerOptions = {
    visible: boolean;
    opacite: number; // 0–1
    selection: string | null;
    onSelect: (cle: string) => void;
};

export function useRegionLayer(map: LeafletMap | null, geo: RegionsGeo | undefined, carto: Cartographie, options: RegionLayerOptions) {
    const layerRef = useRef<GeoJSONLayer | null>(null);
    const styleRef = useRef<(cle: string) => PathOptions>(() => ({}));
    const onSelectRef = useRef(options.onSelect);
    useEffect(() => { onSelectRef.current = options.onSelect; });

    // Création (une fois les tracés chargés)
    useEffect(() => {
        if (!map || !geo) return;
        const layer = L.geoJSON(geo, {
            style: (feature) => styleRef.current(cleFeature(feature)),
            onEachFeature: (feature, path) => {
                const cle = cleFeature(feature);
                path.bindTooltip("", { sticky: true, direction: "top", offset: [0, -8], opacity: 0.97 });
                path.on({
                    mouseover: () => {
                        (path as Path).setStyle({ weight: 2.5, color: "#334155" });
                        (path as Path).bringToFront();
                    },
                    mouseout: () => (path as Path).setStyle(styleRef.current(cle)),
                    click: () => onSelectRef.current(cle),
                });
            },
        });
        layerRef.current = layer;
        map.fitBounds(layer.getBounds(), { paddingTopLeft: [80, 110], paddingBottomRight: [40, 110] }); // cadrage initial sur le Sénégal
        return () => {
            layer.remove();
            layerRef.current = null;
        };
    }, [map, geo]);

    // Couleurs, tooltips et visibilité
    const { regions, echelle, statut } = carto;
    const { visible, opacite, selection } = options;
    useEffect(() => {
        const layer = layerRef.current;
        if (!map || !layer) return;

        styleRef.current = (cle) => {
            const couleur = statut.kind === "ready" || statut.kind === "empty" ? echelle.couleur(regions?.get(cle)?.valeur ?? null) : null;
            const enAttente = statut.kind === "loading" || statut.kind === "error";
            const selectionnee = cle === selection;
            return {
                fillColor: couleur ?? (enAttente ? "#f1f5f9" : `url(#${ID_MOTIF_HACHURES})`),
                fillOpacity: couleur ? opacite : 1,
                color: selectionnee ? "#0f172a" : "#ffffff",
                weight: selectionnee ? 2.5 : 1,
                opacity: 1,
            };
        };
        layer.eachLayer((path) => {
            const cle = cleFeature((path as L.Polygon).feature as Feature);
            (path as Path).setStyle(styleRef.current(cle));
            path.setTooltipContent(contenuTooltip(cle, carto));
        });

        if (visible && !map.hasLayer(layer)) layer.addTo(map);
        if (!visible && map.hasLayer(layer)) layer.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `carto` n'est lu que pour les tooltips, ses champs utiles sont listés
    }, [map, geo, regions, echelle, statut.kind, visible, opacite, selection]);

    // Cadrage sur la région sélectionnée
    useEffect(() => {
        const layer = layerRef.current;
        if (!map || !layer || !selection) return;
        layer.eachLayer((path) => {
            if (cleFeature((path as L.Polygon).feature as Feature) !== selection) return;
            map.flyToBounds((path as L.Polygon).getBounds(), {
                paddingTopLeft: [80, 110],
                paddingBottomRight: [window.innerWidth > 900 ? 380 : 40, 110],
                maxZoom: 8,
                duration: 0.8,
            });
        });
    }, [map, geo, selection]);
}

export function useStationLayer(map: LeafletMap | null, stations: StationItem[] | undefined, visible: boolean, onSelect: (cle: string) => void) {
    const groupRef = useRef<LayerGroup | null>(null);
    const onSelectRef = useRef(onSelect);
    useEffect(() => { onSelectRef.current = onSelect; });

    useEffect(() => {
        if (!map || !stations) return;
        if (!map.getPane("stations")) map.createPane("stations").style.zIndex = "450"; // au-dessus des régions (400)

        const group = L.layerGroup();
        for (const station of stations) {
            const coords = coordonneesStation(station.station_nom);
            if (!coords) continue; // listée dans le panneau régional, mais non positionnable
            const cle = normaliserRegion(station.region);
            L.circleMarker(coords, { pane: "stations", radius: 6, color: "#ffffff", weight: 2, fillColor: "#0284c7", fillOpacity: 1 })
                .bindTooltip(`<strong>Station ${esc(station.station_nom ?? station.station ?? "")}</strong><br/>Région : ${esc(nomRegion(cle) || "non rattachée")}`, { direction: "top", offset: [0, -6] })
                .on("click", () => cle && onSelectRef.current(cle))
                .addTo(group);
        }
        groupRef.current = group;
        return () => {
            group.remove();
            groupRef.current = null;
        };
    }, [map, stations]);

    useEffect(() => {
        const group = groupRef.current;
        if (!map || !group) return;
        if (visible && !map.hasLayer(group)) group.addTo(map);
        if (!visible && map.hasLayer(group)) group.remove();
    }, [map, stations, visible]);
}
