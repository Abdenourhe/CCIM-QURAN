import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
    const t = useTranslations("auth");

    return (
        <div>
            <h2 className="text-2xl font-semibold text-white text-center mb-2">
                {t("resetPasswordTitle")}
            </h2>
            <p className="text-white/60 text-center mb-6 text-sm">
                {t("resetPasswordDesc")}
            </p>
            <ResetPasswordForm />
        </div>
    );
}
