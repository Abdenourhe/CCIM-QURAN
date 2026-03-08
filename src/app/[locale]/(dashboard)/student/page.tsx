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
    getStudentDashboardStats,
    getStudentRecentActivity,
    type StudentDashboardStats,
    type RecentActivity
} from "@/app/actions/student";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            welcome: "Bienvenue",
            student: "Élève",
            dashboard: "Tableau de bord",
            stars: "Étoiles",
            surahsMemorized: "Sourates mémorisées",
            currentStreak: "Jours consécutifs",
            rank: "Rang",
            inGroup: "dans le groupe",
            todayGoal: "Objectif du jour",
            currentProgress: "Progression actuelle",
            surah: "Sourate",
            verses: "versets",
            progress: "Progression",
            recentActivity: "Activité récente",
            noActivity: "Aucune activité récente",
            markReady: "Je suis prêt à réciter",
            viewAll: "Voir tout",
            nextSurah: "Prochaine sourate",
            goodMorning: "Bonjour",
            goodAfternoon: "Bon après-midi",
            goodEvening: "Bonsoir",
            keepGoing: "Continue tes efforts !",
            evaluations: "Évaluations",
            badgeEarned: "Badge gagné",
            streak: "Jours consécutifs",
            inProgress: "En cours",
            notStarted: "Non commencé",
            readyToRecite: "Prêt à réciter",
            memorized: "Mémorisé",
        },
        ar: {
            welcome: "أهلاً وسهلاً",
            student: "طالب",
            dashboard: "لوحة القيادة",
            stars: "النجوم",
            surahsMemorized: "السور المحفوظة",
            currentStreak: "الأيام المتتالية",
            rank: "الترتيب",
            inGroup: "في المجموعة",
            todayGoal: "هدف اليوم",
            currentProgress: "التقدم الحالي",
            surah: "سورة",
            verses: "آيات",
            progress: "التقدم",
            recentActivity: "النشاط الأخير",
            noActivity: "لا يوجد نشاط حديث",
            markReady: "أنا مستعد للتسميع",
            viewAll: "عرض الكل",
            nextSurah: "السورة التالية",
            goodMorning: "صباح الخير",
            goodAfternoon: "مساء الخير",
            goodEvening: "مساء الخير",
            keepGoing: "واصل جهودك!",
            evaluations: "التقييمات",
            badgeEarned: "حصلت على شارة",
            streak: "أيام متتالية",
            inProgress: "قيد التنفيذ",
            notStarted: "لم يبدأ",
            readyToRecite: "مستعد للتسميع",
            memorized: "محفوظ",
        },
    };
    return translations[locale] || translations.fr;
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

    return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

// Get greeting based on time
function getGreeting(locale: string): string {
    const hour = new Date().getHours();
    const t = getTranslations(locale);

    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
}

// Surah info helper
function getSurahInfo(surahNumber: number) {
    const surahs: Record<number, { name: string; nameAr: string }> = {
        1: { name: "Al-Fatiha", nameAr: "الفاتحة" },
        2: { name: "Al-Baqarah", nameAr: "البقرة" },
        3: { name: "Aal-E-Imran", nameAr: "آل عمران" },
        26: { name: "Ash-Shuara", nameAr: "الشعراء" },
        36: { name: "Yasin", nameAr: "يس" },
        67: { name: "Al-Mulk", nameAr: "الملك" },
        68: { name: "Al-Qalam", nameAr: "القلم" },
        112: { name: "Al-Ikhlas", nameAr: "الإخلاص" },
    };
    return surahs[surahNumber] || { name: `Surah ${surahNumber}`, nameAr: `سورة ${surahNumber}` };
}

export default function StudentDashboard() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const t = getTranslations(locale);

    const [stats, setStats] = useState<StudentDashboardStats | null>(null);
    const [activity, setActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (session?.user?.id) {
                try {
                    const [statsData, activityData] = await Promise.all([
                        getStudentDashboardStats(session.user.id),
                        getStudentRecentActivity(session.user.id)
                    ]);
                    setStats(statsData);
                    setActivity(activityData);
                } catch (error) {
                    console.error("Error fetching student data:", error);
                }
            }
            setLoading(false);
        }

        if (status === "authenticated") {
            fetchData();
        }
    }, [session, status]);

    if (loading || status === "loading") {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center h-64">
                <p>{t.welcome}</p>
            </div>
        );
    }

    const greeting = getGreeting(locale);

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary">
                                <AvatarImage src={session.user?.image || ""} />
                                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                                    {session.user?.name?.[0] || "S"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {greeting}, {session.user?.name || t.student}! 👋
                                </h1>
                                <p className="text-muted-foreground">{t.keepGoing}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/student/recitation">
                                <Button className="bg-amber-500 hover:bg-amber-600">
                                    ⭐ {t.markReady}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stars Card */}
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            ⭐ {t.stars}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                            <AnimatedCounter value={stats?.stars || 0} />
                        </div>
                        <p className="text-xs text-amber-600/70 mt-1">Keep earning more!</p>
                    </CardContent>
                </Card>

                {/* Surahs Card */}
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            📖 {t.surahsMemorized}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            <AnimatedCounter value={stats?.surahsMemorized || 0} />
                        </div>
                        <p className="text-xs text-emerald-600/70 mt-1">114 surahs total</p>
                    </CardContent>
                </Card>

                {/* Streak Card */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            🔥 {t.currentStreak}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            <AnimatedCounter value={stats?.currentStreak || 0} />
                        </div>
                        <p className="text-xs text-orange-600/70 mt-1">days in a row</p>
                    </CardContent>
                </Card>

                {/* Rank Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            🏆 {t.rank}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            #{stats?.rank || "-"}
                        </div>
                        <p className="text-xs text-blue-600/70 mt-1">
                            {t.inGroup} ({stats?.totalStudents || 0})
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Progress */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>📊 {t.currentProgress}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.todayGoal ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {t.surah}: {getSurahInfo(1).name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {getSurahInfo(1).nameAr}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {t.inProgress}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t.progress}</span>
                                        <span className="font-medium">{stats.goalProgress || 0}%</span>
                                    </div>
                                    <Progress
                                        value={stats.goalProgress || 0}
                                        className="h-3"
                                    />
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {stats.todayGoal}
                                </p>

                                <Link href="/student/progress">
                                    <Button variant="outline" className="w-full">
                                        {t.viewAll} →
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-lg mb-4">🎯</p>
                                <p>{t.notStarted}</p>
                                <Link href="/student/progress">
                                    <Button className="mt-4">
                                        Commencer maintenant
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>📜 {t.recentActivity}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activity.length > 0 ? (
                            <div className="space-y-4">
                                {activity.slice(0, 5).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                                    >
                                        <span className="text-2xl">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {item.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(item.date).toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-3xl mb-2">📝</p>
                                <p className="text-sm">{t.noActivity}</p>
                            </div>
                        )}

                        <Link href="/student/recitation">
                            <Button variant="outline" className="w-full mt-4">
                                {t.viewAll} →
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>⚡ Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/student/recitation">
                            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                                <span className="text-2xl">🎙️</span>
                                <span className="text-xs">{t.markReady}</span>
                            </Button>
                        </Link>
                        <Link href="/student/progress">
                            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                                <span className="text-2xl">📊</span>
                                <span className="text-xs">{t.progress}</span>
                            </Button>
                        </Link>
                        <Link href="/student/badges">
                            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                                <span className="text-2xl">🏆</span>
                                <span className="text-xs">Badges</span>
                            </Button>
                        </Link>
                        <Link href="/student/profile">
                            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                                <span className="text-2xl">👤</span>
                                <span className="text-xs">{t.student}</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
