"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTeacherStudents, getStudentDetails, getTeacherGroups } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Mes élèves",
            description: "Gérer les élèves de vos groupes",
            search: "Rechercher un élève...",
            filterGroup: "Filtrer par groupe",
            allGroups: "Tous les groupes",
            name: "Nom",
            group: "Groupe",
            currentSurah: "Surah actuel",
            progress: "Progression",
            status: "Statut",
            actions: "Actions",
            viewDetails: "Voir détails",
            sendReminder: "Envoyer rappel",
            noStudents: "Aucun élève trouvé",
            details: "Détails de l'élève",
            contactInfo: "Informations de contact",
            email: "Email",
            memorizationProgress: "Progression de la mémorisation",
            evaluationHistory: "Historique des évaluations",
            badgesEarned: "Badges gagnés",
            attendanceRecord: "Historique de présence",
            present: "Présent",
            absent: "Absent",
            late: "En retard",
            total: "Total",
            close: "Fermer",
            evaluationDate: "Date",
            evaluationScore: "Score",
            noBadges: "Aucun badge",
            noProgress: "Aucune progression",
        },
        ar: {
            title: "طلابيدي",
            description: "إدارة طلاب مجموعتك",
            search: "البحث عن طالب...",
            filterGroup: "تصفية حسب المجموعة",
            allGroups: "جميع المجموعات",
            name: "الاسم",
            group: "المجموعة",
            currentSurah: "السورة الحالية",
            progress: "التقدم",
            status: "الحالة",
            actions: "الإجراءات",
            viewDetails: "عرض التفاصيل",
            sendReminder: "إرسال تذكير",
            noStudents: "لم يتم العثور على طلاب",
            details: "تفاصيل الطالب",
            contactInfo: "معلومات الاتصال",
            email: "البريد الإلكتروني",
            memorizationProgress: "تقدم الحفظ",
            evaluationHistory: "سجل التقييمات",
            badgesEarned: "الشارات المكتسبة",
            attendanceRecord: "سجل الحضور",
            present: "حاضر",
            absent: "غائب",
            late: "متأخر",
            total: "الإجمالي",
            close: "إغلاق",
            evaluationDate: "التاريخ",
            evaluationScore: "النتيجة",
            noBadges: "لا توجد شارات",
            noProgress: "لا يوجد تقدم",
        },
    };
    return translations[locale] || translations.fr;
}

interface Student {
    id: string;
    user: {
        name: string | null;
        email: string;
        image: string | null;
    };
    group: {
        id: string;
        name: string;
    } | null;
}

interface Group {
    id: string;
    name: string;
}

interface StudentDetails {
    id: string;
    user: {
        name: string | null;
        email: string;
        image: string | null;
    };
    group: { id: string; name: string } | null;
    progress: Array<{
        id: string;
        surahNumber: number;
        surahName: string;
        percentage: number;
    }>;
    evaluations: Array<{
        id: string;
        finalScore: number;
        decision: string;
        evaluatedAt: Date;
    }>;
    attendance: {
        present: number;
        absent: number;
        late: number;
        total: number;
    };
    badges: Array<{
        id: string;
        badge: {
            name: string;
            nameAr: string;
            icon: string;
        };
    }>;
}

function StudentsContent() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [students, setStudents] = useState<Student[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");

    // Modal state
    const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const teacherId = session?.user?.id || "teacher-1";
                const [studentsData, groupsData] = await Promise.all([
                    getTeacherStudents(teacherId),
                    getTeacherGroups(teacherId),
                ]);
                setStudents(studentsData);
                setGroups(groupsData);
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        }

        if (session?.user) {
            fetchData();
        }
    }, [session]);

    const handleViewDetails = async (studentId: string) => {
        setDetailsLoading(true);
        setShowModal(true);
        try {
            const details = await getStudentDetails(studentId);
            setSelectedStudent(details);
        } catch (error) {
            console.error("Error fetching student details:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = !selectedGroup || student.group?.id === selectedGroup;
        return matchesSearch && matchesGroup;
    });

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.description}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <Input
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="md:w-64"
                />
                <Select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="md:w-48"
                >
                    <SelectOption value="">{t.allGroups}</SelectOption>
                    {groups.map((group) => (
                        <SelectOption key={group.id} value={group.id}>
                            {group.name}
                        </SelectOption>
                    ))}
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t.name}</TableHead>
                            <TableHead>{t.group}</TableHead>
                            <TableHead>{t.currentSurah}</TableHead>
                            <TableHead>{t.progress}</TableHead>
                            <TableHead>{t.status}</TableHead>
                            <TableHead>{t.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    {t.noStudents}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={student.user.image || ""} />
                                                <AvatarFallback>
                                                    {student.user.name?.charAt(0) || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{student.user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{student.group?.name || "-"}</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>
                                        <Progress value={0} className="h-2 w-20" />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">Actif</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(student.id)}
                                            >
                                                {t.viewDetails}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Student Details Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t.details}</DialogTitle>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-20" />
                            <Skeleton className="h-40" />
                        </div>
                    ) : selectedStudent ? (
                        <div className="space-y-6">
                            {/* Profile */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedStudent.user.image || ""} />
                                    <AvatarFallback>
                                        {selectedStudent.user.name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedStudent.user.name}</h3>
                                    <p className="text-muted-foreground">{selectedStudent.user.email}</p>
                                    {selectedStudent.group && (
                                        <Badge variant="secondary" className="mt-1">
                                            {selectedStudent.group.name}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <h4 className="font-semibold mb-2">{t.memorizationProgress}</h4>
                                {selectedStudent.progress.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">{t.noProgress}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedStudent.progress.slice(0, 5).map((p) => (
                                            <div key={p.id} className="flex items-center justify-between">
                                                <span className="text-sm">{p.surahName}</span>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={p.percentage} className="h-2 w-24" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {Math.round(p.percentage)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Attendance */}
                            <div>
                                <h4 className="font-semibold mb-2">{t.attendanceRecord}</h4>
                                <div className="flex gap-4">
                                    <Badge variant="outline" className="bg-green-50">
                                        {t.present}: {selectedStudent.attendance.present}
                                    </Badge>
                                    <Badge variant="outline" className="bg-red-50">
                                        {t.absent}: {selectedStudent.attendance.absent}
                                    </Badge>
                                    <Badge variant="outline" className="bg-yellow-50">
                                        {t.late}: {selectedStudent.attendance.late}
                                    </Badge>
                                </div>
                            </div>

                            {/* Badges */}
                            <div>
                                <h4 className="font-semibold mb-2">{t.badgesEarned}</h4>
                                {selectedStudent.badges.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">{t.noBadges}</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.badges.map((b) => (
                                            <Badge key={b.id} variant="secondary">
                                                {b.badge.icon} {locale === "ar" ? b.badge.nameAr : b.badge.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            {t.close}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function TeacherStudentsPage() {
    return (
        <Suspense fallback={
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        }>
            <StudentsContent />
        </Suspense>
    );
}
