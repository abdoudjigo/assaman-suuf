import {useEffect, useRef, useState} from "react";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import {Bell, Settings2, UserRound,Ellipsis} from "lucide-react";

maplibregl.setWorkerUrl(workerUrl);

/* =========================================
   1. FILTRES D'AFFICHAGE
========================================= */

function DisplayRenderFilter() {
    return (
        <div className="absolute left-4 top-24 z-10 rounded-xl bg-white p-4 shadow-lg">
            <h3 className="font-semibold text-slate-800">
                Filtres cartographiques
            </h3>

            <p className="mt-1 text-sm text-slate-500">
                Configure ici les données à afficher.
            </p>
        </div>
    );
}

/* =========================================
   2. NAVIGATION DU DASHBOARD
========================================= */

function NavFunctionDashboardMAp() {
    return (
        <nav className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-xl bg-white p-2 shadow-lg">
            <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
            >
                Carte
            </button>

            <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
                Indicateurs
            </button>

            <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
                Alertes
            </button>
        </nav>
    );
}

/* =========================================
   3. OPTIONS DU DASHBOARD
========================================= */

function InterfaceDashboardOption() {

    const [activePreviewInterface,setActivePreviewInterface]=useState("");


    function handlePreviewMenu(){

    }


    function UserCategoryOption() {
        const sizeIcon=18;
        return (
            <div className="text-sm text-slate-600 flex flex-col gap-2 *:p-2">
                <button title="Profile Utilisateur">
                    <UserRound size={sizeIcon}/>
                </button>
                <button title="settings">
                    <Settings2 size={sizeIcon}/>
                </button>
                <button title="notification" onClick={handlePreviewMenu}>
                    <Bell size={sizeIcon}/>
                </button>
                <button title="otherOption" onClick={handlePreviewMenu}>
                    <Ellipsis size={sizeIcon}/>
                </button>
            </div>
        );
    }


    function NavMapCategoryOption() {
        return()
    }

    function SystemOptionCategoryOption(){
                return()
    }

    return (
        <div className="absolute right-4 top-24 z-10 rounded-xl bg-white p-4 shadow-lg">
            {/*<h3 className="mb-3 font-semibold text-slate-800">*/}
            {/*    Options*/}
            {/*</h3>*/}

            <UserCategoryOption />
            <NavMapCategoryOption/>
            <SystemOptionCategoryOption/>
        </div>
    );
}

/* =========================================
   4. EN-TÊTE DE LA CARTE
========================================= */

function DisplayInfoHeaderMapOption() {
    return (
        <header className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur">
            <div>
                <h1 className="text-lg font-bold text-slate-900">
                    Assaman-Suuf
                </h1>

                <p className="text-sm text-slate-500">
                    Surveillance territoriale — Dakar
                </p>
            </div>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Carte active
            </span>
        </header>
    );
}

/* =========================================
   5. INTERFACE GLOBALE
========================================= */

function DashboardMapCommandInterface() {
    return (
        <>
            <DisplayInfoHeaderMapOption />
            <DisplayRenderFilter />
            <InterfaceDashboardOption />
            <NavFunctionDashboardMAp />
        </>
    );
}

/* =========================================
   6. COMPOSANT PRINCIPAL MAPLIBRE
========================================= */

function DashboardMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = mapContainer.current;

        if (!container) return;

        const map = new maplibregl.Map({
            container,
            style: "https://demotiles.maplibre.org/style.json",
            center: [-17.45, 14.5],
            zoom: 6,
            minZoom: 5,
            maxZoom: 18,
        });

        map.addControl(
            new maplibregl.NavigationControl(),
            "top-right"
        );

        map.on("error", (event) => {
            console.error("Erreur MapLibre :", event.error);
        });

        return () => {
            map.remove();
        };
    }, []);

    return (
        <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-slate-200">
            {/* Surface réservée à la carte MapLibre */}
            <div
                ref={mapContainer}
                className="absolute inset-0"
            />

            {/* Interface superposée à la carte */}
            <DashboardMapCommandInterface />
        </section>
    );
}

export default DashboardMap;
