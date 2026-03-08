"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getStudentReports, getTeacherReports, getGroupReports } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
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

function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Rapports et statistiques",
            description: "Consulter les statistiques de l'école",
            students: "Élèves",
            teachers: "Enseignants",
            groups: "Groupes",
            progress: "Progression",
            surahsMemorized: "Sourates mémorisées",
            completionRate: "Taux de complétion",
            avgScore: "Score moyen",
            attendanceRate: "Taux de présence",
            group: "Groupe",
            specialization: "Spécialisation",
            groupsCount: "Nombre de groupes",
            totalStudents: "Total élèves",
            evaluations: "Évaluations ce mois",
            enrollment: "Inscription",
            currentEnrollment: "Inscription actuelle",
            maxCapacity: "Capacité max",
            exportCSV: "Exporter CSV",
            print: "Imprimer",
            noData: "Aucune donnée disponible",
        },
        ar: {
            title: "التقارير والإحصائيات",
            description: "عرض إحصائيات المدرسة",
            students: "الطلاب",
            teachers: "المعلمون",
            groups: "المجموعات",
            progress: "التقدم",
            surahsMemorized: "السور المحفوظة",
            completionRate: "معدل الإكمال",
            avgScore: "متوسط الدرجات",
            attendanceRate: "معدل الحضور",
            group: "المجموعة",
            specialization: "التخصص",
            groupsCount: "عدد المجموعات",
            totalStudents: "إجمالي الطلاب",
            evaluations: "التقييمات هذا الشهر",
            enrollment: "التسجيل",
            currentEnrollment: "التسجيل الحالي",
            maxCapacity: "الحد الأقصى",
            exportCSV: "تصدير CSV",
            print: "طباعة",
            noData: "لا توجد بيانات متاحة",
        },
    };
    return translations[locale] || translations.fr;
}

type TabType = "students" | "teachers" | "groups";

interface StudentReport {
    id: string;
    name: string;
    email: string;
    group: string;
    surahsMemorized: number;
    completionRate: number;
    avgEvaluationScore: number;
    attendanceRate: number;
}

interface TeacherReport {
    id: string;
    name: string;
    email: string;
    specialization: string | null;
    groupsCount: number;
    totalStudents: number;
    evaluationsThisMonth: number;
}

interface GroupReport {
    id: string;
    name: string;
    teacher: string;
    currentEnrollment: number;
    maxCapacity: number;
    enrollmentRate: number;
    attendanceRate: number;
}

function ReportsContent() {
    const searchParams = useSearchParams();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [activeTab, setActiveTab] = useState<TabType>("students");
    const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
    const [teacherReports, setTeacherReports] = useState<TeacherReport[]>([]);
    const [groupReports, setGroupReports] = useState<GroupReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, [activeTab]);

    const loadReports = async () => {
        setLoading(true);
        if (activeTab === "students") {
            const data = await getStudentReports();
            setStudentReports(data as StudentReport[]);
        } else if (activeTab === "teachers") {
            const data = await getTeacherReports();
            setTeacherReports(data as TeacherReport[]);
        } else if (activeTab === "groups") {
            const data = await getGroupReports();
            setGroupReports(data as GroupReport[]);
        }
        setLoading(false);
    };

    const handleExportCSV = () => {
        let csvContent = "";
        let headers: string[] = [];
        let rows: string[][] = [];

        if (activeTab === "students") {
            headers = ["Nom", "Email", "Groupe", "Sourates mémorisées", "Taux de complétion", "Score moyen", "Taux de présence"];
            rows = studentReports.map((s) => [
                s.name || "",
                s.email || "",
                s.group,
                s.surahsMemorized.toString(),
                `${s.completionRate.toFixed(1)}%`,
                s.avgEvaluationScore.toFixed(1),
                `${s.attendanceRate.toFixed(1)}%`,
            ]);
        } else if (activeTab === "teachers") {
            headers = ["Nom", "Email", "Spécialisation", "Groupes", "Total élèves", "Évaluations ce mois"];
            rows = teacherReports.map((t) => [
                t.name || "",
                t.email || "",
                t.specialization || "",
                t.groupsCount.toString(),
                t.totalStudents.toString(),
                t.evaluationsThisMonth.toString(),
            ]);
        } else if (activeTab === "groups") {
            headers = ["Nom", "Enseignant", "Inscription actuelle", "Capacité max", "Taux inscription", "Taux présence"];
            rows = groupReports.map((g) => [
                g.name,
                g.teacher,
                g.currentEnrollment.toString(),
                g.maxCapacity.toString(),
                `${g.enrollmentRate.toFixed(1)}%`,
                `${g.attendanceRate.toFixed(1)}%`,
            ]);
        }

        csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${activeTab}_report_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground mt-1">{t.description}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                <Button
                    variant={activeTab === "students" ? "default" : "outline"}
                    onClick={() => setActiveTab("students")}
                >
                    🎓 {t.students}
                </Button>
                <Button
                    variant={activeTab === "teachers" ? "default" : "outline"}
                    onClick={() => setActiveTab("teachers")}
                >
                    📚 {t.teachers}
                </Button>
                <Button
                    variant={activeTab === "groups" ? "default" : "outline"}
                    onClick={() => setActiveTab("groups")}
                >
                    📁 {t.groups}
                </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCSV}>
                    📥 {t.exportCSV}
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                    🖨️ {t.print}
                </Button>
            </div>

            {/* Content */}
            <div className="border rounded-lg">
                {activeTab === "students" && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.students}</TableHead>
                                <TableHead>{t.group}</TableHead>
                                <TableHead>{t.surahsMemorized}</TableHead>
                                <TableHead>{t.completionRate}</TableHead>
                                <TableHead>{t.avgScore}</TableHead>
                                <TableHead>{t.attendanceRate}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}>
                                            <Skeleton className="h-8" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : studentReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        {t.noData}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                studentReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">{report.name || "N/A"}</TableCell>
                                        <TableCell>{report.group}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{report.surahsMemorized}</Badge>
                                        </TableCell>
                                        <TableCell>{report.completionRate.toFixed(1)}%</TableCell>
                                        <TableCell>{report.avgEvaluationScore.toFixed(1)}</TableCell>
                                        <TableCell>{report.attendanceRate.toFixed(1)}%</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}

                {activeTab === "teachers" && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.teachers}</TableHead>
                                <TableHead>{t.specialization}</TableHead>
                                <TableHead>{t.groupsCount}</TableHead>
                                <TableHead>{t.totalStudents}</TableHead>
                                <TableHead>{t.evaluations}</TableHead>
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
                            ) : teacherReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        {t.noData}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                teacherReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">{report.name || "N/A"}</TableCell>
                                        <TableCell>{report.specialization || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{report.groupsCount}</Badge>
                                        </TableCell>
                                        <TableCell>{report.totalStudents}</TableCell>
                                        <TableCell>{report.evaluationsThisMonth}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}

                {activeTab === "groups" && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.groups}</TableHead>
                                <TableHead>{t.teachers}</TableHead>
                                <TableHead>{t.currentEnrollment}</TableHead>
                                <TableHead>{t.maxCapacity}</TableHead>
                                <TableHead>{t.enrollment}</TableHead>
                                <TableHead>{t.attendanceRate}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}>
                                            <Skeleton className="h-8" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : groupReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        {t.noData}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                groupReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">{report.name}</TableCell>
                                        <TableCell>{report.teacher}</TableCell>
                                        <TableCell>{report.currentEnrollment}</TableCell>
                                        <TableCell>{report.maxCapacity}</TableCell>
                                        <TableCell>{report.enrollmentRate.toFixed(1)}%</TableCell>
                                        <TableCell>{report.attendanceRate.toFixed(1)}%</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReportsContent />
        </Suspense>
    );
}
