import {
    Cloud,
    CloudRain,
    Droplets,
    Sun,
    Thermometer,
    Wind,
} from "lucide-react";

interface WeatherOverviewProps {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    precipitation?: number;
    condition?: string;
    location?: string;
}

const WeatherOverview = ({
                             temperature = 29.4,
                             humidity = 64,
                             windSpeed = 18,
                             precipitation = 12.8,
                             condition = "Partiellement nuageux",
                             location = "Dakar, Sénégal",
                         }: WeatherOverviewProps) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Conditions météorologiques
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Situation actuelle
                    </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{location}</span>
                </div>
            </div>

            {/* Température principale */}
            <div className="mt-6 flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50">
                    {condition.toLowerCase().includes("nuage") ? (
                        <Cloud size={42} className="text-orange-500" />
                    ) : (
                        <Sun size={42} className="text-orange-500" />
                    )}
                </div>

                <div>
                    <div className="flex items-start">
            <span className="text-4xl font-bold text-gray-900">
              {temperature}
            </span>

                        <span className="ml-1 mt-1 text-lg text-gray-500">°C</span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-gray-600">
                        {condition}
                    </p>
                </div>
            </div>

            {/* Indicateurs */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 md:grid-cols-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <Droplets size={18} className="text-blue-600" />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Humidité</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {humidity}%
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                        <Wind size={18} className="text-purple-600" />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Vent</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {windSpeed} km/h
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50">
                        <CloudRain size={18} className="text-cyan-600" />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Précipitations</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {precipitation} mm
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                        <Thermometer size={18} className="text-orange-600" />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Température</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {temperature} °C
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherOverview;