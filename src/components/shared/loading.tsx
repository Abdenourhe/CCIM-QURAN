export function Loading({ message = "Chargement..." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}
