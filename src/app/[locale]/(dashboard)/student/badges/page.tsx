"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    getStudentBadges,
    getAllAvailableBadges,
    type BadgeInfo
} from "@/app/actions/student";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            badges: "Badges",
            myBadges: "Mes badges",
            allBadges: "Tous les badges",
            earned: "Gagnés",
            locked: "Verrouillés",
            earnedOn: "Gagné le",
            criteria: "Critères",
            progress: "Progression",
            common: "Commun",
            rare: "Rare",
            epic: "Épique",
            legendary: "Légendaire",
            lockedBadge: "Badge verrouillé",
            unlockCriteria: "Critères pour débloquer",
            noBadgesEarned: "Vous n'avez pas encore gagné de badges",
            keepLearning: "Continuez à apprendre pour gagner des badges !",
            congratulations: "Félicitations !",
            newBadge: "Nouveau badge gagné !",
        },
        ar: {
            badges: "الشارات",
            myBadges: "شاراتي",
            allBadges: "جميع الشارات",
            earned: "مكتسبة",
            locked: "مقفلة",
            earnedOn: "حصلت عليها في",
            criteria: "المعايير",
            progress: "التقدم",
            common: "عادي",
            rare: "نادر",
            epic: "أسطوري",
            legendary: "خرافي",
            lockedBadge: "شارة مقفلة",
            unlockCriteria: "معايير الفتح",
            noBadgesEarned: "لم تكسب أي شارات بعد",
            keepLearning: "استمر في التعلم لكسب الشارات!",
            congratulations: "تهانينا!",
            newBadge: "حصلت على شارة جديدة!",
        },
    };
    return translations[locale] || translations.fr;
}

// Rarity colors
function getRarityColor(rarity: string) {
    switch (rarity) {
        case "legendary":
            return {
                bg: "bg-amber-100 dark:bg-amber-900/30",
                border: "border-amber-400",
                text: "text-amber-700 dark:text-amber-300",
                glow: "shadow-amber-400/50"
            };
        case "epic":
            return {
                bg: "bg-purple-100 dark:bg-purple-900/30",
                border: "border-purple-400",
                text: "text-purple-700 dark:text-purple-300",
                glow: "shadow-purple-400/50"
            };
        case "rare":
            return {
                bg: "bg-blue-100 dark:bg-blue-900/30",
                border: "border-blue-400",
                text: "text-blue-700 dark:text-blue-300",
                glow: "shadow-blue-400/50"
            };
        default:
            return {
                bg: "bg-gray-100 dark:bg-gray-800",
                border: "border-gray-300",
                text: "text-gray-700 dark:text-gray-300",
                glow: ""
            };
    }
}

function getRarityLabel(rarity: string, t: Record<string, string>) {
    switch (rarity) {
        case "legendary":
            return t.legendary;
        case "epic":
            return t.epic;
        case "rare":
            return t.rare;
        default:
            return t.common;
    }
}

export default function StudentBadgesPage() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const t = getTranslations(locale);

    const [badges, setBadges] = useState<BadgeInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");
    const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (session?.user?.id) {
                try {
                    const badgesData = await getStudentBadges(session.user.id);
                    setBadges(badgesData);

                    // Check for newly earned badges (simplified - in real app would check session)
                    const earnedCount = badgesData.filter(b => b.earnedAt).length;
                    if (earnedCount > 0) {
                        setShowCelebration(true);
                        setTimeout(() => setShowCelebration(false), 3000);
                    }
                } catch (error) {
                    console.error("Error fetching badges:", error);
                }
            }
            setLoading(false);
        }

        if (status === "authenticated") {
            fetchData();
        }
    }, [session, status]);

    const filteredBadges = badges.filter(badge => {
        if (filter === "earned") return !!badge.earnedAt;
        if (filter === "locked") return !badge.earnedAt;
        return true;
    });

    const earnedCount = badges.filter(b => b.earnedAt).length;
    const totalCount = badges.length;

    if (loading || status === "loading") {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-48" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Celebration Modal */}
            <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">🎉 {t.congratulations}!</DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="text-6xl mb-4">🏆</div>
                        <p className="text-lg">{t.newBadge}</p>
                        <p className="text-muted-foreground mt-2">{t.keepLearning}</p>
                    </div>
                    <Button onClick={() => setShowCelebration(false)} className="w-full">
                        Awesome!
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">🏆 {t.badges}</h1>
                    <p className="text-muted-foreground">
                        {earnedCount} / {totalCount} {t.earned.toLowerCase()}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                    <TabsTrigger value="all">{t.allBadges} ({totalCount})</TabsTrigger>
                    <TabsTrigger value="earned">{t.earned} ({earnedCount})</TabsTrigger>
                    <TabsTrigger value="locked">{t.locked} ({totalCount - earnedCount})</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Badges Grid */}
            {filteredBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredBadges.map((badge) => {
                        const rarityColors = getRarityColor(badge.rarity);
                        const isEarned = !!badge.earnedAt;

                        return (
                            <Card
                                key={badge.id}
                                className={`
                                    cursor-pointer transition-all duration-300 hover:scale-105
                                    ${rarityColors.bg} ${rarityColors.border}
                                    ${isEarned ? rarityColors.glow + " shadow-lg" : "opacity-70"}
                                `}
                                onClick={() => setSelectedBadge(badge)}
                            >
                                <CardContent className="p-4 text-center">
                                    <div className="text-5xl mb-3">
                                        {isEarned ? badge.icon : "🔒"}
                                    </div>

                                    <h3 className="font-semibold text-sm mb-1">
                                        {locale === "ar" ? badge.nameAr : badge.name}
                                    </h3>

                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                        {badge.description}
                                    </p>

                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${rarityColors.text} ${rarityColors.bg}`}
                                    >
                                        {getRarityLabel(badge.rarity, t)}
                                    </Badge>

                                    {badge.earnedAt && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {t.earnedOn} {new Date(badge.earnedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR")}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-5xl mb-4">🏆</p>
                        <p className="text-lg text-muted-foreground">
                            {filter === "earned" ? t.noBadgesEarned : t.lockedBadge}
                        </p>
                        <p className="text-muted-foreground mt-2">{t.keepLearning}</p>
                    </CardContent>
                </Card>
            )}

            {/* Badge Detail Modal */}
            <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
                {selectedBadge && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-center">
                                <div className="text-6xl mb-4">
                                    {selectedBadge.earnedAt ? selectedBadge.icon : "🔒"}
                                </div>
                                <div className={getRarityColor(selectedBadge.rarity).text}>
                                    {locale === "ar" ? selectedBadge.nameAr : selectedBadge.name}
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <p className="text-center text-muted-foreground">
                                {locale === "ar" ? selectedBadge.descriptionAr : selectedBadge.description}
                            </p>

                            <div className="flex justify-center">
                                <Badge
                                    variant="outline"
                                    className={`
                                        ${getRarityColor(selectedBadge.rarity).bg}
                                        ${getRarityColor(selectedBadge.rarity).text}
                                    `}
                                >
                                    {getRarityLabel(selectedBadge.rarity, t)}
                                </Badge>
                            </div>

                            <div className="bg-muted rounded-lg p-4">
                                <p className="text-sm font-medium mb-1">{t.criteria}:</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedBadge.criteria || (locale === "ar" ? selectedBadge.descriptionAr : selectedBadge.description)}
                                </p>
                            </div>

                            {selectedBadge.earnedAt && (
                                <p className="text-center text-sm">
                                    <span className="text-muted-foreground">{t.earnedOn}: </span>
                                    <span className="font-medium">
                                        {new Date(selectedBadge.earnedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR")}
                                    </span>
                                </p>
                            )}
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
