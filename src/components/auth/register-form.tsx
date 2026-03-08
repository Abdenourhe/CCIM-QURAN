"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { registerSchema, type RegisterInput } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function RegisterForm() {
    const t = useTranslations("auth");
    const tCommon = useTranslations("common");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string || "fr";
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterInput) => {
        setError(null);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const result = await response.json();
                setError(result.error || t("emailAlreadyExists"));
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/${locale}/login`);
            }, 2000);
        } catch {
            setError(tCommon("error"));
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <div className="text-green-400 text-lg mb-2">✓</div>
                <p className="text-white">{t("registrationSuccess")}</p>
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
                <Label htmlFor="name" className="text-white mb-1 block">
                    {tCommon("name")}
                </Label>
                <Input
                    id="name"
                    type="text"
                    {...register("name")}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                {errors.name && (
                    <p className="mt-1 text-xs text-red-300">{errors.name.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="email" className="text-white mb-1 block">
                    {t("email")}
                </Label>
                <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                {errors.email && (
                    <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="phone" className="text-white mb-1 block">
                    {tCommon("phone")} ({tCommon("common.optional") || "optional"})
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
            </div>

            <div>
                <Label htmlFor="gender" className="text-white mb-1 block">
                    {tCommon("gender")}
                </Label>
                <select
                    id="gender"
                    {...register("gender")}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50"
                >
                    <option value="" className="text-black">--</option>
                    <option value="MALE" className="text-black">{tCommon("male")}</option>
                    <option value="FEMALE" className="text-black">{tCommon("female")}</option>
                </select>
            </div>

            <div>
                <Label htmlFor="role" className="text-white mb-1 block">
                    {tCommon("role")}
                </Label>
                <select
                    id="role"
                    {...register("role")}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50"
                >
                    <option value="STUDENT" className="text-black">Élève</option>
                    <option value="PARENT" className="text-black">Parent</option>
                    <option value="TEACHER" className="text-black">Enseignant</option>
                </select>
                {errors.role && (
                    <p className="mt-1 text-xs text-red-300">{errors.role.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="password" className="text-white mb-1 block">
                    {t("password")}
                </Label>
                <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
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
                {isSubmitting ? t("registering") : t("signUp")}
            </Button>
        </form>
    );
}
