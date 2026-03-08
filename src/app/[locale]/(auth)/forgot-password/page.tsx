import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
    const t = useTranslations("auth");

    return (
        <div>
            <h2 className="text-2xl font-semibold text-white text-center mb-2">
                {t("forgotPasswordTitle")}
            </h2>
            <p className="text-white/60 text-center mb-6 text-sm">
                {t("forgotPasswordDesc")}
            </p>
            <ForgotPasswordForm />
        </div>
    );
}
