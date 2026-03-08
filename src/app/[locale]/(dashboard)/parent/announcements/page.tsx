"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getParentAnnouncements,
    markAnnouncementRead,
    type ParentAnnouncement,
} from "@/app/actions/parent";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            announcements: "Annonces",
            all: "Toutes",
            important: "Importantes",
            group: "Groupe",
            noAnnouncements: "Aucune annonce",
            readMore: "Lire la suite",
            markAsRead: "Marquer comme lu",
            pinned: "Épinglé",
            postedOn: "Publié le",
            by: "Par",
            filterBy: "Filtrer par",
            schoolWide: "Toute l'école",
        },
        ar: {
            announcements: "الإعلانات",
            all: "الكل",
            important: "مهمة",
            group: "المجموعة",
            noAnnouncements: "لا توجد إعلانات",
            readMore: "اقرأ المزيد",
            markAsRead: "وضع علامة مقروء",
            pinned: "مثبت",
            postedOn: "نشر في",
            by: "بواسطة",
            filterBy: "تصفية حسب",
            schoolWide: "المدرسة كلها",
        },
    };
    return translations[locale] || translations.fr;
}

// Format date
function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ParentAnnouncementsPage() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const router = useRouter();
    const t = getTranslations(locale);

    const [announcements, setAnnouncements] = useState<ParentAnnouncement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<ParentAnnouncement | null>(null);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [activeFilter, setActiveFilter] = useState<"ALL" | "IMPORTANT" | "GROUP">("ALL");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push(`/${locale}/login`);
            return;
        }

        if (session?.user?.id) {
            loadAnnouncements();
        }
    }, [session, status, locale, router]);

    async function loadAnnouncements() {
        if (!session?.user?.id) return;

        try {
            const data = await getParentAnnouncements(session.user.id, activeFilter);
            setAnnouncements(data);
        } catch (error) {
            console.error("Error loading announcements:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (session?.user?.id) {
            loadAnnouncements();
        }
    }, [activeFilter, session]);

    async function handleMarkAsRead(announcementId: string) {
        await markAnnouncementRead(announcementId);
        setReadIds(prev => new Set(prev).add(announcementId));
    }

    function handleOpenAnnouncement(announcement: ParentAnnouncement) {
        setSelectedAnnouncement(announcement);
        if (!readIds.has(announcement.id)) {
            handleMarkAsRead(announcement.id);
        }
    }

    // Filter announcements based on active filter
    const filteredAnnouncements = announcements;

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-12 w-full" />
                <div className="space-y-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">{t.announcements}</h1>
            </div>

            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as "ALL" | "IMPORTANT" | "GROUP")}>
                <TabsList>
                    <TabsTrigger value="ALL">{t.all}</TabsTrigger>
                    <TabsTrigger value="IMPORTANT">⭐ {t.important}</TabsTrigger>
                    <TabsTrigger value="GROUP">📚 {t.group}</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Announcements List */}
            {filteredAnnouncements.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-6xl mb-4">📢</div>
                        <h2 className="text-xl font-semibold mb-2">{t.noAnnouncements}</h2>
                        <p className="text-muted-foreground">
                            {locale === "ar"
                                ? "لم يتم نشر أي إعلانات بعد"
                                : "Aucune annonce n'a encore été publiée"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredAnnouncements.map((announcement) => (
                        <Card
                            key={announcement.id}
                            className={`hover:shadow-md transition-shadow cursor-pointer ${!readIds.has(announcement.id) && !announcement.isRead
                                    ? "border-l-4 border-l-violet-500"
                                    : ""
                                }`}
                            onClick={() => handleOpenAnnouncement(announcement)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {announcement.isPinned && (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                📌 {t.pinned}
                                            </Badge>
                                        )}
                                        {announcement.target === "ALL" && (
                                            <Badge variant="outline">
                                                🏫 {t.schoolWide}
                                            </Badge>
                                        )}
                                        {announcement.groupName && (
                                            <Badge variant="outline">
                                                📚 {announcement.groupName}
                                            </Badge>
                                        )}
                                    </div>
                                    {!readIds.has(announcement.id) && !announcement.isRead && (
                                        <Badge className="bg-violet-100 text-violet-800">
                                            Nouveau
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl mt-2">
                                    {locale === "ar" && announcement.titleAr
                                        ? announcement.titleAr
                                        : announcement.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground line-clamp-2">
                                    {locale === "ar" && announcement.contentAr
                                        ? announcement.contentAr
                                        : announcement.content}
                                </p>
                                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                    <span>
                                        {t.postedOn} {formatDate(announcement.createdAt)}
                                    </span>
                                    <Button variant="ghost" size="sm">
                                        {t.readMore} →
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Announcement Detail Modal */}
            <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
                {selectedAnnouncement && (
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                {selectedAnnouncement.isPinned && (
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                        📌 {t.pinned}
                                    </Badge>
                                )}
                                {selectedAnnouncement.target === "ALL" && (
                                    <Badge variant="outline">
                                        🏫 {t.schoolWide}
                                    </Badge>
                                )}
                                {selectedAnnouncement.groupName && (
                                    <Badge variant="outline">
                                        📚 {selectedAnnouncement.groupName}
                                    </Badge>
                                )}
                            </div>
                            <DialogTitle className="text-2xl">
                                {locale === "ar" && selectedAnnouncement.titleAr
                                    ? selectedAnnouncement.titleAr
                                    : selectedAnnouncement.title}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="prose prose-sm max-w-none">
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {locale === "ar" && selectedAnnouncement.contentAr
                                        ? selectedAnnouncement.contentAr
                                        : selectedAnnouncement.content}
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
                                <span>
                                    {t.postedOn} {formatDate(selectedAnnouncement.createdAt)}
                                </span>
                                {selectedAnnouncement.authorName && (
                                    <span>
                                        {t.by} {selectedAnnouncement.authorName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
