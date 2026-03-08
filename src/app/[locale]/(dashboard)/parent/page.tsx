"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    getParentDashboardStats,
    getChildrenSummary,
    type ParentDashboardStats,
    type ChildSummary,
} from "@/app/actions/parent";
import { useRouter } from "next/navigation";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            welcome: "Bienvenue",
            parent: "Parent",
            dashboard: "Tableau de bord",
            stars: "Étoiles",
            children: "Enfants",
            makingProgress: "En progression",
            viewAllChildren: "Voir tous les enfants",
            recentAnnouncements: "Annonces récentes",
            noAnnouncements: "Aucune annonce",
            noChildren: "Vous n'avez pas encore d'enfants liés",
            linkChild: "Lier un enfant",
            currentSurah: "Sourate en cours",
            progress: "Progression",
            active: "Actif",
            needsAttention: "Attention",
            viewDetails: "Voir les détails",
            totalChildren: "Total enfants",
            totalStars: "Total étoiles",
            childrenProgress: "Enfants en progression",
            goodMorning: "Bonjour",
            goodAfternoon: "Bon après-midi",
            goodEvening: "Bonsoir",
            welcomeBack: "Bienvenue sur votre tableau de bord",
            trackProgress: "Suivez la progression de vos enfants",
        },
        ar: {
            welcome: "أهلاً وسهلاً",
            parent: "والد",
            dashboard: "لوحة القيادة",
            stars: "النجوم",
            children: "الأطفال",
            makingProgress: "يحققون تقدماً",
            viewAllChildren: "عرض جميع الأطفال",
            recentAnnouncements: "الإعلانات الأخيرة",
            noAnnouncements: "لا توجد إعلانات",
            noChildren: "ليس لديك أطفال مرتبطين بعد",
            linkChild: "ربط طفل",
            currentSurah: "السورة الحالية",
            progress: "التقدم",
            active: "نشط",
            needsAttention: "يحتاج اهتماماً",
            viewDetails: "عرض التفاصيل",
            totalChildren: "إجمالي الأطفال",
            totalStars: "إجمالي النجوم",
            childrenProgress: "أطفال يحققون تقدماً",
            goodMorning: "صباح الخير",
            goodAfternoon: "مساء الخير",
            goodEvening: "مساء الخير",
            welcomeBack: "مرحباً بك في لوحة قيادتك",
            trackProgress: "تتبع تقدم أطفالك",
        },
    };
    return translations[locale] || translations.fr;
}

// Get greeting based on time of day
function getGreeting(locale: string): string {
    const hour = new Date().getHours();
    const t = getTranslations(locale);

    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
}

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1000;
        const steps = 30;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{displayValue}{suffix}</span>;
}

// Status badge component
function StatusBadge({ status }: { status: "ACTIVE" | "NEEDS_ATTENTION" }) {
    const locale = useLocale();
    const t = getTranslations(locale);

    return (
        <Badge className={status === "ACTIVE"
            ? "bg-green-100 text-green-800 hover:bg-green-100"
            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        }>
            {status === "ACTIVE" ? t.active : t.needsAttention}
        </Badge>
    );
}

export default function ParentDashboardPage() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const router = useRouter();
    const t = getTranslations(locale);

    const [stats, setStats] = useState<ParentDashboardStats | null>(null);
    const [children, setChildren] = useState<ChildSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push(`/${locale}/login`);
            return;
        }

        if (session?.user?.id) {
            loadData();
        }
    }, [session, status, locale, router]);

    async function loadData() {
        if (!session?.user?.id) return;

        try {
            const [dashboardStats, childrenSummary] = await Promise.all([
                getParentDashboardStats(session.user.id),
                getChildrenSummary(session.user.id),
            ]);

            setStats(dashboardStats);
            setChildren(childrenSummary);
        } catch (error) {
            console.error("Error loading parent dashboard:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">
                    {getGreeting(locale)} {session?.user?.name || ""}! 👋
                </h1>
                <p className="text-muted-foreground">
                    {t.welcomeBack} • {t.trackProgress}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-violet-600">
                            {t.totalChildren}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-violet-700">
                            <AnimatedCounter value={stats?.totalChildren || 0} />
                        </div>
                        <p className="text-xs text-violet-500 mt-1">
                            👥 {children.length} {t.children}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600">
                            {t.totalStars}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-700">
                            ⭐ <AnimatedCounter value={stats?.totalStars || 0} />
                        </div>
                        <p className="text-xs text-amber-500 mt-1">
                            {t.stars} {t.children.toLowerCase()}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600">
                            {t.childrenProgress}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-700">
                            <AnimatedCounter value={stats?.childrenMakingProgress || 0} />
                        </div>
                        <p className="text-xs text-emerald-500 mt-1">
                            📈 {t.makingProgress}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Children Overview */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t.children}</CardTitle>
                    <Link href={`/${locale}/parent/children`}>
                        <Button variant="outline" size="sm">
                            {t.viewAllChildren} →
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {children.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">{t.noChildren}</p>
                            <Link href={`/${locale}/parent/children`}>
                                <Button>{t.linkChild}</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {children.map((child) => (
                                <Link
                                    key={child.id}
                                    href={`/${locale}/parent/progress?child=${child.id}`}
                                >
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={child.image || ""} />
                                                    <AvatarFallback className="bg-violet-100 text-violet-600">
                                                        {child.name ? child.name.charAt(0) : "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold truncate">
                                                            {child.name}
                                                        </h3>
                                                        <StatusBadge status={child.status} />
                                                    </div>

                                                    {child.currentSurah && (
                                                        <div className="mt-2">
                                                            <p className="text-xs text-muted-foreground">
                                                                {t.currentSurah}: {child.currentSurah}
                                                            </p>
                                                            {child.surahProgress !== null && (
                                                                <Progress
                                                                    value={child.surahProgress}
                                                                    className="h-2 mt-1"
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                                        <span>⭐ {child.stars} {t.stars}</span>
                                                        {child.groupName && (
                                                            <span>📚 {child.groupName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t.recentAnnouncements}</CardTitle>
                    <Link href={`/${locale}/parent/announcements`}>
                        <Button variant="outline" size="sm">
                            {t.viewAllChildren} →
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {stats?.recentAnnouncements && stats.recentAnnouncements.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentAnnouncements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-start gap-2">
                                        {announcement.isImportant && (
                                            <span className="text-yellow-500">📌</span>
                                        )}
                                        <div>
                                            <h4 className="font-medium">
                                                {locale === "ar" && announcement.titleAr
                                                    ? announcement.titleAr
                                                    : announcement.title
                                                }
                                            </h4>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {locale === "ar" && announcement.contentAr
                                                    ? announcement.contentAr
                                                    : announcement.content
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">
                            {t.noAnnouncements}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
