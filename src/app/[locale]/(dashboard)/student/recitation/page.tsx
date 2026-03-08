"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    getStudentProgress,
    markReadyToRecite,
    getPendingRecitations,
    getRecitationHistory,
    type SurahProgress,
    type RecitationSubmission
} from "@/app/actions/student";
import { useToast } from "@/hooks/use-toast";

// History item interface - matches what getRecitationHistory returns
interface RecitationHistoryItem {
    id: string;
    surahName: string;
    verseRange: string;
    date: string;
    score: number;
    grade: string;
    teacherName: string;
    strengths: string[];
    improvements: string[];
    notes?: string;
    feedback?: string;
}

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            recitation: "Récitation",
            readyToRecite: "Prêt à réciter",
            markReady: "Je suis prêt à réciter",
            currentSurah: "Sourate actuelle",
            surah: "Sourate",
            verses: "versets",
            versesReady: "Versets prêts",
            versesReadyPlaceholder: "ex: 1-10 ou 1,3,5",
            selectVerses: "Sélectionnez les versets que vous avez mémorisés",
            submit: "Soumettre",
            submitting: "Envoi en cours...",
            pendingApproval: "En attente d'approbation",
            history: "Historique",
            noPending: "Aucune soumission en attente",
            noHistory: "Aucun historique de récitation",
            startMemorizing: "Commencez à mémoriser pour soumettre",
            success: "Soumission réussie !",
            successMessage: "Votre enseignant sera notifié",
            error: "Erreur",
            errorMessage: "Échec de la soumission",
            cancel: "Annuler",
            viewFeedback: "Voir feedback",
            score: "Score",
            teacher: "Enseignant",
            date: "Date",
            approved: "Approuvé",
            needsRevision: "À réviser",
            excellent: "Excellent",
            good: "Bien",
            average: "Moyen",
            needsImprovement: "À améliorer",
            progress: "Progression",
            readyToSubmit: "Prêt à soumettre",
            notStarted: "Commencez votre première sourate",
        },
        ar: {
            recitation: "التسميع",
            readyToRecite: "مستعد للتسميع",
            markReady: "أنا مستعد للتسميع",
            currentSurah: "السورة الحالية",
            surah: "سورة",
            verses: "آيات",
            versesReady: "الآيات جاهزة",
            versesReadyPlaceholder: "مثال: 1-10 أو 1،3،5",
            selectVerses: "اختر الآيات التي حفظتها",
            submit: "إرسال",
            submitting: "جارٍ الإرسال...",
            pendingApproval: "في انتظار الموافقة",
            history: "السجل",
            noPending: "لا يوجد طلبات معلقة",
            noHistory: "لا يوجد سجل تسميع",
            startMemorizing: "ابدأ بالحفظ للإرسال",
            success: "تم الإرسال بنجاح!",
            successMessage: "سيتم إخطار معلمك",
            error: "خطأ",
            errorMessage: "فشل الإرسال",
            cancel: "إلغاء",
            viewFeedback: "عرض الملاحظات",
            score: "النتيجة",
            teacher: "المعلم",
            date: "التاريخ",
            approved: "موافق",
            needsRevision: "يحتاج مراجعة",
            excellent: "ممتاز",
            good: "جيد",
            average: "متوسط",
            needsImprovement: "يحتاج تحسين",
            progress: "التقدم",
            readyToSubmit: "جاهز للإرسال",
            notStarted: "ابدأ سورتك الأولى",
        },
    };
    return translations[locale] || translations.fr;
}

// Simplified surah info - just a few common ones for demo
function getSurahInfo(surahNumber: number) {
    const info: Record<number, { name: string; nameAr: string; verses: number }> = {
        1: { name: "Al-Fatiha", nameAr: "الفاتحة", verses: 7 },
        2: { name: "Al-Baqarah", nameAr: "البقرة", verses: 286 },
        36: { name: "Yasin", nameAr: "يس", verses: 83 },
        67: { name: "Al-Mulk", nameAr: "الملك", verses: 30 },
        112: { name: "Al-Ikhlas", nameAr: "الإخلاص", verses: 4 },
    };

    if (info[surahNumber]) return info[surahNumber];
    return { name: `Surah ${surahNumber}`, nameAr: `سورة ${surahNumber}`, verses: 10 };
}

// Grade badge helper
function getGradeBadge(grade: string, t: Record<string, string>) {
    const gradeMap: Record<string, { label: string; className: string }> = {
        EXCELLENT: { label: t.excellent, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        GOOD: { label: t.good, className: "bg-blue-100 text-blue-700 border-blue-200" },
        AVERAGE: { label: t.average, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
        NEEDS_IMPROVEMENT: { label: t.needsImprovement, className: "bg-red-100 text-red-700 border-red-200" },
    };

    const config = gradeMap[grade] || gradeMap.NEEDS_IMPROVEMENT;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export default function StudentRecitationPage() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const t = getTranslations(locale);
    const { toast } = useToast();

    const [currentSurah, setCurrentSurah] = useState<SurahProgress | undefined>();
    const [pendingSubmissions, setPendingSubmissions] = useState<RecitationSubmission[]>([]);
    const [history, setHistory] = useState<RecitationHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [versesReady, setVersesReady] = useState("");

    useEffect(() => {
        async function fetchData() {
            if (session?.user?.id) {
                try {
                    const [progressData, pending, historyData] = await Promise.all([
                        getStudentProgress(session.user.id),
                        getPendingRecitations(session.user.id),
                        getRecitationHistory(session.user.id)
                    ]);

                    setCurrentSurah(progressData.currentSurah);
                    setPendingSubmissions(pending.filter(s =>
                        s.status === "READY_FOR_RECITATION" || s.status === "PENDING_TEACHER_APPROVAL"
                    ) as unknown as RecitationSubmission[]);
                    setHistory(historyData as unknown as RecitationHistoryItem[]);
                } catch (error) {
                    console.error("Error fetching recitation data:", error);
                }
            }
            setLoading(false);
        }

        if (status === "authenticated") {
            fetchData();
        }
    }, [session, status]);

    const handleSubmitReady = async () => {
        if (!currentSurah || !versesReady.trim()) return;

        setSubmitting(true);
        try {
            const result = await markReadyToRecite({
                progressId: currentSurah.id,
                versesReady: versesReady.trim()
            });

            if (result.success) {
                toast({
                    title: t.success,
                    description: t.successMessage,
                    variant: "default"
                });
                setVersesReady("");
                // Refresh data
                if (session?.user?.id) {
                    const progressData = await getStudentProgress(session.user.id);
                    setCurrentSurah(progressData.currentSurah);
                }
            } else {
                toast({
                    title: t.error,
                    description: result.message || t.errorMessage,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error submitting:", error);
            toast({
                title: t.error,
                description: t.errorMessage,
                variant: "destructive"
            });
        }
        setSubmitting(false);
    };

    if (loading || status === "loading") {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">🎙️ {t.recitation}</h1>
            </div>

            <Tabs defaultValue="ready" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ready">{t.readyToRecite}</TabsTrigger>
                    <TabsTrigger value="pending">{t.pendingApproval}</TabsTrigger>
                    <TabsTrigger value="history">{t.history}</TabsTrigger>
                </TabsList>

                {/* Ready to Recite Tab */}
                <TabsContent value="ready">
                    {currentSurah ? (
                        <Card className="border-2 border-amber-200 bg-amber-50/50">
                            <CardHeader>
                                <CardTitle>{t.currentSurah}</CardTitle>
                                <CardDescription>
                                    {t.selectVerses}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Current Surah Info */}
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold mb-1">
                                            {t.surah}: {getSurahInfo(currentSurah.surahNumber).name}
                                        </h3>
                                        <p className="text-lg text-muted-foreground mb-4">
                                            {getSurahInfo(currentSurah.surahNumber).nameAr}
                                        </p>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{t.progress}:</span>
                                                <span className="font-medium">
                                                    {currentSurah.versesMemorized} / {currentSurah.versesTotal} {t.verses}
                                                </span>
                                            </div>
                                            <Progress value={currentSurah.percentage} className="h-3" />
                                        </div>
                                    </div>

                                    <div className="w-full md:w-80 bg-white rounded-lg p-4 border">
                                        <div className="text-sm font-medium mb-3">
                                            📖 {t.versesReady}
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="verses">
                                                    {t.verses}
                                                </Label>
                                                <Input
                                                    id="verses"
                                                    placeholder={t.versesReadyPlaceholder}
                                                    value={versesReady}
                                                    onChange={(e) => setVersesReady(e.target.value)}
                                                    className="mt-1"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t.versesReadyPlaceholder}
                                                </p>
                                            </div>

                                            <Button
                                                onClick={handleSubmitReady}
                                                disabled={submitting || !versesReady.trim()}
                                                className="w-full bg-amber-500 hover:bg-amber-600"
                                            >
                                                {submitting ? t.submitting : t.markReady}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress visualization */}
                                <div className="bg-white rounded-lg p-4 border">
                                    <h4 className="font-medium mb-3">{t.progress}</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {Array.from({ length: Math.min(currentSurah.versesTotal, 50) }, (_, i) => i + 1).map(verse => (
                                            <div
                                                key={verse}
                                                className={`
                                                    w-6 h-6 rounded text-xs flex items-center justify-center
                                                    ${verse <= currentSurah.versesMemorized
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-gray-200 text-gray-500"}
                                                `}
                                            >
                                                {verse}
                                            </div>
                                        ))}
                                        {currentSurah.versesTotal > 50 && (
                                            <div className="text-xs text-muted-foreground self-center ml-2">
                                                +{currentSurah.versesTotal - 50} more
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                                            <span>{t.memorized || "Memorized"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-gray-200 rounded"></div>
                                            <span>Not started</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-5xl mb-4">📖</p>
                                <p className="text-lg text-muted-foreground">{t.notStarted}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Pending Approval Tab */}
                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.pendingApproval}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingSubmissions.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingSubmissions.map((submission) => (
                                        <div
                                            key={submission.id}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                                        >
                                            <div>
                                                <h4 className="font-medium">{submission.surahName}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {t.verses}: {submission.verseRange}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t.date}: {new Date(submission.submittedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR")}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                                ⏳ {t.pendingApproval}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="text-4xl mb-4">✅</p>
                                    <p>{t.noPending}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.history}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-4 rounded-lg border"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-medium">{item.surahName}</h4>
                                                    {getGradeBadge(item.grade, t)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {t.verses}: {item.verseRange}
                                                </p>
                                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span>{t.teacher}: {item.teacherName}</span>
                                                    <span>{t.date}: {new Date(item.date).toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR")}</span>
                                                    {item.score && (
                                                        <span>{t.score}: {item.score}%</span>
                                                    )}
                                                </div>
                                                {item.feedback && (
                                                    <p className="text-sm mt-2 p-2 bg-muted rounded">
                                                        💬 {item.feedback}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="text-4xl mb-4">📜</p>
                                    <p>{t.noHistory}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
