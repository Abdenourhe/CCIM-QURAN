"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { loginSchema, type LoginInput } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Link from "next/link";

export function LoginForm() {
    const t = useTranslations("auth");
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string || "fr";
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        setError(null);

        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        if (result?.error) {
            setError(t("invalidCredentials"));
            return;
        }

        if (result?.ok) {
            // Redirect to role-based dashboard
            router.push(`/${locale}/admin`);
        }
    };

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
                <div className="mt-2 text-right">
                    <Link 
                        href={`/${locale}/forgot-password`} 
                        className="text-sm text-accent hover:text-accent/80"
                    >
                        {t("forgotPassword")}
                    </Link>
                </div>
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-primary-950 hover:bg-accent/90"
            >
                {isSubmitting ? t("loggingIn") : t("signIn")}
            </Button>
        </form>
    );
}
