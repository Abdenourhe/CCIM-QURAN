import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div>
            <h2 className="text-2xl font-semibold text-white text-center mb-6">
                Connexion
            </h2>
            <LoginForm />
            <p className="mt-4 text-center text-white/60 text-sm">
                Pas encore de compte ?{" "}
                <Link href="/fr/register" className="text-accent hover:text-accent/80 font-medium">
                    S'inscrire
                </Link>
            </p>
        </div>
    );
}
