"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getUsers, createUser, updateUser, deleteUser, getTeachers, getAllGroups } from "@/app/actions/admin";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Gestion des utilisateurs",
            description: "Gérer les utilisateurs du système",
            search: "Rechercher par nom ou email...",
            role: "Rôle",
            all: "Tous",
            admin: "Administrateur",
            teacher: "Enseignant",
            student: "Élève",
            parent: "Parent",
            addUser: "Ajouter un utilisateur",
            editUser: "Modifier l'utilisateur",
            deleteUser: "Supprimer l'utilisateur",
            name: "Nom complet",
            email: "Email",
            password: "Mot de passe",
            phone: "Téléphone",
            gender: "Genre",
            male: "Homme",
            female: "Femme",
            dateOfBirth: "Date de naissance",
            group: "Groupe",
            bio: "Biographie",
            specialization: "Spécialisation",
            status: "Statut",
            active: "Actif",
            inactive: "Inactif",
            createdAt: "Créé le",
            actions: "Actions",
            save: "Enregistrer",
            cancel: "Annuler",
            delete: "Supprimer",
            confirmDelete: "Êtes-vous sûr de vouloir supprimer cet utilisateur ?",
            noUsers: "Aucun utilisateur trouvé",
            previous: "Précédent",
            next: "Suivant",
            page: "Page",
            of: "sur",
            selectRole: "Sélectionner le rôle",
            selectTeacher: "Sélectionner un teacher",
            selectGroup: "Sélectionner un groupe",
        },
        ar: {
            title: "إدارة المستخدمين",
            description: "إدارة مستخدمي النظام",
            search: "البحث بالاسم أو البريد الإلكتروني...",
            role: "الدور",
            all: "الكل",
            admin: "مدير",
            teacher: "معلم",
            student: "طالب",
            parent: "ولي أمر",
            addUser: "إضافة مستخدم",
            editUser: "تعديل المستخدم",
            deleteUser: "حذف المستخدم",
            name: "الاسم الكامل",
            email: "البريد الإلكتروني",
            password: "كلمة المرور",
            phone: "الهاتف",
            gender: "الجنس",
            male: "ذكر",
            female: "أنثى",
            dateOfBirth: "تاريخ الميلاد",
            group: "المجموعة",
            bio: "السيرة الذاتية",
            specialization: "التخصص",
            status: "الحالة",
            active: "نشط",
            inactive: "غير نشط",
            createdAt: "تاريخ الإنشاء",
            actions: "الإجراءات",
            save: "حفظ",
            cancel: "إلغاء",
            delete: "حفظ",
            confirmDelete: "هل أنت متأكد من حذف هذا المستخدم؟",
            noUsers: "لم يتم العثور على مستخدمين",
            previous: "السابق",
            next: "التالي",
            page: "صفحة",
            of: "من",
            selectRole: "اختر الدور",
            selectTeacher: "اختر المعلم",
            selectGroup: "اختر المجموعة",
        },
    };
    return translations[locale] || translations.fr;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    phone: string | null;
    gender: string | null;
    createdAt: Date;
    isActive: boolean | null;
    teacherProfile: { bio: string | null; speciality: string | null } | null;
    studentProfile: { dateOfBirth: Date | null; group: { id: string; name: string } | null } | null;
}

interface Teacher {
    id: string;
    userId: string;
    user: { name: string | null; email: string };
}

interface Group {
    id: string;
    name: string;
    teacher: { user: { name: string | null } };
}

function UsersContent() {
    const searchParams = useSearchParams();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [users, setUsers] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        gender: "",
        role: "STUDENT",
        bio: "",
        specialization: "",
        dateOfBirth: "",
        groupId: "",
    });

    useEffect(() => {
        loadUsers();
        loadTeachers();
        loadGroups();
    }, [search, roleFilter, page]);

    const loadUsers = async () => {
        setLoading(true);
        const result = await getUsers({ search, role: roleFilter, page, limit: 10 });
        if (result.users) {
            setUsers(result.users as User[]);
            setTotalPages(result.pagination.totalPages);
        }
        setLoading(false);
    };

    const loadTeachers = async () => {
        const result = await getTeachers();
        setTeachers(result);
    };

    const loadGroups = async () => {
        const result = await getAllGroups();
        setGroups(result);
    };

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name || "",
                email: user.email,
                password: "",
                phone: user.phone || "",
                gender: user.gender || "",
                role: user.role,
                bio: user.teacherProfile?.bio || "",
                specialization: user.teacherProfile?.speciality || "",
                dateOfBirth: user.studentProfile?.dateOfBirth
                    ? new Date(user.studentProfile.dateOfBirth).toISOString().split("T")[0]
                    : "",
                groupId: user.studentProfile?.group?.id || "",
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: "",
                email: "",
                password: "",
                phone: "",
                gender: "",
                role: "STUDENT",
                bio: "",
                specialization: "",
                dateOfBirth: "",
                groupId: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            const result = await updateUser(editingUser.id, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                gender: formData.gender as "MALE" | "FEMALE" | undefined,
                bio: formData.bio || undefined,
                specialization: formData.specialization || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                groupId: formData.groupId || undefined,
            });
            if (result.success) {
                setIsDialogOpen(false);
                loadUsers();
            }
        } else {
            const result = await createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || undefined,
                gender: formData.gender as "MALE" | "FEMALE" | undefined,
                role: formData.role as "ADMIN" | "TEACHER" | "PARENT" | "STUDENT",
                bio: formData.bio || undefined,
                specialization: formData.specialization || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                groupId: formData.groupId || undefined,
            });
            if (result.success) {
                setIsDialogOpen(false);
                loadUsers();
            }
        }
    };

    const handleDelete = async () => {
        if (deletingUser) {
            await deleteUser(deletingUser.id);
            setIsDeleteDialogOpen(false);
            setDeletingUser(null);
            loadUsers();
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "ADMIN": return "default";
            case "TEACHER": return "secondary";
            case "STUDENT": return "outline";
            case "PARENT": return "destructive";
            default: return "secondary";
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
                    onChange={(e) => setSearch(e.target.value)}
                    className="sm:max-w-xs"
                />
                <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="sm:max-w-xs"
                >
                    <SelectOption value="ALL">{t.all}</SelectOption>
                    <SelectOption value="ADMIN">{t.admin}</SelectOption>
                    <SelectOption value="TEACHER">{t.teacher}</SelectOption>
                    <SelectOption value="STUDENT">{t.student}</SelectOption>
                    <SelectOption value="PARENT">{t.parent}</SelectOption>
                </Select>
                <Button onClick={() => handleOpenDialog()}>
                    ➕ {t.addUser}
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead></TableHead>
                            <TableHead>{t.name}</TableHead>
                            <TableHead>{t.email}</TableHead>
                            <TableHead>{t.role}</TableHead>
                            <TableHead>{t.status}</TableHead>
                            <TableHead>{t.createdAt}</TableHead>
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
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    {t.noUsers}
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {t[user.role.toLowerCase()] || user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive !== false ? "default" : "secondary"}>
                                            {user.isActive !== false ? t.active : t.inactive}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenDialog(user)}
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setDeletingUser(user);
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
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            {t.previous}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            {t.next}
                        </Button>
                    </div>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? t.editUser : t.addUser}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.name}</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.email}</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        {!editingUser && (
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.password}</label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.phone}</label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.gender}</label>
                            <Select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <SelectOption value="">{t.selectRole}</SelectOption>
                                <SelectOption value="MALE">{t.male}</SelectOption>
                                <SelectOption value="FEMALE">{t.female}</SelectOption>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.role}</label>
                            <Select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                disabled={!!editingUser}
                            >
                                <SelectOption value="STUDENT">{t.student}</SelectOption>
                                <SelectOption value="TEACHER">{t.teacher}</SelectOption>
                                <SelectOption value="PARENT">{t.parent}</SelectOption>
                                <SelectOption value="ADMIN">{t.admin}</SelectOption>
                            </Select>
                        </div>

                        {formData.role === "TEACHER" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.specialization}</label>
                                    <Input
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.bio}</label>
                                    <Input
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {formData.role === "STUDENT" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.dateOfBirth}</label>
                                    <Input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.group}</label>
                                    <Select
                                        value={formData.groupId}
                                        onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                    >
                                        <SelectOption value="">{t.selectGroup}</SelectOption>
                                        {groups.map((group) => (
                                            <SelectOption key={group.id} value={group.id}>
                                                {group.name}
                                            </SelectOption>
                                        ))}
                                    </Select>
                                </div>
                            </>
                        )}

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
                        <DialogTitle>{t.deleteUser}</DialogTitle>
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

export default function UsersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <UsersContent />
        </Suspense>
    );
}
