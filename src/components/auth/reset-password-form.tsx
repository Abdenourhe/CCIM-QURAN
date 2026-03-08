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

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
    const t = useTranslations("auth");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string || "fr";
    const token = params.token as string;
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordInput) => {
        setError(null);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    password: data.password,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                setError(result.error || "Une erreur est survenue");
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/${locale}/login`);
            }, 2000);
        } catch {
            setError("Une erreur est survenue");
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <div className="text-green-400 text-lg mb-2">✓</div>
                <p className="text-white">{t("passwordResetSuccess")}</p>
                <p className="text-white/60 text-sm mt-2">Redirection vers la connexion...</p>
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
                <Label htmlFor="password" className="text-white mb-1 block">
                    {t("password")}
                </Label>
                <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    placeholder="••••••••"
                />
                {errors.password && (
                    <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="confirmPassword" className="text-white mb-1 block">
                    {t("confirmPassword")}
                </Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    placeholder="••••••••"
                />
                {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-300">{errors.confirmPassword.message}</p>
                )}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-primary-950 hover:bg-accent/90"
            >
                {isSubmitting ? "Réinitialisation..." : t("resetPassword")}
            </Button>

            <p className="mt-4 text-center text-white/60 text-sm">
                <Link href={`/${locale}/login`} className="text-accent hover:text-accent/80">
                    {t("backToLogin")}
                </Link>
            </p>
        </form>
    );
}
