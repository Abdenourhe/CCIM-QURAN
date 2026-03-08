interface Activity {
    id: string;
    description: string;
    time: string;
    type: string;
}

interface RecentActivityProps {
    activities?: Activity[];
}

export function RecentActivity({ activities = [] }: RecentActivityProps) {
    return (
        <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Activité récente</h3>
            {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            ) : (
                <ul className="space-y-3">
                    {activities.map((activity) => (
                        <li key={activity.id} className="flex items-start gap-3 text-sm">
                            <span className="text-muted-foreground shrink-0">{activity.time}</span>
                            <span>{activity.description}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
