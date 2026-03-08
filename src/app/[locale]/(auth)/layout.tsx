import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-bold text-accent tracking-tight">CCI_Montmagny</h1>
                    </Link>
                    <p className="text-primary-200 mt-2 text-lg">Centre de Formation</p>
                </div>
                <div className="bg-primary-900/30 backdrop-blur-sm border border-primary-700/50 rounded-xl p-6 shadow-xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
