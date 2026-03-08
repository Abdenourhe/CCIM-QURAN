import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface HomePageProps {
    params: { locale: string };
}

export default async function HomePage({ params: { locale } }: HomePageProps) {
    const session = await auth();

    if (session?.user?.role) {
        // Redirect to role-based dashboard
        const role = session.user.role.toLowerCase();
        redirect(`/${locale}/${role}`);
    }

    // If not authenticated, redirect to login
    redirect(`/${locale}/login`);
}
