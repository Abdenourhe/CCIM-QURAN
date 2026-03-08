"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncementPin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Gestion des annonces",
            description: "Gérer les annonces de l'école",
            search: "Rechercher une annonce...",
            addAnnouncement: "Créer une annonce",
            editAnnouncement: "Modifier l'annonce",
            deleteAnnouncement: "Supprimer l'annonce",
            announcementTitle: "Titre",
            content: "Contenu",
            contentAr: "Contenu arabe",
            titleAr: "Titre arabe",
            type: "Type",
            target: "Cible",
            author: "Auteur",
            publishedAt: "Publié le",
            actions: "Actions",
            save: "Enregistrer",
            cancel: "Annuler",
            delete: "Supprimer",
            confirmDelete: "Êtes-vous sûr de vouloir supprimer cette annonce ?",
            noAnnouncements: "Aucune annonce trouvée",
            general: "Général",
            event: "Événement",
            achievement: "Réalisation",
            urgent: "Urgent",
            all: "Tous",
            pinned: "Épinglé",
            unpinned: "Non épinglé",
            pin: "Épingler",
            unpin: "Désépingler",
            previous: "Précédent",
            next: "Suivant",
            page: "Page",
            of: "sur",
        },
        ar: {
            title: "إدارة الإعلانات",
            description: "إدارة إعلانات المدرسة",
            search: "البحث عن إعلان...",
            addAnnouncement: "إنشاء إعلان",
            editAnnouncement: "تعديل الإعلان",
            deleteAnnouncement: "حذف الإعلان",
            announcementTitle: "العنوان",
            content: "المحتوى",
            contentAr: "المحتوى بالعربية",
            titleAr: "العنوان بالعربية",
            type: "النوع",
            target: "الجمهور",
            author: "المؤلف",
            publishedAt: "تاريخ النشر",
            actions: "الإجراءات",
            save: "حفظ",
            cancel: "إلغاء",
            delete: "حذف",
            confirmDelete: "هل أنت متأكد من حذف هذا الإعلان؟",
            noAnnouncements: "لم يتم العثور على إعلانات",
            general: "عام",
            event: "حدث",
            achievement: "إنجاز",
            urgent: "عاجل",
            all: "الكل",
            pinned: "مثبت",
            unpinned: "غير مثبت",
            pin: "تثبيت",
            unpin: "إلغاء التثبيت",
            previous: "السابق",
            next: "التالي",
            page: "صفحة",
            of: "من",
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
    author: { id: string; name: string | null; email: string };
}

function AnnouncementsContent() {
    const searchParams = useSearchParams();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        titleAr: "",
        content: "",
        contentAr: "",
        target: "ALL",
        pinned: false,
    });

    useEffect(() => {
        loadAnnouncements();
    }, [search, typeFilter, page]);

    const loadAnnouncements = async () => {
        setLoading(true);
        const result = await getAnnouncements({ search, target: typeFilter, page, limit: 10 });
        if (result.announcements) {
            setAnnouncements(result.announcements as Announcement[]);
            setTotalPages(result.pagination.totalPages);
        }
        setLoading(false);
    };

    const handleOpenDialog = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                title: announcement.title,
                titleAr: announcement.titleAr || "",
                content: announcement.content,
                contentAr: announcement.contentAr || "",
                target: announcement.target,
                pinned: announcement.pinned,
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: "",
                titleAr: "",
                content: "",
                contentAr: "",
                target: "ALL",
                pinned: false,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingAnnouncement) {
            const result = await updateAnnouncement(editingAnnouncement.id, {
                title: formData.title,
                titleAr: formData.titleAr || undefined,
                content: formData.content,
                contentAr: formData.contentAr || undefined,
                target: formData.target,
                pinned: formData.pinned,
            });
            if (result.success) {
                setIsDialogOpen(false);
                loadAnnouncements();
            }
        } else {
            // Use a dummy author ID for now - in production, get from session
            const result = await createAnnouncement({
                title: formData.title,
                titleAr: formData.titleAr || undefined,
                content: formData.content,
                contentAr: formData.contentAr || undefined,
                target: formData.target,
                pinned: formData.pinned,
            }, "system");
            if (result.success) {
                setIsDialogOpen(false);
                loadAnnouncements();
            }
        }
    };

    const handleDelete = async () => {
        if (deletingAnnouncement) {
            await deleteAnnouncement(deletingAnnouncement.id);
            setIsDeleteDialogOpen(false);
            setDeletingAnnouncement(null);
            loadAnnouncements();
        }
    };

    const handleTogglePin = async (id: string) => {
        await toggleAnnouncementPin(id);
        loadAnnouncements();
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type?.toUpperCase()) {
            case "URGENT": return "destructive";
            case "EVENT": return "default";
            case "ACHIEVEMENT": return "secondary";
            default: return "outline";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground mt-1">{t.description}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder={t.search}
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    className="sm:max-w-xs"
                />
                <Select
                    value={typeFilter}
                    onChange={(e: any) => setTypeFilter(e.target.value)}
                    className="sm:max-w-xs"
                >
                    <SelectOption value="ALL">{t.all}</SelectOption>
                    <SelectOption value="GENERAL">{t.general}</SelectOption>
                    <SelectOption value="EVENT">{t.event}</SelectOption>
                    <SelectOption value="ACHIEVEMENT">{t.achievement}</SelectOption>
                    <SelectOption value="URGENT">{t.urgent}</SelectOption>
                </Select>
                <Button onClick={() => handleOpenDialog()}>
                    ➕ {t.addAnnouncement}
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead></TableHead>
                            <TableHead>{t.announcementTitle}</TableHead>
                            <TableHead>{t.type}</TableHead>
                            <TableHead>{t.target}</TableHead>
                            <TableHead>{t.author}</TableHead>
                            <TableHead>{t.publishedAt}</TableHead>
                            <TableHead>{t.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7}>
                                        <Skeleton className="h-8" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : announcements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    {t.noAnnouncements}
                                </TableCell>
                            </TableRow>
                        ) : (
                            announcements.map((announcement) => (
                                <TableRow key={announcement.id}>
                                    <TableCell>
                                        {announcement.pinned && (
                                            <Badge variant="default">📌</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {locale === "ar" && announcement.titleAr
                                            ? announcement.titleAr
                                            : announcement.title}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getTypeBadgeVariant(announcement.target)}>
                                            {t[announcement.target?.toLowerCase() || "general"]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{announcement.target}</TableCell>
                                    <TableCell>{announcement.author?.name || announcement.author?.email}</TableCell>
                                    <TableCell>
                                        {new Date(announcement.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleTogglePin(announcement.id)}
                                                title={announcement.pinned ? t.unpin : t.pin}
                                            >
                                                {announcement.pinned ? "📌" : "📍"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenDialog(announcement)}
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setDeletingAnnouncement(announcement);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {t.page} {page} {t.of} {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            {t.previous}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            {t.next}
                        </Button>
                    </div>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAnnouncement ? t.editAnnouncement : t.addAnnouncement}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.announcementTitle}</label>
                            <Input
                                value={formData.title}
                                onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.titleAr}</label>
                            <Input
                                value={formData.titleAr}
                                onChange={(e: any) => setFormData({ ...formData, titleAr: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.content}</label>
                            <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                                value={formData.content}
                                onChange={(e: any) => setFormData({ ...formData, content: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.contentAr}</label>
                            <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                                value={formData.contentAr}
                                onChange={(e: any) => setFormData({ ...formData, contentAr: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.target}</label>
                            <Select
                                value={formData.target}
                                onChange={(e: any) => setFormData({ ...formData, target: e.target.value })}
                            >
                                <SelectOption value="ALL">{t.all}</SelectOption>
                                <SelectOption value="GENERAL">{t.general}</SelectOption>
                                <SelectOption value="EVENT">{t.event}</SelectOption>
                                <SelectOption value="ACHIEVEMENT">{t.achievement}</SelectOption>
                                <SelectOption value="URGENT">{t.urgent}</SelectOption>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="pinned"
                                checked={formData.pinned}
                                onChange={(e: any) => setFormData({ ...formData, pinned: e.target.checked })}
                            />
                            <label htmlFor="pinned" className="text-sm">{t.pinned}</label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                {t.cancel}
                            </Button>
                            <Button type="submit">
                                {t.save}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.deleteAnnouncement}</DialogTitle>
                    </DialogHeader>
                    <p>{t.confirmDelete}</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            {t.cancel}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            {t.delete}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AnnouncementsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AnnouncementsContent />
        </Suspense>
    );
}
