interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    emptyMessage = "Aucune donnée disponible",
}: DataTableProps<T>) {
    return (
        <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-muted">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                className="px-4 py-3 text-left font-medium text-muted-foreground"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-8 text-center text-muted-foreground"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr key={idx} className="border-t hover:bg-muted/50 transition-colors">
                                {columns.map((col) => (
                                    <td key={String(col.key)} className="px-4 py-3">
                                        {col.render
                                            ? col.render(row[col.key as keyof T], row)
                                            : String(row[col.key as keyof T] ?? "")}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
