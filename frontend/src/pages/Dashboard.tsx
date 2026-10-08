import {
  CloudRain,
  Droplets,
  MapPin,
  Sun,
  Thermometer,
  Wind,
  TrendingUp,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import WeatherOverview from "../components/dashboard/WeatherOverview";
import ClimateChart from "../components/dashboard/ClimateChart";
import AlertSummary from "../components/dashboard/AlertSummary";

const NavMenuDashboard=()=>{
  return(
      <div>
          .
      </div>
  )
}

const Dashboard = () => {
  return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* =========================  HEADER   ========================== */}
        <div className="mb-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Vue générale de la plateforme agroclimatique DATAFLOW360
              </p>
            </div>

            {/* Localisation */}
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
              <MapPin size={18} className="text-green-600" />

              <div>
                <p className="text-xs text-gray-500">
                  Zone sélectionnée
                </p>

                <p className="text-sm font-medium text-gray-900">
                  Dakar, Sénégal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
          KPI
      ========================== */}
        <section className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                title="Température moyenne"
                value="29.4"
                unit="°C"
                icon={Thermometer}
                trend="+2.4%"
                trendLabel="vs semaine précédente"
                iconColor="text-orange-600"
                iconBackground="bg-orange-50"
            />

            <StatCard
                title="Précipitations"
                value="12.8"
                unit="mm"
                icon={CloudRain}
                trend="+8.1%"
                trendLabel="vs semaine précédente"
                iconColor="text-blue-600"
                iconBackground="bg-blue-50"
            />

            <StatCard
                title="Humidité"
                value="64"
                unit="%"
                icon={Droplets}
                trend="-1.8%"
                trendLabel="vs semaine précédente"
                iconColor="text-cyan-600"
                iconBackground="bg-cyan-50"
            />

            <StatCard
                title="Vitesse du vent"
                value="18"
                unit="km/h"
                icon={Wind}
                trend="+3.2%"
                trendLabel="vs semaine précédente"
                iconColor="text-purple-600"
                iconBackground="bg-purple-50"
            />
          </div>
        </section>

        {/* =========================
          GRAPHIQUE + ALERTES
      ========================== */}
        <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Graphique climatique */}
          <div className="xl:col-span-2">
            <ClimateChart />
          </div>

          {/* Alertes */}
          <div className="xl:col-span-1">
            <AlertSummary />
          </div>
        </section>

        {/* =========================
          MÉTÉO + INDICATEURS
      ========================== */}
        <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WeatherOverview />

          {/* Indicateurs agricoles */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Indicateurs agricoles
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  État général des conditions agricoles
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <TrendingUp
                    size={20}
                    className="text-green-600"
                />
              </div>
            </div>

            {/* Score */}
            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Indice agricole
                </p>

                <div className="mt-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  78
                </span>

                  <span className="text-lg text-gray-500">
                  /100
                </span>
                </div>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              Favorable
            </span>
            </div>

            {/* Progression */}
            <div className="mt-5">
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: "78%" }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Indicateurs */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Stress hydrique
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  Faible
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Conditions des sols
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  Bonnes
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Risque sécheresse
                </p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  Faible
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Potentiel agricole
                </p>

                <p className="mt-1 text-lg font-semibold text-green-600">
                  Élevé
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
          CARTE + RAYONNEMENT
      ========================== */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Carte du Sénégal */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Situation climatique au Sénégal
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Vue régionale des conditions climatiques
                </p>
              </div>

              <MapPin
                  size={20}
                  className="text-green-600"
              />
            </div>

            {/* Placeholder de la carte */}
            <div className="mt-5 flex h-72 items-center justify-center rounded-xl bg-gray-100">
              <div className="text-center">
                <MapPin
                    size={42}
                    className="mx-auto text-gray-400"
                />

                <p className="mt-3 text-sm font-medium text-gray-600">
                  Carte interactive du Sénégal
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Visualisation par région
                </p>
              </div>
            </div>
          </div>

          {/* Rayonnement solaire */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Rayonnement solaire
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Potentiel énergétique actuel
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-50">
                <Sun
                    size={22}
                    className="text-yellow-500"
                />
              </div>
            </div>

            <div className="mt-8 flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">
              6.8
            </span>

              <span className="mb-1 text-sm text-gray-500">
              kWh/m²
            </span>
            </div>

            <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-semibold text-green-600">
              +4.2%
            </span>

              <span className="text-sm text-gray-500">
              par rapport à la moyenne
            </span>
            </div>

            {/* Barre de potentiel */}
            <div className="mt-8">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Faible</span>
                <span>Modéré</span>
                <span>Élevé</span>
                <span>Très élevé</span>
              </div>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{ width: "82%" }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Potentiel solaire favorable
              </p>

              <p className="mt-1 text-xs leading-5 text-green-700">
                Les conditions actuelles sont favorables à la
                production d'énergie solaire.
              </p>
            </div>
          </div>
        </section>
      </div>
  );
};

export default Dashboard;