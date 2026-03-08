"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTeacherAnnouncements, createAnnouncement, deleteAnnouncement, getTeacherGroups } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Annonces",
            description: "Gérer les annonces pour vos groupes",
            newAnnouncement: "Nouvelle annonce",
            editAnnouncement: "Modifier l'annonce",
            announcementTitle: "Titre",
            content: "Contenu",
            titleAr: "Titre arabe",
            contentAr: "Contenu arabe",
            target: "Cible",
            group: "Groupe",
            allGroups: "Tous les groupes",
            publish: "Publier",
            cancel: "Annuler",
            save: "Enregistrer",
            delete: "Supprimer",
            confirmDelete: "Êtes-vous sûr de vouloir supprimer cette annonce ?",
            noAnnouncements: "Aucune annonce trouvée",
            pinned: "Épinglé",
            published: "Publié le",
            by: "Par",
            creating: "Création...",
            success: "Annonce créée avec succès",
            error: "Erreur lors de la création",
            general: "Général",
            event: "Événement",
            achievement: "Réalisation",
            urgent: "Urgent",
        },
        ar: {
            title: "الإعلانات",
            description: "إدارة الإعلانات لمجموعاتك",
            newAnnouncement: "إعلان جديد",
            editAnnouncement: "تعديل الإعلان",
            announcementTitle: "العنوان",
            content: "المحتوى",
            titleAr: "العنوان بالعربية",
            contentAr: "المحتوى بالعربية",
            target: "الجمهور",
            group: "المجموعة",
            allGroups: "جميع المجموعات",
            publish: "نشر",
            cancel: "إلغاء",
            save: "حفظ",
            delete: "حذف",
            confirmDelete: "هل أنت متأكد من حذف هذا الإعلان؟",
            noAnnouncements: "لم يتم العثور على إعلانات",
            pinned: "مثبت",
            published: "نشر في",
            by: "بواسطة",
            creating: "جارٍ الإنشاء...",
            success: "تم إنشاء الإعلان بنجاح",
            error: "خطأ في الإنشاء",
            general: "عام",
            event: "حدث",
            achievement: "إنجاز",
            urgent: "عاجل",
        },
    };
    return translations[locale] || translations.fr;
}

interface Announcement {
    id: string;
    title: string;
    titleAr: string | null;
    content: string;
    contentAr: string | null;
    target: string;
    pinned: boolean;
    createdAt: Date;
    isOwner: boolean;
}

interface Group {
    id: string;
    name: string;
}

function AnnouncementsContent() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        titleAr: "",
        content: "",
        contentAr: "",
        target: "GROUP",
        groupId: "",
        pinned: false,
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const teacherId = session?.user?.id || "teacher-1";
                // Get teacher profile ID
                const { prisma } = await import("@/lib/prisma");
                const teacher = await prisma.teacher.findUnique({
                    where: { userId: teacherId },
                });

                const [announcementsData, groupsData] = await Promise.all([
                    getTeacherAnnouncements(teacher?.id || ""),
                    getTeacherGroups(teacherId),
                ]);
                setAnnouncements(announcementsData as Announcement[]);
                setGroups(groupsData);
            } catch (error) {
                console.error("Error fetching announcements:", error);
            } finally {
                setLoading(false);
            }
        }

        if (session?.user) {
            fetchData();
        }
    }, [session]);

    const handleCreate = async () => {
        if (!formData.title || !formData.content) return;

        setSubmitting(true);
        try {
            const teacherId = session?.user?.id || "teacher-1";
            const result = await createAnnouncement(teacherId, {
                title: formData.title,
                titleAr: formData.titleAr || undefined,
                content: formData.content,
                contentAr: formData.contentAr || undefined,
                target: formData.target,
                groupId: formData.groupId || undefined,
                pinned: formData.pinned,
            });

            if (result.success) {
                setShowModal(false);
                setFormData({
                    title: "",
                    titleAr: "",
                    content: "",
                    contentAr: "",
                    target: "GROUP",
                    groupId: "",
                    pinned: false,
                });
                // Refresh announcements
                const teacherId = session?.user?.id || "teacher-1";
                const { prisma } = await import("@/lib/prisma");
                const teacher = await prisma.teacher.findUnique({
                    where: { userId: teacherId },
                });
                const data = await getTeacherAnnouncements(teacher?.id || "");
                setAnnouncements(data as Announcement[]);
            }
        } catch (error) {
            console.error("Error creating announcement:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t.confirmDelete)) return;

        try {
            const teacherId = session?.user?.id || "teacher-1";
            const { prisma } = await import("@/lib/prisma");
            const teacher = await prisma.teacher.findUnique({
                where: { userId: teacherId },
            });

            await deleteAnnouncement(id, teacher?.id || "");

            // Refresh announcements
            const data = await getTeacherAnnouncements(teacher?.id || "");
            setAnnouncements(data as Announcement[]);
        } catch (error) {
            console.error("Error deleting announcement:", error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t.title}</h1>
                    <p className="text-muted-foreground">{t.description}</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    {t.newAnnouncement}
                </Button>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{t.noAnnouncements}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <Card key={announcement.id} className={announcement.pinned ? "border-yellow-400" : ""}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg">
                                                {locale === "ar" && announcement.titleAr
                                                    ? announcement.titleAr
                                                    : announcement.title}
                                            </CardTitle>
                                            {announcement.pinned && (
                                                <Badge variant="secondary" className="bg-yellow-100">
                                                    📌 {t.pinned}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {t.published}: {new Date(announcement.createdAt).toLocaleDateString(
                                                locale === "ar" ? "ar-SA" : "fr-FR"
                                            )}
                                        </p>
                                    </div>
                                    {announcement.isOwner && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(announcement.id)}
                                            >
                                                {t.delete}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">
                                    {locale === "ar" && announcement.contentAr
                                        ? announcement.contentAr
                                        : announcement.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Announcement Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t.newAnnouncement}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>{t.announcementTitle} *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t.announcementTitle}
                            />
                        </div>

                        <div>
                            <Label>{t.titleAr}</Label>
                            <Input
                                value={formData.titleAr}
                                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                                placeholder={t.titleAr}
                                dir="rtl"
                            />
                        </div>

                        <div>
                            <Label>{t.content} *</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder={t.content}
                                rows={4}
                            />
                        </div>

                        <div>
                            <Label>{t.contentAr}</Label>
                            <Textarea
                                value={formData.contentAr}
                                onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
                                placeholder={t.contentAr}
                                rows={4}
                                dir="rtl"
                            />
                        </div>

                        <div>
                            <Label>{t.group}</Label>
                            <Select
                                value={formData.groupId}
                                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                            >
                                <SelectOption value="">{t.allGroups}</SelectOption>
                                {groups.map((group) => (
                                    <SelectOption key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectOption>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            {t.cancel}
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!formData.title || !formData.content || submitting}
                        >
                            {submitting ? t.creating : t.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function TeacherAnnouncementsPage() {
    return (
        <Suspense fallback={
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        }>
            <AnnouncementsContent />
        </Suspense>
    );
}
