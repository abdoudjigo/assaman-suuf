import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    unit?: string;
    icon: LucideIcon;
    trend?: string;
    trendLabel?: string;
    iconColor?: string;
    iconBackground?: string;
}

const StatCard = ({
                      title,
                      value,
                      unit,
                      icon: Icon,
                      trend,
                      trendLabel,
                      iconColor = "text-green-600",
                      iconBackground = "bg-green-50",
                  }: StatCardProps) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            {/* En-tête */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>

                    <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">
              {value}
            </span>

                        {unit && (
                            <span className="text-sm font-medium text-gray-500">
                {unit}
              </span>
                        )}
                    </div>
                </div>

                {/* Icône */}
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBackground}`}
                >
                    <Icon size={22} className={iconColor} />
                </div>
            </div>

            {/* Tendance */}
            {(trend || trendLabel) && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    {trend && (
                        <span className="font-semibold text-green-600">
              {trend}
            </span>
                    )}

                    {trendLabel && (
                        <span className="text-gray-500">
              {trendLabel}
            </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatCard;