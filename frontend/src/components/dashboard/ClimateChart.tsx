import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface ClimateData {
    date: string;
    temperature: number;
    precipitation: number;
}

interface ClimateChartProps {
    data?: ClimateData[];
    period?: "7" | "30" | "90";
}

const defaultData: ClimateData[] = [
    {
        date: "29 Sept.",
        temperature: 28.4,
        precipitation: 4.2,
    },
    {
        date: "30 Sept.",
        temperature: 29.1,
        precipitation: 6.8,
    },
    {
        date: "1 Oct.",
        temperature: 30.2,
        precipitation: 2.1,
    },
    {
        date: "2 Oct.",
        temperature: 29.7,
        precipitation: 8.4,
    },
    {
        date: "3 Oct.",
        temperature: 30.5,
        precipitation: 5.7,
    },
    {
        date: "4 Oct.",
        temperature: 29.8,
        precipitation: 3.9,
    },
    {
        date: "5 Oct.",
        temperature: 29.4,
        precipitation: 12.8,
    },
];

const ClimateChart = ({
                          data = defaultData,
                          period = "7",
                      }: ClimateChartProps) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* En-tête */}
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Évolution climatique
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Température et précipitations
                    </p>
                </div>

                {/* Sélection de période */}
                <select
                    value={period}
                    onChange={() => {}}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-500"
                >
                    <option value="7">7 derniers jours</option>
                    <option value="30">30 derniers jours</option>
                    <option value="90">90 derniers jours</option>
                </select>
            </div>

            {/* Légende */}
            <div className="mt-5 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-gray-600">Température</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-gray-600">Précipitations</span>
                </div>
            </div>

            {/* Graphique */}
            <div className="mt-6 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />

                        <YAxis
                            yAxisId="temperature"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            domain={["dataMin - 2", "dataMax + 2"]}
                        />

                        <YAxis
                            yAxisId="precipitation"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />

                        <Tooltip
                            contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                            }}
                        />

                        <Line
                            yAxisId="temperature"
                            type="monotone"
                            dataKey="temperature"
                            stroke="#f97316"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Température"
                        />

                        <Line
                            yAxisId="precipitation"
                            type="monotone"
                            dataKey="precipitation"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Précipitations"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ClimateChart;