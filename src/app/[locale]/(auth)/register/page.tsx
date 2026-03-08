import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
    return (
        <div>
            <h2 className="text-2xl font-semibold text-white text-center mb-6">
                Inscription
            </h2>
            <RegisterForm />
        </div>
    );
}
