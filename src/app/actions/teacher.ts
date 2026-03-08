"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Use require for Next.js functions to avoid TypeScript issues
const nextCache = require("next/cache");
const revalidatePathFn = nextCache.revalidatePath;

// ==================== VALIDATIONS ====================

// Evaluation input validation
const evaluationInputSchema = z.object({
    studentId: z.string().uuid(),
    progressId: z.string().uuid().optional(),
    surahNumber: z.number().int().min(1).max(114).optional(),
    verseFrom: z.number().int().min(1).optional(),
    verseTo: z.number().int().min(1).optional(),
    memorizationScore: z.number().min(0).max(100),
    tajweedScore: z.number().min(0).max(100),
    fluencyScore: z.number().min(0).max(100),
    makharijScore: z.number().min(0).max(100).optional(),
    tafsirUnderstanding: z.number().min(0).max(100).optional(),
    teacherNotes: z.string().max(2000).optional(),
    strengths: z.array(z.string()).default([]),
    improvements: z.array(z.string()).default([]),
    revisionRequired: z.boolean().default(false),
    decision: z.enum(["approved", "needs_revision", "rejected"]),
});

export type EvaluationInput = z.infer<typeof evaluationInputSchema>;

// Attendance record validation
const attendanceRecordSchema = z.object({
    studentId: z.string().uuid(),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
    notes: z.string().max(500).optional(),
});

const recordAttendanceSchema = z.object({
    date: z.string(),
    groupId: z.string().uuid(),
    records: z.array(attendanceRecordSchema),
});

// Announcement validation
const announcementInputSchema = z.object({
    title: z.string().min(2),
    titleAr: z.string().optional(),
    content: z.string().min(10),
    contentAr: z.string().optional(),
    target: z.string().default("GROUP"),
    groupId: z.string().uuid().optional(),
    pinned: z.boolean().default(false),
});

export type AnnouncementInput = z.infer<typeof announcementInputSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

// ==================== HELPER FUNCTIONS ====================

function calculateFinalScore(data: EvaluationInput): number {
    const scores = [
        data.memorizationScore,
        data.tajweedScore,
        data.fluencyScore,
    ];

    if (data.makharijScore !== undefined && data.makharijScore !== null) {
        scores.push(data.makharijScore);
    }

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function getGradeFromScore(score: number): string {
    if (score >= 90) return "EXCELLENT";
    if (score >= 75) return "GOOD";
    if (score >= 60) return "AVERAGE";
    return "NEEDS_IMPROVEMENT";
}

// ==================== DASHBOARD STATS ====================

export interface TeacherDashboardStats {
    totalStudents: number;
    activeGroups: number;
    pendingEvaluations: number;
    todayAttendance: {
        present: number;
        total: number;
        percentage: number;
    };
    recentEvaluations: Array<{
        id: string;
        student: { user: { name: string | null } };
        memorizationScore: number;
        finalScore: number;
        decision: string;
        evaluatedAt: Date;
    }>;
    studentsNeedingEvaluation: Array<{
        id: string;
        user: { name: string | null; image: string | null };
        group: { name: string } | null;
        currentSurah: string | null;
        progressPercentage: number | null;
    }>;
}

export async function getTeacherDashboardStats(teacherId: string): Promise<TeacherDashboardStats> {
    try {
        // Get teacher's groups
        const teacherGroups = await prisma.group.findMany({
            where: { teacherId },
            include: {
                students: true,
            },
        });

        const groupIds = teacherGroups.map(g => g.id);
        const studentIds = teacherGroups.flatMap(g => g.students.map(s => s.id));

        // Get total students
        const totalStudents = studentIds.length;

        // Get active groups count
        const activeGroups = teacherGroups.length;

        // Get pending evaluations (students without recent evaluations)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentEvaluationStudentIds = await prisma.evaluation.findMany({
            where: {
                teacherId,
                evaluatedAt: { gte: sevenDaysAgo },
            },
            select: { studentId: true },
            distinct: ["studentId"],
        });

        const evaluatedIds = new Set(recentEvaluationStudentIds.map(e => e.studentId));
        const studentsNeedingEvaluation = teacherGroups
            .flatMap(g => g.students)
            .filter(s => !evaluatedIds.has(s.id))
            .slice(0, 5);

        // Get progress for students needing evaluation
        const studentsWithProgress = await Promise.all(
            studentsNeedingEvaluation.map(async (student) => {
                const progress = await prisma.progress.findFirst({
                    where: { studentId: student.id },
                    orderBy: { lastUpdated: "desc" },
                });
                return {
                    id: student.id,
                    user: (student as any).user,
                    group: teacherGroups.find(g => g.students.some(s => s.id === student.id)),
                    currentSurah: progress?.surahName || null,
                    progressPercentage: progress?.percentage || null,
                };
            })
        );

        const pendingEvaluations = studentsNeedingEvaluation.length;

        // Get today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAttendance = await prisma.attendance.findMany({
            where: {
                teacherId,
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        const presentCount = todayAttendance.filter(a => a.status === "PRESENT").length;
        const totalAttendance = todayAttendance.length || totalStudents;

        // Get recent evaluations
        const recentEvaluations = await prisma.evaluation.findMany({
            where: { teacherId },
            orderBy: { evaluatedAt: "desc" },
            take: 5,
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return {
            totalStudents,
            activeGroups,
            pendingEvaluations,
            todayAttendance: {
                present: presentCount,
                total: totalAttendance,
                percentage: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
            },
            recentEvaluations: recentEvaluations.map((e: any) => ({
                id: e.id,
                student: e.student.user,
                memorizationScore: e.grade === "EXCELLENT" ? 95 : e.grade === "GOOD" ? 80 : e.grade === "AVERAGE" ? 65 : 50,
                finalScore: Math.round((e.tajweed + e.fluency + e.makharij) / 3),
                decision: "approved",
                evaluatedAt: e.evaluatedAt,
            })),
            studentsNeedingEvaluation: studentsWithProgress.map(s => ({
                id: s.id,
                user: s.user,
                group: s.group ? { name: s.group.name } : null,
                currentSurah: s.currentSurah,
                progressPercentage: s.progressPercentage,
            })),
        };
    } catch (error) {
        console.error("Error fetching teacher dashboard stats:", error);
        return {
            totalStudents: 0,
            activeGroups: 0,
            pendingEvaluations: 0,
            todayAttendance: { present: 0, total: 0, percentage: 0 },
            recentEvaluations: [],
            studentsNeedingEvaluation: [],
        };
    }
}

// ==================== STUDENTS ====================

export interface TeacherStudent {
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
    progress: Array<{
        id: string;
        surahNumber: number;
        surahName: string;
        percentage: number;
        versesMemorized: number;
        versesTotal: number;
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

export async function getTeacherStudents(teacherId: string, groupId?: string) {
    try {
        const groups = await prisma.group.findMany({
            where: { teacherId },
            include: {
                students: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        const groupIds = groupId ? [groupId] : groups.map(g => g.id);
        const students = await prisma.student.findMany({
            where: {
                groupId: { in: groupIds },
            },
            include: {
                user: true,
                group: true,
            },
            orderBy: { enrolledAt: "desc" },
        });

        return students.map(s => ({
            id: s.id,
            user: {
                name: s.user.name,
                email: s.user.email,
                image: s.user.image,
            },
            group: s.group ? { id: s.group.id, name: s.group.name } : null,
        }));
    } catch (error) {
        console.error("Error fetching teacher students:", error);
        return [];
    }
}

export async function getStudentDetails(studentId: string): Promise<TeacherStudent | null> {
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: true,
                group: true,
            },
        });

        if (!student) return null;

        // Get progress
        const progress = await prisma.progress.findMany({
            where: { studentId },
            orderBy: { surahNumber: "asc" },
        });

        // Get evaluations
        const evaluations = await prisma.evaluation.findMany({
            where: { studentId },
            orderBy: { evaluatedAt: "desc" },
            take: 10,
        });

        // Get attendance stats
        const attendanceRecords = await prisma.attendance.findMany({
            where: { studentId },
        });

        const present = attendanceRecords.filter(a => a.status === "PRESENT").length;
        const absent = attendanceRecords.filter(a => a.status === "ABSENT").length;
        const late = attendanceRecords.filter(a => a.status === "LATE").length;

        // Get badges
        const badges = await prisma.studentBadge.findMany({
            where: { studentId },
            include: {
                badge: true,
            },
        });

        return {
            id: student.id,
            user: {
                name: student.user.name,
                email: student.user.email,
                image: student.user.image,
            },
            group: student.group ? { id: student.group.id, name: student.group.name } : null,
            progress: progress.map(p => ({
                id: p.id,
                surahNumber: p.surahNumber,
                surahName: p.surahName,
                percentage: p.percentage,
                versesMemorized: p.versesMemorized,
                versesTotal: p.versesTotal,
            })),
            evaluations: evaluations.map(e => ({
                id: e.id,
                finalScore: Math.round((e.tajweed + e.fluency + e.makharij) / 3),
                decision: e.grade,
                evaluatedAt: e.evaluatedAt,
            })),
            attendance: {
                present,
                absent,
                late,
                total: attendanceRecords.length,
            },
            badges: badges.map(b => ({
                id: b.id,
                badge: {
                    name: b.badge.name,
                    nameAr: b.badge.nameAr,
                    icon: b.badge.icon,
                },
            })),
        };
    } catch (error) {
        console.error("Error fetching student details:", error);
        return null;
    }
}

// ==================== GROUPS ====================

export interface TeacherGroup {
    id: string;
    name: string;
    description: string | null;
    studentCount: number;
    nextSession: Date | null;
    students: Array<{
        id: string;
        user: {
            name: string | null;
            image: string | null;
        };
        progress: {
            surahName: string | null;
            percentage: number | null;
        } | null;
    }>;
}

export async function getTeacherGroups(teacherId: string) {
    try {
        const groups = await prisma.group.findMany({
            where: { teacherId },
            include: {
                students: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return groups.map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            studentCount: g.students.length,
            nextSession: null, // Could be calculated from schedule
        }));
    } catch (error) {
        console.error("Error fetching teacher groups:", error);
        return [];
    }
}

export async function getGroupDetails(groupId: string, includeStudents: boolean = true) {
    try {
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                students: includeStudents ? {
                    include: {
                        user: true,
                    },
                } : false,
            },
        });

        if (!group) return null;

        const studentsWithProgress = includeStudents ? await Promise.all(
            (group.students || []).map(async (student: any) => {
                const progress = await prisma.progress.findFirst({
                    where: { studentId: student.id },
                    orderBy: { lastUpdated: "desc" },
                });
                return {
                    id: student.id,
                    user: {
                        name: student.user.name,
                        image: student.user.image,
                    },
                    progress: progress ? {
                        surahName: progress.surahName,
                        percentage: progress.percentage,
                    } : null,
                };
            })
        ) : [];

        return {
            id: group.id,
            name: group.name,
            description: group.description,
            studentCount: (group.students || []).length,
            nextSession: null,
            students: studentsWithProgress,
        };
    } catch (error) {
        console.error("Error fetching group details:", error);
        return null;
    }
}

// ==================== EVALUATIONS ====================

export async function createEvaluation(teacherId: string, data: EvaluationInput) {
    try {
        const validatedData = evaluationInputSchema.parse(data);
        const finalScore = calculateFinalScore(validatedData);
        const grade = getGradeFromScore(finalScore);

        const evaluation = await prisma.evaluation.create({
            data: {
                studentId: validatedData.studentId,
                teacherId,
                surahNumber: validatedData.surahNumber || 1,
                verseFrom: validatedData.verseFrom || 1,
                verseTo: validatedData.verseTo || 10,
                grade,
                tajweed: validatedData.tajweedScore,
                fluency: validatedData.fluencyScore,
                makharij: validatedData.makharijScore || validatedData.fluencyScore,
                notes: validatedData.teacherNotes || "",
            },
        });

        revalidatePathFn("/teacher/evaluations");
        revalidatePathFn("/teacher");

        return { success: true, evaluation };
    } catch (error) {
        console.error("Error creating evaluation:", error);
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message };
        }
        return { error: "Failed to create evaluation" };
    }
}

export async function updateEvaluation(id: string, teacherId: string, data: EvaluationInput) {
    try {
        // Check if evaluation is within 7 days
        const existing = await prisma.evaluation.findUnique({
            where: { id },
        });

        if (!existing) {
            return { error: "Evaluation not found" };
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (existing.evaluatedAt < sevenDaysAgo) {
            return { error: "Cannot edit evaluations older than 7 days" };
        }

        if (existing.teacherId !== teacherId) {
            return { error: "Not authorized to edit this evaluation" };
        }

        const validatedData = evaluationInputSchema.partial().parse(data);

        const updateData: any = {};

        if (validatedData.memorizationScore !== undefined) {
            const scores = [
                validatedData.memorizationScore,
                validatedData.tajweedScore ?? existing.tajweed,
                validatedData.fluencyScore ?? existing.fluency,
            ];
            if (validatedData.makharijScore !== undefined) {
                scores.push(validatedData.makharijScore);
            }
            const finalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            updateData.grade = getGradeFromScore(finalScore);
        }

        if (validatedData.tajweedScore !== undefined) updateData.tajweed = validatedData.tajweedScore;
        if (validatedData.fluencyScore !== undefined) updateData.fluency = validatedData.fluencyScore;
        if (validatedData.makharijScore !== undefined) updateData.makharij = validatedData.makharijScore;
        if (validatedData.teacherNotes !== undefined) updateData.notes = validatedData.teacherNotes;

        const evaluation = await prisma.evaluation.update({
            where: { id },
            data: updateData,
        });

        revalidatePathFn("/teacher/evaluations");

        return { success: true, evaluation };
    } catch (error) {
        console.error("Error updating evaluation:", error);
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message };
        }
        return { error: "Failed to update evaluation" };
    }
}

export interface EvaluationFilters {
    status?: "pending" | "completed";
    dateFrom?: string;
    dateTo?: string;
    groupId?: string;
}

export async function getEvaluationsByTeacher(
    teacherId: string,
    filters: Partial<EvaluationFilters> = {},
    page: number = 1,
    limit: number = 20
) {
    try {
        const where: any = { teacherId };

        if (filters.dateFrom || filters.dateTo) {
            where.evaluatedAt = {};
            if (filters.dateFrom) where.evaluatedAt.gte = new Date(filters.dateFrom);
            if (filters.dateTo) where.evaluatedAt.lte = new Date(filters.dateTo);
        }

        const [evaluations, total] = await Promise.all([
            prisma.evaluation.findMany({
                where,
                include: {
                    student: {
                        include: {
                            user: true,
                            group: true,
                        },
                    },
                },
                orderBy: { evaluatedAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.evaluation.count({ where }),
        ]);

        return {
            evaluations: evaluations.map(e => ({
                id: e.id,
                student: {
                    id: e.student.id,
                    name: e.student.user.name,
                    image: e.student.user.image,
                },
                group: e.student.group ? { id: e.student.group.id, name: e.student.group.name } : null,
                surah: `Surah ${e.surahNumber}`,
                status: "completed",
                score: Math.round((e.tajweed + e.fluency + e.makharij) / 3),
                grade: e.grade,
                date: e.evaluatedAt,
            })),
            total,
            pages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Error fetching evaluations:", error);
        return { evaluations: [], total: 0, pages: 0 };
    }
}

export async function getPendingEvaluations(teacherId: string) {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const groups = await prisma.group.findMany({
            where: { teacherId },
            include: {
                students: true,
            },
        });

        const studentIds = groups.flatMap(g => g.students.map(s => s.id));

        const recentEvaluations = await prisma.evaluation.findMany({
            where: {
                studentId: { in: studentIds },
                evaluatedAt: { gte: sevenDaysAgo },
            },
            select: { studentId: true },
            distinct: ["studentId"],
        });

        const evaluatedIds = new Set(recentEvaluations.map(e => e.studentId));
        const pendingStudentIds = studentIds.filter(id => !evaluatedIds.has(id));

        const pendingStudents = await prisma.student.findMany({
            where: { id: { in: pendingStudentIds } },
            include: {
                user: true,
                group: true,
                progress: {
                    orderBy: { lastUpdated: "desc" },
                    take: 1,
                },
            },
        });

        return pendingStudents.map(s => ({
            id: s.id,
            name: s.user.name,
            image: s.user.image,
            group: s.group?.name || "No Group",
            currentSurah: s.progress[0]?.surahName || "Not started",
            progress: s.progress[0]?.percentage || 0,
        }));
    } catch (error) {
        console.error("Error fetching pending evaluations:", error);
        return [];
    }
}

// ==================== ATTENDANCE ====================

export async function recordAttendance(
    teacherId: string,
    date: string,
    groupId: string,
    records: AttendanceRecord[]
) {
    try {
        const validatedData = recordAttendanceSchema.parse({
            date,
            groupId,
            records,
        });

        const attendanceDate = new Date(validatedData.date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Delete existing attendance for this date and group
        await prisma.attendance.deleteMany({
            where: {
                groupId,
                date: attendanceDate,
            },
        });

        // Create new attendance records
        const attendanceRecords = validatedData.records.map(record => ({
            studentId: record.studentId,
            teacherId,
            groupId,
            date: attendanceDate,
            status: record.status,
            notes: record.notes || null,
        }));

        await prisma.attendance.createMany({
            data: attendanceRecords,
        });

        revalidatePathFn("/teacher/attendance");

        return { success: true };
    } catch (error) {
        console.error("Error recording attendance:", error);
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message };
        }
        return { error: "Failed to record attendance" };
    }
}

export async function getAttendanceByGroup(
    groupId: string,
    dateRange?: { from: string; to: string }
) {
    try {
        const where: any = { groupId };

        if (dateRange) {
            where.date = {
                gte: new Date(dateRange.from),
                lte: new Date(dateRange.to),
            };
        }

        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { date: "desc" },
        });

        return attendance.map(a => ({
            id: a.id,
            student: {
                id: a.student.id,
                name: a.student.user.name,
            },
            date: a.date,
            status: a.status,
            notes: a.notes,
        }));
    } catch (error) {
        console.error("Error fetching attendance by group:", error);
        return [];
    }
}

export async function getAttendanceByStudent(studentId: string) {
    try {
        const attendance = await prisma.attendance.findMany({
            where: { studentId },
            orderBy: { date: "desc" },
        });

        return attendance.map(a => ({
            id: a.id,
            date: a.date,
            status: a.status,
            notes: a.notes,
        }));
    } catch (error) {
        console.error("Error fetching attendance by student:", error);
        return [];
    }
}

export async function getTodayAttendance(teacherId: string) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const groups = await prisma.group.findMany({
            where: { teacherId },
            include: {
                students: true,
            },
        });

        const groupIds = groups.map(g => g.id);
        const studentIds = groups.flatMap(g => g.students.map(s => s.id));

        const attendance = await prisma.attendance.findMany({
            where: {
                teacherId,
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        const attendanceMap = new Map(attendance.map(a => [a.studentId, a]));

        // Get all students with their attendance status
        const allStudents = await prisma.student.findMany({
            where: { id: { in: studentIds } },
            include: {
                user: true,
                group: true,
            },
        });

        return allStudents.map(s => ({
            student: {
                id: s.id,
                name: s.user.name,
                image: s.user.image,
            },
            group: s.group?.name || "No Group",
            status: attendanceMap.get(s.id)?.status || null,
            notes: attendanceMap.get(s.id)?.notes,
        }));
    } catch (error) {
        console.error("Error fetching today's attendance:", error);
        return [];
    }
}

// ==================== ANNOUNCEMENTS ====================

export async function createAnnouncement(authorId: string, data: AnnouncementInput) {
    try {
        const validatedData = announcementInputSchema.parse(data);

        // Get teacher profile
        const teacher = await prisma.teacher.findUnique({
            where: { userId: authorId },
        });

        if (!teacher) {
            return { error: "Teacher not found" };
        }

        const announcement = await prisma.announcement.create({
            data: {
                title: validatedData.title,
                titleAr: validatedData.titleAr,
                content: validatedData.content,
                contentAr: validatedData.contentAr,
                target: validatedData.target,
                groupId: validatedData.groupId,
                pinned: validatedData.pinned,
                authorId: teacher.id,
            },
        });

        revalidatePathFn("/teacher/announcements");

        return { success: true, announcement };
    } catch (error) {
        console.error("Error creating announcement:", error);
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message };
        }
        return { error: "Failed to create announcement" };
    }
}

export async function getTeacherAnnouncements(teacherId: string) {
    try {
        // Get teacher's groups
        const groups = await prisma.group.findMany({
            where: { teacherId },
            select: { id: true },
        });

        const groupIds = groups.map(g => g.id);

        // Get teacher profile
        const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId },
        });

        const announcements = await prisma.announcement.findMany({
            where: {
                OR: [
                    { target: "ALL" },
                    { target: "GROUP", groupId: { in: groupIds } },
                    { authorId: teacherId },
                ],
            },
            orderBy: [
                { pinned: "desc" },
                { createdAt: "desc" },
            ],
        });

        return announcements.map(a => ({
            id: a.id,
            title: a.title,
            titleAr: a.titleAr,
            content: a.content,
            contentAr: a.contentAr,
            target: a.target,
            pinned: a.pinned,
            createdAt: a.createdAt,
            isOwner: a.authorId === teacherId,
        }));
    } catch (error) {
        console.error("Error fetching teacher announcements:", error);
        return [];
    }
}

export async function deleteAnnouncement(id: string, teacherId: string) {
    try {
        const announcement = await prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) {
            return { error: "Announcement not found" };
        }

        if (announcement.authorId !== teacherId) {
            return { error: "Not authorized to delete this announcement" };
        }

        await prisma.announcement.delete({
            where: { id },
        });

        revalidatePathFn("/teacher/announcements");

        return { success: true };
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return { error: "Failed to delete announcement" };
    }
}
