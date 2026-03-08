"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    getEvaluationsByTeacher,
    createEvaluation,
    getTeacherStudents,
    getTeacherGroups,
    getPendingEvaluations
} from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STRENGTH_TAGS, IMPROVEMENT_TAGS } from "@/lib/validations/evaluation";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Évaluations",
            description: "Gérer les évaluations de vos élèves",
            search: "Rechercher...",
            filterStatus: "Statut",
            all: "Tous",
            completed: "Terminé",
            pending: "En attente",
            newEvaluation: "Nouvelle évaluation",
            student: "Élève",
            surah: "Surah",
            status: "Statut",
            score: "Score",
            date: "Date",
            actions: "Actions",
            viewDetails: "Voir",
            edit: "Modifier",
            noEvaluations: "Aucune évaluation trouvée",
            selectStudent: "Sélectionner un élève",
            memorizationScore: "Score de mémorisation",
            tajweedScore: "Score de tajweed",
            fluencyScore: "Score de fluidité",
            makharijScore: "Score de makharij (optionnel)",
            tafsirScore: "Score de tafsir (optionnel)",
            teacherNotes: "Notes de l'enseignant",
            strengths: "Points forts",
            improvements: "Points à améliorer",
            revisionRequired: "Révision requise",
            decision: "Décision",
            approved: "Approuvé",
            needsRevision: "À réviser",
            rejected: "Rejeté",
            cancel: "Annuler",
            save: "Enregistrer",
            evaluating: "Évaluation en cours...",
            success: "Évaluation créée avec succès",
            error: "Erreur lors de la création",
            finalScore: "Score final",
            selectStrength: "Choisir",
            selectImprovement: "Choisir",
        },
        ar: {
            title: "التقييمات",
            description: "إدارة تقييمات طلابك",
            search: "بحث...",
            filterStatus: "الحالة",
            all: "الكل",
            completed: "مكتمل",
            pending: "قيد الانتظار",
            newEvaluation: "تقييم جديد",
            student: "الطالب",
            surah: "السورة",
            status: "الحالة",
            score: "النتيجة",
            date: "التاريخ",
            actions: "الإجراءات",
            viewDetails: "عرض",
            edit: "تعديل",
            noEvaluations: "لم يتم العثور على تقييمات",
            selectStudent: "اختر طالبًا",
            memorizationScore: "درجة الحفظ",
            tajweedScore: "درجة التجويد",
            fluencyScore: "درجة الفصاحة",
            makharijScore: "درجة مخارج الحروف (اختياري)",
            tafsirScore: "درجة التفسير (اختياري)",
            teacherNotes: "ملاحظات المعلم",
            strengths: "نقاط القوة",
            improvements: "نقاط التحسين",
            revisionRequired: "يحتاج مراجعة",
            decision: "القرار",
            approved: "موافق",
            needsRevision: "يحتاج مراجعة",
            rejected: "مرفوض",
            cancel: "إلغاء",
            save: "حفظ",
            evaluating: "جارٍ التقييم...",
            success: "تم إنشاء التقييم بنجاح",
            error: "خطأ في الإنشاء",
            finalScore: "النتيجة النهائية",
            selectStrength: "اختيار",
            selectImprovement: "اختيار",
        },
    };
    return translations[locale] || translations.fr;
}

interface Evaluation {
    id: string;
    student: {
        id: string;
        name: string;
        image: string | null;
    };
    group: { id: string; name: string } | null;
    surah: string;
    status: string;
    score: number;
    grade: string;
    date: Date;
}

interface Student {
    id: string;
    user: {
        name: string | null;
        image: string | null;
    };
    group: { name: string } | null;
}

interface Group {
    id: string;
    name: string;
}

function EvaluationsContent() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // New evaluation modal
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [formData, setFormData] = useState({
        memorizationScore: 80,
        tajweedScore: 80,
        fluencyScore: 80,
        makharijScore: 80,
        teacherNotes: "",
        strengths: [] as string[],
        improvements: [] as string[],
        revisionRequired: false,
        decision: "approved" as "approved" | "needs_revision" | "rejected",
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const teacherId = session?.user?.id || "teacher-1";
                const [evaluationsData, studentsData, groupsData] = await Promise.all([
                    getEvaluationsByTeacher(teacherId, {}, page, 20),
                    getTeacherStudents(teacherId),
                    getTeacherGroups(teacherId),
                ]);
                setEvaluations(evaluationsData.evaluations);
                setTotal(evaluationsData.total);
                setStudents(studentsData as Student[]);
                setGroups(groupsData);
            } catch (error) {
                console.error("Error fetching evaluations:", error);
            } finally {
                setLoading(false);
            }
        }

        if (session?.user) {
            fetchData();
        }
    }, [session, page]);

    const handleCreateEvaluation = async () => {
        if (!selectedStudent) return;

        setSubmitting(true);
        try {
            const teacherId = session?.user?.id || "teacher-1";
            const result = await createEvaluation(teacherId, {
                studentId: selectedStudent,
                memorizationScore: formData.memorizationScore,
                tajweedScore: formData.tajweedScore,
                fluencyScore: formData.fluencyScore,
                makharijScore: formData.makharijScore,
                teacherNotes: formData.teacherNotes,
                strengths: formData.strengths,
                improvements: formData.improvements,
                revisionRequired: formData.revisionRequired,
                decision: formData.decision,
            });

            if (result.success) {
                setShowModal(false);
                // Refresh evaluations
                const teacherId = session?.user?.id || "teacher-1";
                const data = await getEvaluationsByTeacher(teacherId, {}, page, 20);
                setEvaluations(data.evaluations);
                setFormData({
                    memorizationScore: 80,
                    tajweedScore: 80,
                    fluencyScore: 80,
                    makharijScore: 80,
                    teacherNotes: "",
                    strengths: [],
                    improvements: [],
                    revisionRequired: false,
                    decision: "approved",
                });
                setSelectedStudent("");
            }
        } catch (error) {
            console.error("Error creating evaluation:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const calculateFinalScore = () => {
        const scores = [
            formData.memorizationScore,
            formData.tajweedScore,
            formData.fluencyScore,
            formData.makharijScore,
        ];
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case "EXCELLENT":
                return "bg-green-100 text-green-800";
            case "GOOD":
                return "bg-blue-100 text-blue-800";
            case "AVERAGE":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-red-100 text-red-800";
        }
    };

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t.title}</h1>
                    <p className="text-muted-foreground">{t.description}</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    {t.newEvaluation}
                </Button>
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="md:w-48"
                >
                    <SelectOption value="">{t.all}</SelectOption>
                    <SelectOption value="completed">{t.completed}</SelectOption>
                    <SelectOption value="pending">{t.pending}</SelectOption>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t.student}</TableHead>
                            <TableHead>{t.surah}</TableHead>
                            <TableHead>{t.status}</TableHead>
                            <TableHead>{t.score}</TableHead>
                            <TableHead>{t.date}</TableHead>
                            <TableHead>{t.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {evaluations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    {t.noEvaluations}
                                </TableCell>
                            </TableRow>
                        ) : (
                            evaluations.map((eval_) => (
                                <TableRow key={eval_.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={eval_.student.image || ""} />
                                                <AvatarFallback>
                                                    {eval_.student.name?.charAt(0) || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{eval_.student.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{eval_.surah}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{t.completed}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getGradeColor(eval_.grade)}>
                                            {eval_.score}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(eval_.date).toLocaleDateString(
                                            locale === "ar" ? "ar-SA" : "fr-FR"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">
                                            {t.viewDetails}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* New Evaluation Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t.newEvaluation}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Student Selection */}
                        <div>
                            <Label>{t.selectStudent}</Label>
                            <Select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                            >
                                <SelectOption value="">{t.selectStudent}</SelectOption>
                                {students.map((student) => (
                                    <SelectOption key={student.id} value={student.id}>
                                        {student.user.name} - {student.group?.name || "No Group"}
                                    </SelectOption>
                                ))}
                            </Select>
                        </div>

                        {/* Score Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>{t.memorizationScore} *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.memorizationScore}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        memorizationScore: parseInt(e.target.value) || 0
                                    })}
                                />
                            </div>
                            <div>
                                <Label>{t.tajweedScore} *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.tajweedScore}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        tajweedScore: parseInt(e.target.value) || 0
                                    })}
                                />
                            </div>
                            <div>
                                <Label>{t.fluencyScore} *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.fluencyScore}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        fluencyScore: parseInt(e.target.value) || 0
                                    })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>{t.makharijScore}</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.makharijScore}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    makharijScore: parseInt(e.target.value) || 0
                                })}
                            />
                        </div>

                        {/* Decision */}
                        <div>
                            <Label>{t.decision}</Label>
                            <Select
                                value={formData.decision}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    decision: e.target.value as "approved" | "needs_revision" | "rejected"
                                })}
                            >
                                <SelectOption value="approved">{t.approved}</SelectOption>
                                <SelectOption value="needs_revision">{t.needsRevision}</SelectOption>
                                <SelectOption value="rejected">{t.rejected}</SelectOption>
                            </Select>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label>{t.teacherNotes}</Label>
                            <Textarea
                                value={formData.teacherNotes}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    teacherNotes: e.target.value
                                })}
                                rows={3}
                            />
                        </div>

                        {/* Final Score Display */}
                        <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">{t.finalScore}:</span>
                                <span className="text-2xl font-bold">{calculateFinalScore()}%</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            {t.cancel}
                        </Button>
                        <Button
                            onClick={handleCreateEvaluation}
                            disabled={!selectedStudent || submitting}
                        >
                            {submitting ? t.evaluating : t.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function TeacherEvaluationsPage() {
    return (
        <Suspense fallback={
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        }>
            <EvaluationsContent />
        </Suspense>
    );
}
