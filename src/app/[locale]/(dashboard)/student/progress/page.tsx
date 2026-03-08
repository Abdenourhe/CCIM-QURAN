"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    getStudentProgress,
    getAllSurahProgress,
    type SurahProgress
} from "@/app/actions/student";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            progress: "Progression",
            currentSurah: "Sourate actuelle",
            surah: "Sourate",
            verses: "versets",
            progressLabel: "Progression",
            status: "Statut",
            daysRemaining: "jours restants",
            memorizationJourney: "Parcours de mémorisation",
            statistics: "Statistiques",
            totalVerses: "Versets mémorisés",
            averageScore: "Score moyen",
            speed: "Vitesse (versets/semaine)",
            bestStreak: "Meilleure série",
            history: "Historique",
            notStarted: "Non commencé",
            inProgress: "En cours",
            underReview: "En révision",
            readyToRecite: "Prêt à réciter",
            pendingApproval: "En attente d'approbation",
            memorized: "Mémorisé",
            needsRevision: "À réviser",
            viewDetails: "Voir détails",
            noProgress: "Commencez votre parcours de mémorisation !",
            startNow: "Commencer maintenant",
            completed: "Terminé",
            inProgressLabel: "En cours",
            notStartedLabel: "Non commencé",
            recentProgress: "Progression récente",
        },
        ar: {
            progress: "التقدم",
            currentSurah: "السورة الحالية",
            surah: "سورة",
            verses: "آيات",
            progressLabel: "التقدم",
            status: "الحالة",
            daysRemaining: "أيام متبقية",
            memorizationJourney: "رحلة الحفظ",
            statistics: "الإحصائيات",
            totalVerses: "الآيات المحفوظة",
            averageScore: "المتوسط",
            speed: "السرعة (آيات/أسبوع)",
            bestStreak: "أفضل سلسلة",
            history: "السجل",
            notStarted: "لم يبدأ",
            inProgress: "قيد التنفيذ",
            underReview: "قيد المراجعة",
            readyToRecite: "مستعد للتسميع",
            pendingApproval: "في انتظار الموافقة",
            memorized: "محفوظ",
            needsRevision: "يحتاج مراجعة",
            viewDetails: "عرض التفاصيل",
            noProgress: "ابدأ رحلة الحفظ الآن!",
            startNow: "ابدأ الآن",
            completed: "مكتمل",
            inProgressLabel: "قيد التنفيذ",
            notStartedLabel: "لم يبدأ",
            recentProgress: "التقدم الأخير",
        },
    };
    return translations[locale] || translations.fr;
}

// Status badge helper
function getStatusBadge(status: SurahProgress["status"], t: Record<string, string>) {
    const statusMap: Record<string, { label: string; className: string }> = {
        NOT_STARTED: { label: t.notStarted, className: "bg-gray-100 text-gray-600 border-gray-200" },
        IN_PROGRESS: { label: t.inProgress, className: "bg-blue-100 text-blue-700 border-blue-200" },
        UNDER_REVIEW: { label: t.underReview, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
        READY_FOR_RECITATION: { label: t.readyToRecite, className: "bg-purple-100 text-purple-700 border-purple-200" },
        PENDING_TEACHER_APPROVAL: { label: t.pendingApproval, className: "bg-orange-100 text-orange-700 border-orange-200" },
        MEMORIZED: { label: t.memorized, className: "bg-green-100 text-green-700 border-green-200" },
        NEEDS_REVISION: { label: t.needsRevision, className: "bg-red-100 text-red-700 border-red-200" },
    };

    const config = statusMap[status] || statusMap.NOT_STARTED;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

// Surah info helper
function getSurahInfo(surahNumber: number) {
    const surahs: Record<number, { name: string; nameAr: string; verses: number }> = {
        1: { name: "Al-Fatiha", nameAr: "الفاتحة", verses: 7 },
        2: { name: "Al-Baqarah", nameAr: "البقرة", verses: 286 },
        3: { name: "Aal-E-Imran", nameAr: "آل عمران", verses: 200 },
        4: { name: "An-Nisa", nameAr: "النساء", verses: 176 },
        5: { name: "Al-Maidah", nameAr: "المائدة", verses: 120 },
        6: { name: "Al-Anam", nameAr: "الأنعام", verses: 165 },
        7: { name: "Al-Araf", nameAr: "الأعراف", verses: 206 },
        8: { name: "Al-Anfal", nameAr: "الأنفال", verses: 75 },
        9: { name: "At-Tawbah", nameAr: "التوبة", verses: 129 },
        10: { name: "Yunus", nameAr: "يونس", verses: 109 },
        11: { name: "Hud", nameAr: "هود", verses: 123 },
        12: { name: "Yusuf", nameAr: "يوسف", verses: 111 },
        13: { name: "Ar-Rad", nameAr: "الرعد", verses: 43 },
        14: { name: "Ibrahim", nameAr: "إبراهيم", verses: 52 },
        15: { name: "Al-Hijr", nameAr: "الحجر", verses: 99 },
        16: { name: "An-Nahl", nameAr: "النحل", verses: 128 },
        17: { name: "Al-Isra", nameAr: "الإسراء", verses: 111 },
        18: { name: "Al-Kahf", nameAr: "الكهف", verses: 110 },
        19: { name: "Maryam", nameAr: "مريم", verses: 98 },
        20: { name: "Ta-Ha", nameAr: "طه", verses: 135 },
        21: { name: "Al-Anbiya", nameAr: "الأنبياء", verses: 112 },
        22: { name: "Al-Hajj", nameAr: "الحج", verses: 78 },
        23: { name: "Al-Muminun", nameAr: "المؤمنون", verses: 118 },
        24: { name: "An-Nur", nameAr: "النور", verses: 64 },
        25: { name: "Al-Furqan", nameAr: "الفرقان", verses: 77 },
        26: { name: "Ash-Shuara", nameAr: "الشعراء", verses: 227 },
        27: { name: "An-Naml", nameAr: "النمل", verses: 93 },
        28: { name: "Al-Qasas", nameAr: "القصص", verses: 88 },
        29: { name: "Al-Ankabut", nameAr: "العنكبوت", verses: 69 },
        30: { name: "Ar-Rum", nameAr: "الروم", verses: 60 },
        31: { name: "Luqman", nameAr: "لقمان", verses: 34 },
        32: { name: "As-Sajdah", nameAr: "السجدة", verses: 30 },
        33: { name: "Al-Ahzab", nameAr: "الأحزاب", verses: 73 },
        34: { name: "Saba", nameAr: "سبأ", verses: 54 },
        35: { name: "Fatir", nameAr: "فاطر", verses: 45 },
        36: { name: "Yasin", nameAr: "يس", verses: 83 },
        37: { name: "As-Saffat", nameAr: "الصافات", verses: 182 },
        38: { name: "Sad", nameAr: "ص", verses: 88 },
        39: { name: "Az-Zumar", nameAr: "الزمر", verses: 75 },
        40: { name: "Ghafir", nameAr: "غافر", verses: 85 },
        41: { name: "Fussilat", nameAr: "فصلت", verses: 54 },
        42: { name: "Ash-Shura", nameAr: "الشورى", verses: 53 },
        43: { name: "Az-Zukhruf", nameAr: "الزخرف", verses: 89 },
        44: { name: "Ad-Dukhan", nameAr: "الدخان", verses: 59 },
        45: { name: "Al-Jathiyah", nameAr: "الجاثية", verses: 37 },
        46: { name: "Al-Ahqaf", nameAr: "الأحقاف", verses: 35 },
        47: { name: "Muhammad", nameAr: "محمد", verses: 38 },
        48: { name: "Al-Fath", nameAr: "الفتح", verses: 29 },
        49: { name: "Al-Hujurat", nameAr: "الحجرات", verses: 18 },
        50: { name: "Qaf", nameAr: "ق", verses: 45 },
        51: { name: "Adh-Dhariyat", nameAr: "الذاريات", verses: 60 },
        52: { name: "At-Tur", nameAr: "الطور", verses: 49 },
        53: { name: "An-Najm", nameAr: "النجم", verses: 62 },
        54: { name: "Al-Qamar", nameAr: "القمر", verses: 55 },
        55: { name: "Ar-Rahman", nameAr: "الرحمن", verses: 78 },
        56: { name: "Al-Waqiah", nameAr: "الواقعة", verses: 96 },
        57: { name: "Al-Hadid", nameAr: "الحديد", verses: 29 },
        58: { name: "Al-Mujadila", nameAr: "المجادلة", verses: 22 },
        59: { name: "Al-Hashr", nameAr: "الحشر", verses: 24 },
        60: { name: "Al-Mumtahanah", nameAr: "الممتحنة", verses: 13 },
        61: { name: "As-Saf", nameAr: "الصف", verses: 14 },
        62: { name: "Al-Jumuah", nameAr: "الجمعة", verses: 11 },
        63: { name: "Al-Munafiqun", nameAr: "المنافقون", verses: 11 },
        64: { name: "At-Taghabun", nameAr: "التغابن", verses: 18 },
        65: { name: "At-Talaq", nameAr: "الطلاق", verses: 12 },
        66: { name: "At-Tahrim", nameAr: "التحريم", verses: 12 },
        67: { name: "Al-Mulk", nameAr: "الملك", verses: 30 },
        68: { name: "Al-Qalam", nameAr: "القلم", verses: 52 },
        69: { name: "Al-Haqqah", nameAr: "الحاقة", verses: 52 },
        70: { name: "Al-Maarij", nameAr: "المعارج", verses: 44 },
        71: { name: "Nuh", nameAr: "نوح", verses: 28 },
        72: { name: "Al-Jinn", nameAr: "الجن", verses: 28 },
        73: { name: "Al-Muzzammil", nameAr: "المزمل", verses: 20 },
        74: { name: "Al-Muddaththir", nameAr: "المدثر", verses: 56 },
        75: { name: "Al-Qiyamah", nameAr: "القيامة", verses: 40 },
        76: { name: "Al-Insan", nameAr: "الإنسان", verses: 31 },
        77: { name: "Al-Mursalat", nameAr: "المرسلات", verses: 50 },
        78: { name: "An-Naba", nameAr: "النبأ", verses: 40 },
        79: { name: "An-Naziat", nameAr: "النازعات", verses: 46 },
        80: { name: "Abasa", nameAr: "عبس", verses: 42 },
        81: { name: "At-Takwir", nameAr: "التكوير", verses: 29 },
        82: { name: "Al-Infitar", nameAr: "الانفطار", verses: 19 },
        83: { name: "Al-Mutaffifin", nameAr: "المطففين", verses: 36 },
        84: { name: "Al-Inshiqaq", nameAr: "الانشقاق", verses: 25 },
        85: { name: "Al-Buruj", nameAr: "البروج", verses: 22 },
        86: { name: "At-Tariq", nameAr: "الطارق", verses: 17 },
        87: { name: "Al-Ala", nameAr: "الأعلى", verses: 19 },
        88: { name: "Al-Ghashiyah", nameAr: "الغاشية", verses: 26 },
        89: { name: "Al-Fajr", nameAr: "الفجر", verses: 30 },
        90: { name: "Al-Balad", nameAr: "البلد", verses: 20 },
        91: { name: "Ash-Shams", nameAr: "الشمس", verses: 15 },
        92: { name: "Al-Layl", nameAr: "الليل", verses: 21 },
        93: { name: "Ad-Duha", nameAr: "الضحى", verses: 11 },
        94: { name: "Ash-Sharh", nameAr: "الشرح", verses: 8 },
        95: { name: "At-Tin", nameAr: "التين", verses: 8 },
        96: { name: "Al-Alaq", nameAr: "العلق", verses: 19 },
        97: { name: "Al-Qadr", nameAr: "القدر", verses: 5 },
        98: { name: "Al-Bayyinah", nameAr: "البينة", verses: 8 },
        99: { name: "Az-Zalzalah", nameAr: "الزلزلة", verses: 8 },
        100: { name: "Al-Adiyat", nameAr: "العاديات", verses: 11 },
        101: { name: "Al-Qariah", nameAr: "القارعة", verses: 11 },
        102: { name: "At-Takathur", nameAr: "التكاثر", verses: 8 },
        103: { name: "Al-Asr", nameAr: "العصر", verses: 3 },
        104: { name: "Al-Humazah", nameAr: "الهمزة", verses: 9 },
        105: { name: "Al-Fil", nameAr: "الفيل", verses: 5 },
        106: { name: "Quraysh", nameAr: "قريش", verses: 4 },
        107: { name: "Al-Maun", nameAr: "الماعون", verses: 7 },
        108: { name: "Al-Kawthar", nameAr: "الكوثر", verses: 3 },
        109: { name: "Al-Kafirun", nameAr: "الكافرون", verses: 6 },
        110: { name: "An-Nasr", nameAr: "النصر", verses: 3 },
        111: { name: "Al-Masad", nameAr: "المسد", verses: 5 },
        112: { name: "Al-Ikhlas", nameAr: "الإخلاص", verses: 4 },
        113: { name: "Al-Falaq", nameAr: "الفلق", verses: 5 },
        114: { name: "An-Nas", nameAr: "الناس", verses: 6 },
    };
    return surahs[surahNumber] || { name: `Surah ${surahNumber}`, nameAr: `سورة ${surahNumber}`, verses: 0 };
}

export default function StudentProgressPage() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const t = getTranslations(locale);

    const [progressData, setProgressData] = useState<{
        currentSurah?: SurahProgress;
        statistics: {
            totalVersesMemorized: number;
            averageScore: number;
            memorizationSpeed: number;
            bestStreak: number;
        };
        recentProgress: SurahProgress[];
    } | null>(null);
    const [allSurahProgress, setAllSurahProgress] = useState<SurahProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (session?.user?.id) {
                try {
                    const [progress, allProgress] = await Promise.all([
                        getStudentProgress(session.user.id),
                        getAllSurahProgress(session.user.id)
                    ]);
                    setProgressData(progress);
                    setAllSurahProgress(allProgress);
                } catch (error) {
                    console.error("Error fetching progress:", error);
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
                <Skeleton className="h-12 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64 lg:col-span-2" />
                </div>
            </div>
        );
    }

    const memorizedCount = allSurahProgress.filter(p => p.status === "MEMORIZED").length;
    const inProgressCount = allSurahProgress.filter(p => p.status === "IN_PROGRESS").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">📊 {t.progress}</h1>
            </div>

            <Tabs defaultValue="journey" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="journey">{t.memorizationJourney}</TabsTrigger>
                    <TabsTrigger value="current">{t.currentSurah}</TabsTrigger>
                    <TabsTrigger value="stats">{t.statistics}</TabsTrigger>
                </TabsList>

                {/* Memorization Journey */}
                <TabsContent value="journey">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.memorizationJourney}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                                <div className="text-center p-2 rounded bg-green-100 text-green-700">
                                    <div className="text-2xl font-bold">{memorizedCount}</div>
                                    <div className="text-xs">{t.memorized}</div>
                                </div>
                                <div className="text-center p-2 rounded bg-blue-100 text-blue-700">
                                    <div className="text-2xl font-bold">{inProgressCount}</div>
                                    <div className="text-xs">{t.inProgressLabel}</div>
                                </div>
                                <div className="text-center p-2 rounded bg-gray-100 text-gray-600">
                                    <div className="text-2xl font-bold">{114 - memorizedCount - inProgressCount}</div>
                                    <div className="text-xs">{t.notStartedLabel}</div>
                                </div>
                            </div>

                            <ScrollArea className="h-[400px]">
                                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                                    {Array.from({ length: 114 }, (_, i) => i + 1).map(num => {
                                        const progress = allSurahProgress.find(p => p.surahNumber === num);
                                        const surahInfo = getSurahInfo(num);

                                        let bgClass = "bg-gray-200 hover:bg-gray-300";
                                        if (progress?.status === "MEMORIZED") {
                                            bgClass = "bg-emerald-500 hover:bg-emerald-600 text-white";
                                        } else if (progress?.status === "IN_PROGRESS") {
                                            bgClass = "bg-blue-500 hover:bg-blue-600 text-white";
                                        } else if (progress?.percentage > 0) {
                                            bgClass = "bg-yellow-500 hover:bg-yellow-600 text-white";
                                        }

                                        return (
                                            <div
                                                key={num}
                                                className={`aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${bgClass}`}
                                                title={`${surahInfo.name} - ${progress?.percentage || 0}%`}
                                            >
                                                {num}
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>

                            <div className="flex gap-4 mt-4 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                                    <span className="text-sm">{t.memorized}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                    <span className="text-sm">{t.inProgress}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                    <span className="text-sm">{t.underReview}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                    <span className="text-sm">{t.notStarted}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Current Surah */}
                <TabsContent value="current">
                    {progressData?.currentSurah ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t.currentSurah}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold mb-1">
                                            {t.surah}: {getSurahInfo(progressData.currentSurah.surahNumber).name}
                                        </h3>
                                        <p className="text-lg text-muted-foreground mb-4">
                                            {getSurahInfo(progressData.currentSurah.surahNumber).nameAr}
                                        </p>

                                        <div className="flex items-center gap-4 mb-4">
                                            {getStatusBadge(progressData.currentSurah.status, t)}
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>{t.verses}: {progressData.currentSurah.versesMemorized} / {progressData.currentSurah.versesTotal}</span>
                                                    <span className="font-medium">{progressData.currentSurah.percentage}%</span>
                                                </div>
                                                <Progress value={progressData.currentSurah.percentage} className="h-3" />
                                            </div>

                                            <p className="text-sm text-muted-foreground">
                                                {progressData.currentSurah.versesMemorized} {t.verses} {t.memorized.toLowerCase()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-64 bg-muted rounded-lg p-4">
                                        <h4 className="font-semibold mb-2">📊 {t.progressLabel}</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>{t.surah}:</span>
                                                <span className="font-medium">{progressData.currentSurah.surahNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>{t.verses}:</span>
                                                <span className="font-medium">{progressData.currentSurah.versesTotal}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>{t.progressLabel}:</span>
                                                <span className="font-medium">{progressData.currentSurah.percentage}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>{t.status}:</span>
                                                <span className="font-medium">
                                                    {progressData.currentSurah.status === "IN_PROGRESS" ? t.inProgress :
                                                        progressData.currentSurah.status === "MEMORIZED" ? t.memorized : t.notStarted}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-5xl mb-4">📖</p>
                                <p className="text-lg text-muted-foreground mb-4">{t.noProgress}</p>
                                <Button>{t.startNow}</Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Statistics */}
                <TabsContent value="stats">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.statistics}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                                    <div className="text-3xl font-bold text-emerald-600">
                                        {progressData?.statistics.totalVersesMemorized || 0}
                                    </div>
                                    <div className="text-sm text-emerald-700">{t.totalVerses}</div>
                                </div>

                                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {progressData?.statistics.averageScore || 0}%
                                    </div>
                                    <div className="text-sm text-blue-700">{t.averageScore}</div>
                                </div>

                                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 text-center">
                                    <div className="text-3xl font-bold text-purple-600">
                                        {progressData?.statistics.memorizationSpeed || 0}
                                    </div>
                                    <div className="text-sm text-purple-700">{t.speed}</div>
                                </div>

                                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-center">
                                    <div className="text-3xl font-bold text-orange-600">
                                        {progressData?.statistics.bestStreak || 0}
                                    </div>
                                    <div className="text-sm text-orange-700">{t.bestStreak}</div>
                                </div>
                            </div>

                            {/* Recent Progress Table */}
                            {progressData?.recentProgress && progressData.recentProgress.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="font-semibold mb-3">{t.recentProgress}</h3>
                                    <div className="space-y-2">
                                        {progressData.recentProgress.slice(0, 5).map((p) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                            >
                                                <div>
                                                    <span className="font-medium">
                                                        {getSurahInfo(p.surahNumber).name}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm mr-2">
                                                        ({getSurahInfo(p.surahNumber).nameAr})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm">
                                                        {p.versesMemorized}/{p.versesTotal} {t.verses}
                                                    </span>
                                                    <Progress value={p.percentage} className="w-24 h-2" />
                                                    <span className="text-sm font-medium w-12 text-right">
                                                        {p.percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
