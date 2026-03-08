"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const forgotPasswordSchema = z.object({
    email: z.string().email("Email invalide"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
    const t = useTranslations("auth");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string || "fr";
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        setError(null);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const result = await response.json();
                setError(result.error || "Une erreur est survenue");
                return;
            }

            setSuccess(true);
        } catch {
            setError("Une erreur est survenue");
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <div className="text-green-400 text-lg mb-2">✓</div>
                <p className="text-white">{t("resetEmailSent")}</p>
                <Link 
                    href={`/${locale}/login`}
                    className="mt-4 inline-block text-accent hover:text-accent/80"
                >
                    {t("backToLogin")}
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="p-3 rounded-md bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                    {error}
                </div>
            )}

            <div>
                <Label htmlFor="email" className="text-white mb-1 block">
                    {t("email")}
                </Label>
                <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    placeholder="votre@email.com"
                />
                {errors.email && (
                    <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>
                )}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-primary-950 hover:bg-accent/90"
            >
                {isSubmitting ? "Envoi en cours..." : t("resetPassword")}
            </Button>

            <p className="mt-4 text-center text-white/60 text-sm">
                <Link href={`/${locale}/login`} className="text-accent hover:text-accent/80">
                    {t("backToLogin")}
                </Link>
            </p>
        </form>
    );
}
