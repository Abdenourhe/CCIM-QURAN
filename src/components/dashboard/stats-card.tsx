interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: string;
    trend?: {
        value: number;
        positive: boolean;
    };
}

export function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
    return (
        <div className="bg-card border rounded-lg p-6 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {icon && <span className="text-2xl">{icon}</span>}
            </div>
            <div className="flex items-end gap-2">
                <p className="text-3xl font-bold">{value}</p>
                {trend && (
                    <span
                        className={`text-sm mb-1 ${trend.positive ? "text-green-600" : "text-red-600"
                            }`}
                    >
                        {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    );
}
