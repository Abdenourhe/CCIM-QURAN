"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectOption,
} from "@/components/ui/select";
import {
    getLinkedChildren,
    getChildProgress,
    type LinkedChild,
    type ChildProgress,
} from "@/app/actions/parent";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            progress: "Progression",
            selectChild: "Sélectionner un enfant",
            currentSurah: "Sourate actuelle",
            surahJourney: "Parcours des sourates",
            recentEvaluations: "Évaluations récentes",
            attendance: "Présences",
            badges: "Badges gagnés",
            statistics: "Statistiques",
            totalVerses: "Total versets",
            averageScore: "Score moyen",
            streak: "Jours consécutifs",
            surah: "Sourate",
            completed: "Complété",
            inProgress: "En cours",
            notStarted: "Non commencé",
            grade: "Note",
            evaluatedBy: "Évalué par",
            present: "Présent",
            absent: "Absent",
            late: "En retard",
            excused: "Excusé",
            noEvaluations: "Aucune évaluation",
            noBadges: "Aucun badge",
            verses: "versets",
            memorize: "mémorisé",
            surahsCompleted: "Sourates complétées",
            selectDateRange: "Sélectionner la période",
            last7Days: "7 derniers jours",
            last30Days: "30 derniers jours",
            last90Days: "90 derniers jours",
            allTime: "Tout le temps",
        },
        ar: {
            progress: "التقدم",
            selectChild: "اختر طفلاً",
            currentSurah: "السورة الحالية",
            surahJourney: "رحلة السور",
            recentEvaluations: "التقييمات الأخيرة",
            attendance: "الحضور",
            badges: "الشارات المكتسبة",
            statistics: "الإحصائيات",
            totalVerses: "إجمالي الآيات",
            averageScore: "متوسط الدرجات",
            streak: "أيام متتالية",
            surah: "سورة",
            completed: "مكتمل",
            inProgress: "قيد التنفيذ",
            notStarted: "لم يبدأ",
            grade: "الدرجة",
            evaluatedBy: "قيَّمَه",
            present: "حاضر",
            absent: "غائب",
            late: "متأخر",
            excused: "معذور",
            noEvaluations: "لا توجد تقييمات",
            noBadges: "لا توجد شارات",
            verses: "آية",
            memorize: "محفوظ",
            surahsCompleted: "السور المكتملة",
            selectDateRange: "اختر الفترة",
            last7Days: "آخر 7 أيام",
            last30Days: "آخر 30 يوماً",
            last90Days: "آخر 90 يوماً",
            allTime: "كل الوقت",
        },
    };
    return translations[locale] || translations.fr;
}

// Format date
function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// Get grade color
function getGradeColor(grade: string): string {
    switch (grade) {
        case "EXCELLENT":
            return "bg-green-100 text-green-800";
        case "GOOD":
            return "bg-blue-100 text-blue-800";
        case "AVERAGE":
            return "bg-yellow-100 text-yellow-800";
        default:
            return "bg-red-100 text-red-800";
    }
}

// Surah Journey Item Component
function SurahJourneyItem({
    surah,
    locale
}: {
    surah: { surahNumber: number; surahName: string; surahNameAr: string; status: string; percentage: number };
    locale: string;
}) {
    const t = getTranslations(locale);

    const statusColors = {
        COMPLETED: "bg-emerald-500",
        IN_PROGRESS: "bg-amber-500",
        NOT_STARTED: "bg-gray-300",
    };

    const statusLabels = {
        COMPLETED: t.completed,
        IN_PROGRESS: t.inProgress,
        NOT_STARTED: t.notStarted,
    };

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className={`w-3 h-3 rounded-full ${statusColors[surah.status as keyof typeof statusColors]}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                        {locale === "ar" ? surah.surahNameAr : surah.surahName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {surah.surahNumber}
                    </span>
                </div>
                {surah.status === "IN_PROGRESS" && (
                    <Progress value={surah.percentage} className="h-1 mt-1" />
                )}
            </div>
            <Badge variant="outline" className="text-xs">
                {statusLabels[surah.status as keyof typeof statusLabels]}
            </Badge>
        </div>
    );
}

export default function ParentProgressPage() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = getTranslations(locale);

    const [children, setChildren] = useState<LinkedChild[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [progress, setProgress] = useState<ChildProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<string>("all");

    async function loadChildren() {
        if (!session?.user?.id) return;

        try {
            const data = await getLinkedChildren(session.user.id);
            setChildren(data);
        } catch (error) {
            console.error("Error loading children:", error);
        } finally {
            setLoading(false);
        }
    }

    async function loadProgress(childId: string) {
        if (!session?.user?.id) return;

        try {
            const data = await getChildProgress(childId, session.user.id);
            setProgress(data);
        } catch (error) {
            console.error("Error loading progress:", error);
        }
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push(`/${locale}/login`);
            return;
        }

        if (session?.user?.id) {
            loadChildren();
        }
    }, [session, status, locale, router, loadChildren]);

    useEffect(() => {
        // Check if there's a child ID in URL params
        const childParam = searchParams.get("child");
        if (childParam && children.length > 0) {
            const childExists = children.some(c => c.id === childParam);
            if (childExists) {
                setSelectedChildId(childParam);
            }
        } else if (children.length > 0 && !selectedChildId) {
            setSelectedChildId(children[0].id);
        }
    }, [children, searchParams, selectedChildId]);

    useEffect(() => {
        if (selectedChildId && session?.user?.id) {
            loadProgress(selectedChildId);
        }
    }, [selectedChildId, dateRange, session, loadProgress]);

    function handleChildSelect(childId: string) {
        setSelectedChildId(childId);
        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set("child", childId);
        router.replace(url.toString());
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-4 lg:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (children.length === 0) {
        return (
            <div className="space-y-6 p-6">
                <h1 className="text-3xl font-bold">{t.progress}</h1>
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-xl font-semibold mb-2">
                            {locale === "ar" ? "لا توجد بيانات" : "Aucune donnée disponible"}
                        </h2>
                        <p className="text-muted-foreground">
                            {locale === "ar"
                                ? "اربط طفلاً أولاً لمشاهدة تقدمه"
                                : "Liez un enfant pour voir sa progression"}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const selectedChild = children.find(c => c.id === selectedChildId);

    return (
        <div className="space-y-6 p-6">
            {/* Header with child selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">{t.progress}</h1>

                <div className="flex items-center gap-3">
                    <Select
                        value={selectedChildId || ""}
                        onValueChange={handleChildSelect}
                    >
                        <SelectOption value="">{t.selectChild}</SelectOption>
                        {children.map((child) => (
                            <SelectOption key={child.id} value={child.id}>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={child.image || ""} />
                                        <AvatarFallback className="text-xs">
                                            {child.name?.charAt(0) || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    {child.name}
                                </div>
                            </SelectOption>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Selected Child Header */}
            {selectedChild && (
                <Card className="bg-gradient-to-r from-violet-50 to-purple-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={selectedChild.image || ""} />
                                <AvatarFallback className="bg-violet-100 text-violet-600 text-xl">
                                    {selectedChild.name?.charAt(0) || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedChild.name}</h2>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    {selectedChild.groupName && (
                                        <span>📚 {selectedChild.groupName}</span>
                                    )}
                                    {selectedChild.teacherName && (
                                        <span>👨‍🏫 {selectedChild.teacherName}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            {progress && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t.totalVerses}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-violet-600">
                                {progress.stats.totalVerses}
                            </div>
                            <p className="text-xs text-muted-foreground">{t.verses}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t.averageScore}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                {progress.stats.averageScore}%
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t.streak}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">
                                🔥 {progress.stats.currentStreak}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t.surahsCompleted}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {progress.surahJourney.filter(s => s.status === "COMPLETED").length}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Current Surah */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.currentSurah}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {progress?.currentSurah ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold">
                                        {locale === "ar"
                                            ? progress.currentSurah.surahNameAr
                                            : progress.currentSurah.surahName}
                                    </h3>
                                    <span className="text-sm text-muted-foreground">
                                        {progress.currentSurah.surahNumber}
                                    </span>
                                </div>
                                <Progress value={progress.currentSurah.percentage} className="h-3" />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>
                                        {progress.currentSurah.versesMemorized} / {progress.currentSurah.versesTotal} {t.verses}
                                    </span>
                                    <span>{Math.round(progress.currentSurah.percentage)}%</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                {t.notStarted}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Surah Journey */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.surahJourney}</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                        {progress?.surahJourney ? (
                            <div className="space-y-1">
                                {progress.surahJourney.slice(0, 30).map((surah) => (
                                    <SurahJourneyItem
                                        key={surah.surahNumber}
                                        surah={surah}
                                        locale={locale}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                {t.notStarted}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Evaluations */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.recentEvaluations}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {progress?.recentEvaluations && progress.recentEvaluations.length > 0 ? (
                            <div className="space-y-3">
                                {progress.recentEvaluations.map((evaluation) => (
                                    <div
                                        key={evaluation.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{evaluation.surahName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(evaluation.evaluatedAt)} • {evaluation.teacherName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={getGradeColor(evaluation.grade)}>
                                                {evaluation.finalScore}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                {t.noEvaluations}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.attendance}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {progress?.attendance && progress.attendance.total > 0 ? (
                            <div className="space-y-4">
                                {/* Attendance Stats */}
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="bg-green-50 rounded-lg p-2">
                                        <div className="text-lg font-bold text-green-600">
                                            {progress.attendance.present}
                                        </div>
                                        <div className="text-xs text-green-600">{t.present}</div>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-2">
                                        <div className="text-lg font-bold text-red-600">
                                            {progress.attendance.absent}
                                        </div>
                                        <div className="text-xs text-red-600">{t.absent}</div>
                                    </div>
                                    <div className="bg-yellow-50 rounded-lg p-2">
                                        <div className="text-lg font-bold text-yellow-600">
                                            {progress.attendance.late}
                                        </div>
                                        <div className="text-xs text-yellow-600">{t.late}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        <div className="text-lg font-bold text-gray-600">
                                            {progress.attendance.total}
                                        </div>
                                        <div className="text-xs text-gray-600">Total</div>
                                    </div>
                                </div>

                                {/* Attendance percentage */}
                                <Progress
                                    value={(progress.attendance.present / progress.attendance.total) * 100}
                                    className="h-2"
                                />
                                <p className="text-sm text-muted-foreground text-center">
                                    {Math.round((progress.attendance.present / progress.attendance.total) * 100)}% {t.present.toLowerCase()}
                                </p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                {locale === "ar" ? "لا توجد بيانات حضور" : "Aucune donnée de présence"}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Badges */}
            <Card>
                <CardHeader>
                    <CardTitle>{t.badges}</CardTitle>
                </CardHeader>
                <CardContent>
                    {progress?.badges && progress.badges.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {progress.badges.map((badge) => (
                                <div
                                    key={badge.id}
                                    className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100"
                                >
                                    <div className="text-4xl mb-2">{badge.icon}</div>
                                    <p className="font-medium text-sm">
                                        {locale === "ar" ? badge.nameAr : badge.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(badge.earnedAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">
                            {t.noBadges}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
