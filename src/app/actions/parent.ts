"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ==================== TYPES ====================

export interface ParentDashboardStats {
    totalChildren: number;
    totalStars: number;
    childrenMakingProgress: number;
    recentAnnouncements: Array<{
        id: string;
        title: string;
        titleAr: string | null;
        content: string;
        contentAr: string | null;
        createdAt: Date;
        isImportant: boolean;
    }>;
}

export interface ChildSummary {
    id: string;
    name: string | null;
    image: string | null;
    currentSurah: string | null;
    surahProgress: number | null;
    stars: number;
    status: "ACTIVE" | "NEEDS_ATTENTION";
    groupName: string | null;
    teacherName: string | null;
}

export interface LinkedChild {
    id: string;
    name: string | null;
    image: string | null;
    dateOfBirth: Date | null;
    enrolledAt: Date;
    groupName: string | null;
    groupId: string | null;
    teacherName: string | null;
    teacherId: string | null;
    stars: number;
    surahsMemorized: number;
    currentStreak: number;
    latestEvaluationScore: number | null;
    latestEvaluationDate: Date | null;
    status: "ACTIVE" | "NEEDS_ATTENTION";
    lastActivityDate: Date | null;
}

export interface ChildProgress {
    currentSurah: {
        surahNumber: number;
        surahName: string;
        surahNameAr: string;
        versesTotal: number;
        versesMemorized: number;
        percentage: number;
    } | null;
    surahJourney: Array<{
        surahNumber: number;
        surahName: string;
        surahNameAr: string;
        status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
        percentage: number;
    }>;
    recentEvaluations: Array<{
        id: string;
        surahNumber: number;
        surahName: string;
        grade: string;
        finalScore: number;
        tajweed: number;
        fluency: number;
        makharij: number;
        notes: string | null;
        evaluatedAt: Date;
        teacherName: string;
    }>;
    attendance: {
        present: number;
        absent: number;
        late: number;
        total: number;
        recent: Array<{
            date: Date;
            status: string;
        }>;
    };
    badges: Array<{
        id: string;
        name: string;
        nameAr: string;
        icon: string;
        earnedAt: Date;
    }>;
    stats: {
        totalVerses: number;
        averageScore: number;
        currentStreak: number;
    };
}

export interface ParentAnnouncement {
    id: string;
    title: string;
    titleAr: string | null;
    content: string;
    contentAr: string | null;
    target: string;
    groupId: string | null;
    groupName: string | null;
    authorName: string | null;
    createdAt: Date;
    isPinned: boolean;
    isRead: boolean;
}

// ==================== DASHBOARD ====================

export async function getParentDashboardStats(parentId: string): Promise<ParentDashboardStats> {
    try {
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: {
                children: {
                    include: {
                        user: true,
                        group: {
                            include: {
                                teacher: {
                                    include: { user: true },
                                },
                            },
                        },
                        progress: true,
                        evaluations: true,
                        attendance: true,
                    },
                },
            },
        });

        if (!parent) {
            return {
                totalChildren: 0,
                totalStars: 0,
                childrenMakingProgress: 0,
                recentAnnouncements: [],
            };
        }

        // Get all child IDs for querying
        const childIds = parent.children.map(c => c.id);

        // Calculate stats
        let totalStars = 0;
        let childrenMakingProgress = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        for (const child of parent.children) {
            // Stars from evaluations (each evaluation = 1 star for now)
            totalStars += child.evaluations.length;

            // Check if making progress (has evaluation in last 30 days)
            const recentEvaluations = child.evaluations.filter(
                e => new Date(e.evaluatedAt) >= thirtyDaysAgo
            );
            if (recentEvaluations.length > 0) {
                childrenMakingProgress++;
            }
        }

        // Get recent announcements (from admin or from children's groups)
        const childGroupIds = parent.children
            .map(c => c.groupId)
            .filter((id): id is string => id !== null);

        const announcements = await prisma.announcement.findMany({
            where: {
                OR: [
                    { target: "ALL" },
                    { groupId: { in: childGroupIds } },
                ],
            },
            orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
            take: 5,
        });

        return {
            totalChildren: parent.children.length,
            totalStars,
            childrenMakingProgress,
            recentAnnouncements: announcements.map(a => ({
                id: a.id,
                title: a.title,
                titleAr: a.titleAr,
                content: a.content,
                contentAr: a.contentAr,
                createdAt: a.createdAt,
                isImportant: a.pinned,
            })),
        };
    } catch (error) {
        console.error("Error fetching parent dashboard stats:", error);
        return {
            totalChildren: 0,
            totalStars: 0,
            childrenMakingProgress: 0,
            recentAnnouncements: [],
        };
    }
}

export async function getChildrenSummary(parentId: string): Promise<ChildSummary[]> {
    try {
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: {
                children: {
                    include: {
                        user: true,
                        group: {
                            include: {
                                teacher: {
                                    include: { user: true },
                                },
                            },
                        },
                        progress: {
                            orderBy: { surahNumber: "desc" },
                            take: 1,
                        },
                        evaluations: {
                            orderBy: { evaluatedAt: "desc" },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!parent) return [];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return parent.children.map(child => {
            const currentProgress = child.progress[0];
            const latestEvaluation = child.evaluations[0];

            // Determine status based on recent activity
            let status: "ACTIVE" | "NEEDS_ATTENTION" = "ACTIVE";
            if (latestEvaluation) {
                const evalDate = new Date(latestEvaluation.evaluatedAt);
                if (evalDate < thirtyDaysAgo) {
                    status = "NEEDS_ATTENTION";
                }
            } else if (child.evaluations.length === 0 && child.enrolledAt < thirtyDaysAgo) {
                status = "NEEDS_ATTENTION";
            }

            // Calculate stars (based on evaluations for now)
            const stars = child.evaluations.length;

            return {
                id: child.id,
                name: child.user.name,
                image: child.user.image,
                currentSurah: currentProgress?.surahName || null,
                surahProgress: currentProgress?.percentage || null,
                stars,
                status,
                groupName: child.group?.name || null,
                teacherName: child.group?.teacher?.user.name || null,
            };
        });
    } catch (error) {
        console.error("Error fetching children summary:", error);
        return [];
    }
}

// ==================== CHILDREN ====================

export async function getLinkedChildren(parentId: string): Promise<LinkedChild[]> {
    try {
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: {
                children: {
                    include: {
                        user: true,
                        group: {
                            include: {
                                teacher: {
                                    include: { user: true },
                                },
                            },
                        },
                        progress: true,
                        evaluations: {
                            orderBy: { evaluatedAt: "desc" },
                        },
                        attendance: {
                            orderBy: { date: "desc" },
                        },
                    },
                },
            },
        });

        if (!parent) return [];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return parent.children.map(child => {
            const completedSurahs = child.progress.filter(p => p.percentage >= 100).length;
            const latestEvaluation = child.evaluations[0];

            // Calculate streak (consecutive days with attendance)
            let currentStreak = 0;
            const sortedAttendance = [...child.attendance].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            for (const att of sortedAttendance) {
                if (att.status === "PRESENT") {
                    currentStreak++;
                } else {
                    break;
                }
            }

            // Determine status
            let status: "ACTIVE" | "NEEDS_ATTENTION" = "ACTIVE";
            if (latestEvaluation) {
                const evalDate = new Date(latestEvaluation.evaluatedAt);
                if (evalDate < thirtyDaysAgo) {
                    status = "NEEDS_ATTENTION";
                }
            } else if (child.evaluations.length === 0 && child.enrolledAt < thirtyDaysAgo) {
                status = "NEEDS_ATTENTION";
            }

            // Calculate average score from evaluations
            let averageScore: number | null = null;
            if (child.evaluations.length > 0) {
                const totalScore = child.evaluations.reduce((sum, e) => {
                    return sum + Math.round((e.tajweed + e.fluency + e.makharij) / 3);
                }, 0);
                averageScore = Math.round(totalScore / child.evaluations.length);
            }

            return {
                id: child.id,
                name: child.user.name,
                image: child.user.image,
                dateOfBirth: child.dateOfBirth,
                enrolledAt: child.enrolledAt,
                groupName: child.group?.name || null,
                groupId: child.groupId,
                teacherName: child.group?.teacher?.user.name || null,
                teacherId: child.group?.teacherId || null,
                stars: child.evaluations.length,
                surahsMemorized: completedSurahs,
                currentStreak,
                latestEvaluationScore: averageScore,
                latestEvaluationDate: latestEvaluation ? latestEvaluation.evaluatedAt : null,
                status,
                lastActivityDate: latestEvaluation ? latestEvaluation.evaluatedAt : child.enrolledAt,
            };
        });
    } catch (error) {
        console.error("Error fetching linked children:", error);
        return [];
    }
}

export async function getChildDetails(childId: string, parentId: string): Promise<LinkedChild | null> {
    try {
        // Verify parent has access to this child
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: {
                children: {
                    where: { id: childId },
                },
            },
        });

        if (!parent || parent.children.length === 0) {
            return null;
        }

        // Fetch full child details
        const children = await getLinkedChildren(parentId);
        return children.find(c => c.id === childId) || null;
    } catch (error) {
        console.error("Error fetching child details:", error);
        return null;
    }
}

// Input validation for linking child
const linkChildSchema = z.object({
    studentCode: z.string().min(1, "Student code is required"),
});

export type LinkChildInput = z.infer<typeof linkChildSchema>;

export async function linkChild(parentId: string, studentCode: string): Promise<{ success: boolean; message: string }> {
    try {
        // Validate input
        const parsed = linkChildSchema.safeParse({ studentCode });
        if (!parsed.success) {
            return { success: false, message: parsed.error.errors[0].message };
        }

        // Find student by code (for now, we'll use email as the code)
        // In a real app, you'd have a separate student code field
        const student = await prisma.student.findFirst({
            where: {
                user: {
                    email: {
                        contains: studentCode,
                    },
                },
            },
            include: {
                parents: true,
            },
        });

        if (!student) {
            return { success: false, message: "Student not found with this code" };
        }

        // Check if already linked
        if (student.parents.some(p => p.id === parentId)) {
            return { success: false, message: "This child is already linked to your account" };
        }

        // Link the child (directly for now - could add approval flow)
        await prisma.parent.update({
            where: { id: parentId },
            data: {
                children: {
                    connect: { id: student.id },
                },
            },
        });

        return { success: true, message: "Child linked successfully" };
    } catch (error) {
        console.error("Error linking child:", error);
        return { success: false, message: "Failed to link child" };
    }
}

export async function unlinkChild(parentId: string, childId: string): Promise<{ success: boolean; message: string }> {
    try {
        // Verify parent has access to this child
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: {
                children: {
                    where: { id: childId },
                },
            },
        });

        if (!parent || parent.children.length === 0) {
            return { success: false, message: "Child not found or not linked to your account" };
        }

        // Unlink the child
        await prisma.parent.update({
            where: { id: parentId },
            data: {
                children: {
                    disconnect: { id: childId },
                },
            },
        });

        return { success: true, message: "Child unlinked successfully" };
    } catch (error) {
        console.error("Error unlinking child:", error);
        return { success: false, message: "Failed to unlink child" };
    }
}

export async function getLinkRequests(parentId: string): Promise<Array<{
    id: string;
    studentName: string | null;
    status: string;
    requestedAt: Date;
}>> {
    // For now, linking is direct without requests
    // This can be extended for approval-based linking
    return [];
}

// ==================== PROGRESS ====================

export async function getChildProgress(childId: string, parentId: string): Promise<ChildProgress | null> {
    try {
        // Verify parent has access
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: {
                children: {
                    where: { id: childId },
                },
            },
        });

        if (!parent || parent.children.length === 0) {
            return null;
        }

        // Fetch student with all related data
        const student = await prisma.student.findUnique({
            where: { id: childId },
            include: {
                user: true,
                group: {
                    include: {
                        teacher: {
                            include: { user: true },
                        },
                    },
                },
                progress: {
                    orderBy: { surahNumber: "asc" },
                },
                evaluations: {
                    orderBy: { evaluatedAt: "desc" },
                    take: 10,
                    include: {
                        teacher: {
                            include: { user: true },
                        },
                    },
                },
                attendance: {
                    orderBy: { date: "desc" },
                    take: 30,
                },
                badges: {
                    include: { badge: true },
                },
            },
        });

        if (!student) return null;

        // Get current surah (most recent with progress)
        const currentSurah = student.progress.find(p => p.percentage > 0 && p.percentage < 100);

        // Import constants for surah names
        const { SURAHS } = await import("@/lib/constants");

        // Build surah journey
        const surahJourney = SURAHS.map(surah => {
            const progress = student.progress.find(p => p.surahNumber === surah.number);
            let status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" = "NOT_STARTED";
            let percentage = 0;

            if (progress) {
                if (progress.percentage >= 100) {
                    status = "COMPLETED";
                    percentage = 100;
                } else if (progress.percentage > 0) {
                    status = "IN_PROGRESS";
                    percentage = progress.percentage;
                }
            }

            return {
                surahNumber: surah.number,
                surahName: surah.name,
                surahNameAr: surah.nameAr,
                status,
                percentage,
            };
        });

        // Recent evaluations with teacher name
        const recentEvaluations = student.evaluations.map(e => {
            const surah = SURAHS.find(s => s.number === e.surahNumber);
            return {
                id: e.id,
                surahNumber: e.surahNumber,
                surahName: surah?.name || `Surah ${e.surahNumber}`,
                grade: e.grade,
                finalScore: Math.round((e.tajweed + e.fluency + e.makharij) / 3),
                tajweed: e.tajweed,
                fluency: e.fluency,
                makharij: e.makharij,
                notes: e.notes,
                evaluatedAt: e.evaluatedAt,
                teacherName: e.teacher.user.name || "Teacher",
            };
        });

        // Attendance stats
        const present = student.attendance.filter(a => a.status === "PRESENT").length;
        const absent = student.attendance.filter(a => a.status === "ABSENT").length;
        const late = student.attendance.filter(a => a.status === "LATE").length;

        // Badges
        const badges = student.badges.map(sb => ({
            id: sb.id,
            name: sb.badge.name,
            nameAr: sb.badge.nameAr,
            icon: sb.badge.icon,
            earnedAt: sb.earnedAt,
        }));

        // Calculate stats
        const totalVerses = student.progress.reduce((sum, p) => sum + p.versesMemorized, 0);

        let averageScore = 0;
        if (student.evaluations.length > 0) {
            const totalScore = student.evaluations.reduce((sum, e) => {
                return sum + Math.round((e.tajweed + e.fluency + e.makharij) / 3);
            }, 0);
            averageScore = Math.round(totalScore / student.evaluations.length);
        }

        // Calculate streak
        let currentStreak = 0;
        const sortedAttendance = [...student.attendance].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        for (const att of sortedAttendance) {
            if (att.status === "PRESENT") {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            currentSurah: currentSurah ? {
                surahNumber: currentSurah.surahNumber,
                surahName: currentSurah.surahName,
                surahNameAr: SURAHS.find(s => s.number === currentSurah.surahNumber)?.nameAr || "",
                versesTotal: currentSurah.versesTotal,
                versesMemorized: currentSurah.versesMemorized,
                percentage: currentSurah.percentage,
            } : null,
            surahJourney,
            recentEvaluations,
            attendance: {
                present,
                absent,
                late,
                total: student.attendance.length,
                recent: student.attendance.slice(0, 10).map(a => ({
                    date: a.date,
                    status: a.status,
                })),
            },
            badges,
            stats: {
                totalVerses,
                averageScore,
                currentStreak,
            },
        };
    } catch (error) {
        console.error("Error fetching child progress:", error);
        return null;
    }
}

export async function getChildEvaluations(
    childId: string,
    dateRange?: { start: Date; end: Date }
): Promise<Array<{
    id: string;
    surahNumber: number;
    surahName: string;
    grade: string;
    finalScore: number;
    tajweed: number;
    fluency: number;
    makharij: number;
    notes: string | null;
    evaluatedAt: Date;
    teacherName: string;
}>> {
    try {
        const where: any = { studentId: childId };

        if (dateRange) {
            where.evaluatedAt = {
                gte: dateRange.start,
                lte: dateRange.end,
            };
        }

        const evaluations = await prisma.evaluation.findMany({
            where,
            orderBy: { evaluatedAt: "desc" },
            include: {
                teacher: {
                    include: { user: true },
                },
            },
        });

        const { SURAHS } = await import("@/lib/constants");

        return evaluations.map(e => {
            const surah = SURAHS.find(s => s.number === e.surahNumber);
            return {
                id: e.id,
                surahNumber: e.surahNumber,
                surahName: surah?.name || `Surah ${e.surahNumber}`,
                grade: e.grade,
                finalScore: Math.round((e.tajweed + e.fluency + e.makharij) / 3),
                tajweed: e.tajweed,
                fluency: e.fluency,
                makharij: e.makharij,
                notes: e.notes,
                evaluatedAt: e.evaluatedAt,
                teacherName: e.teacher.user.name || "Teacher",
            };
        });
    } catch (error) {
        console.error("Error fetching child evaluations:", error);
        return [];
    }
}

export async function getChildAttendance(
    childId: string,
    dateRange?: { start: Date; end: Date }
): Promise<{
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    records: Array<{
        date: Date;
        status: string;
    }>;
}> {
    try {
        const where: any = { studentId: childId };

        if (dateRange) {
            where.date = {
                gte: dateRange.start,
                lte: dateRange.end,
            };
        }

        const attendance = await prisma.attendance.findMany({
            where,
            orderBy: { date: "desc" },
        });

        const present = attendance.filter(a => a.status === "PRESENT").length;
        const absent = attendance.filter(a => a.status === "ABSENT").length;
        const late = attendance.filter(a => a.status === "LATE").length;
        const excused = attendance.filter(a => a.status === "EXCUSED").length;

        return {
            present,
            absent,
            late,
            excused,
            total: attendance.length,
            records: attendance.map(a => ({
                date: a.date,
                status: a.status,
            })),
        };
    } catch (error) {
        console.error("Error fetching child attendance:", error);
        return {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
            records: [],
        };
    }
}

export async function getChildBadges(childId: string): Promise<Array<{
    id: string;
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    icon: string;
    type: string;
    earnedAt: Date;
}>> {
    try {
        const badges = await prisma.studentBadge.findMany({
            where: { studentId: childId },
            include: { badge: true },
            orderBy: { earnedAt: "desc" },
        });

        return badges.map(sb => ({
            id: sb.id,
            name: sb.badge.name,
            nameAr: sb.badge.nameAr,
            description: sb.badge.description,
            descriptionAr: sb.badge.descriptionAr,
            icon: sb.badge.icon,
            type: sb.badge.type,
            earnedAt: sb.earnedAt,
        }));
    } catch (error) {
        console.error("Error fetching child badges:", error);
        return [];
    }
}

export async function getChildStats(childId: string): Promise<{
    totalVerses: number;
    averageScore: number;
    currentStreak: number;
    totalEvaluations: number;
    completedSurahs: number;
} | null> {
    try {
        const student = await prisma.student.findUnique({
            where: { id: childId },
            include: {
                progress: true,
                evaluations: true,
                attendance: {
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!student) return null;

        const totalVerses = student.progress.reduce((sum, p) => sum + p.versesMemorized, 0);
        const completedSurahs = student.progress.filter(p => p.percentage >= 100).length;

        let averageScore = 0;
        if (student.evaluations.length > 0) {
            const totalScore = student.evaluations.reduce((sum, e) => {
                return sum + Math.round((e.tajweed + e.fluency + e.makharij) / 3);
            }, 0);
            averageScore = Math.round(totalScore / student.evaluations.length);
        }

        // Calculate streak
        let currentStreak = 0;
        for (const att of student.attendance) {
            if (att.status === "PRESENT") {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            totalVerses,
            averageScore,
            currentStreak,
            totalEvaluations: student.evaluations.length,
            completedSurahs,
        };
    } catch (error) {
        console.error("Error fetching child stats:", error);
        return null;
    }
}

// ==================== ANNOUNCEMENTS ====================

export async function getParentAnnouncements(
    parentId: string,
    filter: "ALL" | "IMPORTANT" | "GROUP" = "ALL"
): Promise<ParentAnnouncement[]> {
    try {
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: {
                children: {
                    select: { groupId: true },
                },
            },
        });

        if (!parent) return [];

        // Get unique group IDs from children
        const groupIds = parent.children
            .map(c => c.groupId)
            .filter((id): id is string => id !== null);

        const where: any = {
            OR: [
                { target: "ALL" },
                { groupId: { in: groupIds } },
            ],
        };

        if (filter === "IMPORTANT") {
            where.pinned = true;
        } else if (filter === "GROUP" && groupIds.length > 0) {
            where.groupId = { in: groupIds };
        }

        const announcements = await prisma.announcement.findMany({
            where,
            orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
            include: {
                group: true,
            },
        } as any);

        return (announcements as any[]).map(a => ({
            id: a.id,
            title: a.title,
            titleAr: a.titleAr,
            content: a.content,
            contentAr: a.contentAr,
            target: a.target,
            groupId: a.groupId,
            groupName: (a as any).group?.name || null,
            authorName: "Admin", // Would need to include author
            createdAt: a.createdAt,
            isPinned: a.pinned,
            isRead: false, // Could track read status in a separate table
        }));
    } catch (error) {
        console.error("Error fetching parent announcements:", error);
        return [];
    }
}

export async function markAnnouncementRead(
    announcementId: string
): Promise<{ success: boolean }> {
    // This would typically update a read status in a separate table
    // For now, it's a placeholder for local state management
    return { success: true };
}
