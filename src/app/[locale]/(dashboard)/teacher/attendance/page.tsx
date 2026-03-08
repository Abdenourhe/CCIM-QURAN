"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    getTodayAttendance,
    recordAttendance,
    getTeacherGroups,
    getAttendanceByGroup
} from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Présences",
            description: "Gérer les présences de vos élèves",
            selectDate: "Sélectionner une date",
            selectGroup: "Sélectionner un groupe",
            allGroups: "Tous les groupes",
            student: "Élève",
            group: "Groupe",
            status: "Statut",
            notes: "Notes",
            actions: "Actions",
            present: "Présent",
            absent: "Absent",
            late: "En retard",
            excused: "Excusé",
            save: "Enregistrer",
            markAllPresent: "Tout marquer présent",
            markAllAbsent: "Tout marquer absent",
            noStudents: "Aucun élève",
            saving: "Enregistrement...",
            success: "Présences enregistrées",
            error: "Erreur d'enregistrement",
            attendanceStats: "Statistiques de présence",
        },
        ar: {
            title: "الحضور",
            description: "إدارة حضور طلابك",
            selectDate: "اختر التاريخ",
            selectGroup: "اختر المجموعة",
            allGroups: "جميع المجموعات",
            student: "الطالب",
            group: "المجموعة",
            status: "الحالة",
            notes: "ملاحظات",
            actions: "الإجراءات",
            present: "حاضر",
            absent: "غائب",
            late: "متأخر",
            excused: "معذور",
            save: "حفظ",
            markAllPresent: "تحديد الكل حاضر",
            markAllAbsent: "تحديد الكل غائب",
            noStudents: "لا يوجد طلاب",
            saving: "جارٍ الحفظ...",
            success: "تم حفظ الحضور",
            error: "خطأ في الحفظ",
            attendanceStats: "إحصائيات الحضور",
        },
    };
    return translations[locale] || translations.fr;
}

interface StudentAttendance {
    student: {
        id: string;
        name: string;
        image: string | null;
    };
    group: string;
    status: string | null;
    notes: string | null;
}

interface Group {
    id: string;
    name: string;
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

function AttendanceContent() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [saving, setSaving] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});

    useEffect(() => {
        async function fetchData() {
            try {
                const teacherId = session?.user?.id || "teacher-1";
                const [attendanceData, groupsData] = await Promise.all([
                    getTodayAttendance(teacherId),
                    getTeacherGroups(teacherId),
                ]);
                setStudents(attendanceData as StudentAttendance[]);
                setGroups(groupsData);

                // Initialize attendance records
                const records: Record<string, { status: AttendanceStatus; notes: string }> = {};
                (attendanceData as StudentAttendance[]).forEach(s => {
                    records[s.student.id] = {
                        status: (s.status as AttendanceStatus) || "PRESENT",
                        notes: s.notes || "",
                    };
                });
                setAttendanceRecords(records);
            } catch (error) {
                console.error("Error fetching attendance:", error);
            } finally {
                setLoading(false);
            }
        }

        if (session?.user) {
            fetchData();
        }
    }, [session]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status,
            },
        }));
    };

    const handleNotesChange = (studentId: string, notes: string) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                notes,
            },
        }));
    };

    const markAll = (status: AttendanceStatus) => {
        const newRecords = { ...attendanceRecords };
        Object.keys(newRecords).forEach(studentId => {
            newRecords[studentId] = {
                ...newRecords[studentId],
                status,
            };
        });
        setAttendanceRecords(newRecords);
    };

    const handleSave = async () => {
        if (!selectedGroup) return;

        setSaving(true);
        try {
            const teacherId = session?.user?.id || "teacher-1";
            const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
                studentId,
                status: data.status,
                notes: data.notes,
            }));

            await recordAttendance(teacherId, selectedDate, selectedGroup, records);
        } catch (error) {
            console.error("Error saving attendance:", error);
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: AttendanceStatus) => {
        switch (status) {
            case "PRESENT":
                return <Badge className="bg-green-100 text-green-800">{t.present}</Badge>;
            case "ABSENT":
                return <Badge className="bg-red-100 text-red-800">{t.absent}</Badge>;
            case "LATE":
                return <Badge className="bg-yellow-100 text-yellow-800">{t.late}</Badge>;
            case "EXCUSED":
                return <Badge className="bg-blue-100 text-blue-800">{t.excused}</Badge>;
            default:
                return <Badge variant="outline">-</Badge>;
        }
    };

    const filteredStudents = selectedGroup
        ? students.filter(s => s.group === groups.find(g => g.id === selectedGroup)?.name)
        : students;

    const stats = {
        present: filteredStudents.filter(s => attendanceRecords[s.student.id]?.status === "PRESENT").length,
        absent: filteredStudents.filter(s => attendanceRecords[s.student.id]?.status === "ABSENT").length,
        late: filteredStudents.filter(s => attendanceRecords[s.student.id]?.status === "LATE").length,
        total: filteredStudents.length,
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-20 w-full" />
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

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex gap-4 flex-1">
                    <div>
                        <Label>{t.selectDate}</Label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>{t.selectGroup}</Label>
                        <Select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
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

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => markAll("PRESENT")}>
                        {t.markAllPresent}
                    </Button>
                    <Button variant="outline" onClick={() => markAll("ABSENT")}>
                        {t.markAllAbsent}
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                            <p className="text-sm text-muted-foreground">{t.present}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                            <p className="text-sm text-muted-foreground">{t.absent}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                            <p className="text-sm text-muted-foreground">{t.late}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-sm text-muted-foreground">{t.attendanceStats}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance List */}
            <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {filteredStudents.map((student) => (
                        <Card key={student.student.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={student.student.image || ""} />
                                            <AvatarFallback>
                                                {student.student.name?.charAt(0) || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{student.student.name}</p>
                                            <p className="text-sm text-muted-foreground">{student.group}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* Status Buttons */}
                                    <div className="grid grid-cols-4 gap-1">
                                        <Button
                                            size="sm"
                                            variant={attendanceRecords[student.student.id]?.status === "PRESENT" ? "default" : "outline"}
                                            onClick={() => handleStatusChange(student.student.id, "PRESENT")}
                                            className="text-xs"
                                        >
                                            {t.present}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={attendanceRecords[student.student.id]?.status === "ABSENT" ? "destructive" : "outline"}
                                            onClick={() => handleStatusChange(student.student.id, "ABSENT")}
                                            className="text-xs"
                                        >
                                            {t.absent}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={attendanceRecords[student.student.id]?.status === "LATE" ? "default" : "outline"}
                                            onClick={() => handleStatusChange(student.student.id, "LATE")}
                                            className="text-xs"
                                        >
                                            {t.late}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={attendanceRecords[student.student.id]?.status === "EXCUSED" ? "default" : "outline"}
                                            onClick={() => handleStatusChange(student.student.id, "EXCUSED")}
                                            className="text-xs"
                                        >
                                            {t.excused}
                                        </Button>
                                    </div>

                                    {/* Notes */}
                                    <Textarea
                                        placeholder={t.notes}
                                        value={attendanceRecords[student.student.id]?.notes || ""}
                                        onChange={(e) => handleNotesChange(student.student.id, e.target.value)}
                                        rows={2}
                                        className="text-sm"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            {selectedGroup && (
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? t.saving : t.save}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function TeacherAttendancePage() {
    return (
        <Suspense fallback={
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        }>
            <AttendanceContent />
        </Suspense>
    );
}
