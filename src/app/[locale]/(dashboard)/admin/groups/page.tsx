"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getGroups, createGroup, updateGroup, deleteGroup, getTeachers } from "@/app/actions/admin";
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
            title: "Gestion des groupes",
            description: "Gérer les groupes de l'école",
            search: "Rechercher un groupe...",
            addGroup: "Créer un groupe",
            editGroup: "Modifier le groupe",
            deleteGroup: "Supprimer le groupe",
            name: "Nom du groupe",
            description: "Description",
            teacher: "Enseignant",
            students: "Élèves",
            capacity: "Capacité",
            actions: "Actions",
            save: "Enregistrer",
            cancel: "Annuler",
            delete: "Supprimer",
            confirmDelete: "Êtes-vous sûr de vouloir supprimer ce groupe ?",
            noGroups: "Aucun groupe trouvé",
            selectTeacher: "Sélectionner un enseignant",
            previous: "Précédent",
            next: "Suivant",
            page: "Page",
            of: "sur",
        },
        ar: {
            title: "إدارة المجموعات",
            description: "إدارة مجموعات المدرسة",
            search: "البحث عن مجموعة...",
            addGroup: "إنشاء مجموعة",
            editGroup: "تعديل المجموعة",
            deleteGroup: "حذف المجموعة",
            name: "اسم المجموعة",
            description: "الوصف",
            teacher: "المعلم",
            students: "الطلاب",
            capacity: "السعة",
            actions: "الإجراءات",
            save: "حفظ",
            cancel: "إلغاء",
            delete: "حذف",
            confirmDelete: "هل أنت متأكد من حذف هذه المجموعة؟",
            noGroups: "لم يتم العثور على مجموعات",
            selectTeacher: "اختر معلمًا",
            previous: "السابق",
            next: "التالي",
            page: "صفحة",
            of: "من",
        },
    };
    return translations[locale] || translations.fr;
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    teacherId: string;
    teacher: { user: { name: string | null } };
    students: { id: string }[];
}

interface Teacher {
    id: string;
    userId: string;
    user: { name: string | null; email: string };
}

function GroupsContent() {
    const searchParams = useSearchParams();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [groups, setGroups] = useState<Group[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        teacherId: "",
    });

    const loadGroups = async () => {
        setLoading(true);
        const result = await getGroups({ search, page, limit: 10 });
        if (result.groups) {
            setGroups(result.groups as Group[]);
            setTotalPages(result.pagination.totalPages);
        }
        setLoading(false);
    };

    const loadTeachers = async () => {
        const result = await getTeachers();
        setTeachers(result);
    };

    useEffect(() => {
        loadGroups();
        loadTeachers();
    }, [search, page]);

    const handleOpenDialog = (group?: Group) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name,
                description: group.description || "",
                teacherId: group.teacherId,
            });
        } else {
            setEditingGroup(null);
            setFormData({
                name: "",
                description: "",
                teacherId: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingGroup) {
            const result = await updateGroup(editingGroup.id, {
                name: formData.name,
                description: formData.description || undefined,
                teacherId: formData.teacherId,
            });
            if (result.success) {
                setIsDialogOpen(false);
                loadGroups();
            }
        } else {
            const result = await createGroup({
                name: formData.name,
                description: formData.description || undefined,
                teacherId: formData.teacherId,
            });
            if (result.success) {
                setIsDialogOpen(false);
                loadGroups();
            }
        }
    };

    const handleDelete = async () => {
        if (deletingGroup) {
            await deleteGroup(deletingGroup.id);
            setIsDeleteDialogOpen(false);
            setDeletingGroup(null);
            loadGroups();
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
                <Button onClick={() => handleOpenDialog()}>
                    ➕ {t.addGroup}
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t.name}</TableHead>
                            <TableHead>{t.teacher}</TableHead>
                            <TableHead>{t.students}</TableHead>
                            <TableHead>{t.capacity}</TableHead>
                            <TableHead>{t.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}>
                                        <Skeleton className="h-8" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : groups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    {t.noGroups}
                                </TableCell>
                            </TableRow>
                        ) : (
                            groups.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell className="font-medium">{group.name}</TableCell>
                                    <TableCell>{group.teacher?.user?.name || "N/A"}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {group.students?.length || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>20</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenDialog(group)}
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setDeletingGroup(group);
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGroup ? t.editGroup : t.addGroup}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.name}</label>
                            <Input
                                value={formData.name}
                                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.description}</label>
                            <Input
                                value={formData.description}
                                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.teacher}</label>
                            <Select
                                value={formData.teacherId}
                                onChange={(e: any) => setFormData({ ...formData, teacherId: e.target.value })}
                                required
                            >
                                <SelectOption value="">{t.selectTeacher}</SelectOption>
                                {teachers.map((teacher) => (
                                    <SelectOption key={teacher.id} value={teacher.id}>
                                        {teacher.user.name || teacher.user.email}
                                    </SelectOption>
                                ))}
                            </Select>
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
                        <DialogTitle>{t.deleteGroup}</DialogTitle>
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

export default function GroupsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GroupsContent />
        </Suspense>
    );
}
