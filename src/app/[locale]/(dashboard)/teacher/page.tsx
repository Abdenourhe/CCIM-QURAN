"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTeacherDashboardStats } from "@/app/actions/teacher";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            welcome: "Bienvenue",
            teacher: "Enseignant",
            myStudents: "Mes élèves",
            activeGroups: "Groupes actifs",
            pendingEvaluations: "Évaluations en attente",
            todayAttendance: "Présences aujourd'hui",
            studentsNeedingEvaluation: "Élèves à évaluer",
            recentEvaluations: "Évaluations récentes",
            quickActions: "Actions rapides",
            takeAttendance: "Prendre les présences",
            evaluateStudent: "Évaluer un élève",
            postAnnouncement: "Publier une annonce",
            noStudentsToEvaluate: "Aucun élève à évaluer",
            noRecentEvaluations: "Aucune évaluation récente",
            viewAll: "Voir tout",
            progress: "Progression",
            surah: "Surah",
            notStarted: "Non commencé",
            excellent: "Excellent",
            good: "Bien",
            average: "Moyen",
            needsImprovement: "À améliorer",
            present: "Présent(s)",
            total: "Total",
            evaluate: "Évaluer",
            viewDetails: "Voir détails",
        },
        ar: {
            welcome: "أهلاً وسهلاً",
            teacher: "معلم",
            myStudents: "طلابيدي",
            activeGroups: "المجموعات النشطة",
            pendingEvaluations: "التقييمات المعلقة",
            todayAttendance: "الحضور اليوم",
            studentsNeedingEvaluation: "طلاب يحتاجون تقييم",
            recentEvaluations: "التقييمات الأخيرة",
            quickActions: "إجراءات سريعة",
            takeAttendance: "تسجيل الحضور",
            evaluateStudent: "تقييم طالب",
            postAnnouncement: "نشر إعلان",
            noStudentsToEvaluate: "لا يوجد طلاب للتقييم",
            noRecentEvaluations: "لا توجد تقييمات حديثة",
            viewAll: "عرض الكل",
            progress: "التقدم",
            surah: "سورة",
            notStarted: "لم يبدأ",
            excellent: "ممتاز",
            good: "جيد",
            average: "متوسط",
            needsImprovement: "يحتاج تحسن",
            present: "حاضر",
            total: "الإجمالي",
            evaluate: "تقييم",
            viewDetails: "عرض التفاصيل",
        },
    };
    return translations[locale] || translations.fr;
}

interface DashboardStats {
    totalStudents: number;
    activeGroups: number;
    pendingEvaluations: number;
    todayAttendance: {
        present: number;
        total: number;
        percentage: number;
    };
    recentEvaluations: Array<{
        id: string;
        student: { name: string | null };
        memorizationScore: number;
        finalScore: number;
        decision: string;
        evaluatedAt: Date;
    }>;
    studentsNeedingEvaluation: Array<{
        id: string;
        user: { name: string | null; image: string | null };
        group: { name: string } | null;
        currentSurah: string | null;
        progressPercentage: number | null;
    }>;
}

function DashboardContent() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                // In a real app, get the teacher ID from the session
                // For now, we'll use a placeholder
                const teacherId = session?.user?.id || "teacher-1";
                const data = await getTeacherDashboardStats(teacherId);
                setStats(data as unknown as DashboardStats | null);
            } catch (err) {
                setError("Failed to load dashboard data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (session?.user) {
            fetchStats();
        }
    }, [session]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">{error || "Failed to load dashboard"}</p>
            </div>
        );
    }

    const getGradeColor = (score: number) => {
        if (score >= 90) return "bg-green-100 text-green-800";
        if (score >= 75) return "bg-blue-100 text-blue-800";
        if (score >= 60) return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        {t.welcome}, {session?.user?.name || t.teacher}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === "ar" ? "إليك ملخص لطلابك اليوم" : "Voici un aperçu de vos élèves aujourd'hui"}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title={t.myStudents}
                    value={stats.totalStudents}
                    icon="🎓"
                    description={locale === "ar" ? "إجمالي الطلاب" : "Total des élèves"}
                />
                <StatsCard
                    title={t.activeGroups}
                    value={stats.activeGroups}
                    icon="📚"
                    description={locale === "ar" ? "المجموعات المكلفة" : "Groupes assignés"}
                />
                <StatsCard
                    title={t.pendingEvaluations}
                    value={stats.pendingEvaluations}
                    icon="📝"
                    description={locale === "ar" ? "طلاب في الانتظار" : "élèves en attente"}
                />
                <StatsCard
                    title={t.todayAttendance}
                    value={`${stats.todayAttendance.present}/${stats.todayAttendance.total}`}
                    icon="✅"
                    description={`${stats.todayAttendance.percentage}% ${t.present.toLowerCase()}`}
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-card border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4">{t.quickActions}</h2>
                <div className="flex flex-wrap gap-3">
                    <Link href="/teacher/attendance">
                        <Button variant="outline" className="gap-2">
                            <span>📋</span>
                            {t.takeAttendance}
                        </Button>
                    </Link>
                    <Link href="/teacher/evaluations">
                        <Button variant="outline" className="gap-2">
                            <span>✅</span>
                            {t.evaluateStudent}
                        </Button>
                    </Link>
                    <Link href="/teacher/announcements">
                        <Button variant="outline" className="gap-2">
                            <span>📢</span>
                            {t.postAnnouncement}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students Needing Evaluation */}
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">{t.studentsNeedingEvaluation}</h2>
                        <Link href="/teacher/evaluations">
                            <Button variant="ghost" size="sm">
                                {t.viewAll}
                            </Button>
                        </Link>
                    </div>

                    {stats.studentsNeedingEvaluation.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {t.noStudentsToEvaluate}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {stats.studentsNeedingEvaluation.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={student.user.image || ""} />
                                            <AvatarFallback>
                                                {student.user.name?.charAt(0) || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{student.user.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {student.group?.name || "No Group"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {student.currentSurah || t.notStarted}
                                        </p>
                                        {student.progressPercentage !== null && (
                                            <div className="w-24">
                                                <Progress value={student.progressPercentage} className="h-2" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Evaluations */}
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">{t.recentEvaluations}</h2>
                        <Link href="/teacher/evaluations">
                            <Button variant="ghost" size="sm">
                                {t.viewAll}
                            </Button>
                        </Link>
                    </div>

                    {stats.recentEvaluations.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {t.noRecentEvaluations}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentEvaluations.map((eval_) => (
                                <div
                                    key={eval_.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{eval_.student.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(eval_.evaluatedAt).toLocaleDateString(
                                                locale === "ar" ? "ar-SA" : "fr-FR"
                                            )}
                                        </p>
                                    </div>
                                    <Badge className={getGradeColor(eval_.finalScore)}>
                                        {eval_.finalScore}%
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TeacherDashboardPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
