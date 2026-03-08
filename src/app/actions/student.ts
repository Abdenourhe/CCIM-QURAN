"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Use require for Next.js functions to avoid TypeScript issues
const nextCache = require("next/cache");
const revalidatePathFn = nextCache.revalidatePath;

// ==================== TYPES ====================

export interface StudentDashboardStats {
    stars: number;
    surahsMemorized: number;
    currentStreak: number;
    rank: number;
    totalStudents: number;
    todayGoal?: string;
    goalProgress?: number;
}

export interface RecentActivity {
    id: string;
    type: "EVALUATION" | "BADGE" | "PROGRESS" | "STREAK";
    title: string;
    description: string;
    date: string;
    icon: string;
}

export interface SurahProgress {
    id: string;
    surahNumber: number;
    surahName: string;
    surahNameAr: string;
    versesTotal: number;
    versesMemorized: number;
    percentage: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "UNDER_REVIEW" | "READY_FOR_RECITATION" | "PENDING_TEACHER_APPROVAL" | "MEMORIZED" | "NEEDS_REVISION";
    lastUpdated: string;
    targetDate?: string;
}

export interface BadgeInfo {
    id: string;
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    icon: string;
    type: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    earnedAt?: string;
    progress?: number;
    criteria?: string;
}

export interface RecitationSubmission {
    id: string;
    surahNumber: number;
    surahName: string;
    verseRange: string;
    status: "READY_FOR_RECITATION" | "PENDING_TEACHER_APPROVAL" | "APPROVED" | "NEEDS_REVISION";
    submittedAt: string;
    evaluatedAt?: string;
    score?: number;
    feedback?: string;
}

export interface StudentProfile {
    id: string;
    name: string;
    email: string;
    image?: string;
    phone?: string;
    groupName?: string;
    teacherName?: string;
    enrolledAt: string;
    stars: number;
    surahsMemorized: number;
    totalVerses: number;
    currentStreak: number;
    bestStreak: number;
    averageScore: number;
    badgesEarned: number;
}

// ==================== VALIDATIONS ====================

const profileUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
});

const markReadySchema = z.object({
    progressId: z.string().cuid(),
    versesReady: z.string(), // Format: "1-10" or "1,3,5"
    notes: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileUpdateSchema>;
export type MarkReadyInput = z.infer<typeof markReadySchema>;

// ==================== PROGRESS STATUS ====================

// Note: The Progress model doesn't have a status field in schema
// We derive status from versesMemorized/percentage
function getStatusFromProgress(progress: {
    versesMemorized: number;
    versesTotal: number;
    percentage: number;
}): SurahProgress["status"] {
    if (progress.percentage === 0) return "NOT_STARTED";
    if (progress.percentage === 100) return "MEMORIZED";
    if (progress.percentage >= 50) return "IN_PROGRESS";
    return "UNDER_REVIEW";
}

// ==================== DASHBOARD ====================

export async function getStudentDashboardStats(studentId: string): Promise<StudentDashboardStats> {
    try {
        // Get student with user data and group
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: true,
                group: {
                    include: {
                        teacher: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        if (!student) {
            throw new Error("Student not found");
        }

        // Get all progress for this student
        const allProgress = await prisma.progress.findMany({
            where: { studentId },
            orderBy: { surahNumber: "asc" }
        });

        // Calculate surahs memorized (100% complete)
        const surahsMemorized = allProgress.filter(p => p.percentage >= 100).length;

        // Calculate total verses memorized
        const totalVerses = allProgress.reduce((sum, p) => sum + p.versesMemorized, 0);

        // Calculate stars (simple formula: 50 stars per surah memorized + 5 per surah started)
        const surahsStarted = allProgress.filter(p => p.percentage > 0).length;
        const stars = (surahsMemorized * 50) + (surahsStarted * 5);

        // Calculate streak (simplified - count consecutive attendance days)
        const recentAttendance = await prisma.attendance.findMany({
            where: {
                studentId,
                status: "PRESENT"
            },
            orderBy: { date: "desc" },
            take: 365
        });

        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < recentAttendance.length; i++) {
            const attendanceDate = new Date(recentAttendance[i].date);
            attendanceDate.setHours(0, 0, 0, 0);

            const expectedDate = new Date(today);
            expectedDate.setDate(expectedDate.getDate() - i);

            if (attendanceDate.getTime() === expectedDate.getTime()) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Calculate rank in group
        let rank = 1;
        if (student.groupId) {
            const groupStudents = await prisma.student.findMany({
                where: { groupId: student.groupId },
                include: { progress: true }
            });

            for (const s of groupStudents) {
                const sMemorized = s.progress.filter(p => p.percentage >= 100).length;
                if (sMemorized > surahsMemorized) {
                    rank++;
                }
            }
        }

        // Get current surah being worked on
        const currentProgress = allProgress
            .filter(p => p.percentage > 0 && p.percentage < 100)
            .sort((a, b) => b.percentage - a.percentage)[0];

        // Get today's goal
        let todayGoal: string | undefined;
        let goalProgress: number | undefined;

        if (currentProgress) {
            const surah = getSurahInfo(currentProgress.surahNumber);
            todayGoal = `Memorize verses ${currentProgress.versesMemorized + 1}-${Math.min(currentProgress.versesMemorized + 5, currentProgress.versesTotal)} of ${surah.name}`;
            goalProgress = currentProgress.percentage;
        }

        return {
            stars,
            surahsMemorized,
            currentStreak,
            rank,
            totalStudents: student.groupId
                ? await prisma.student.count({ where: { groupId: student.groupId } })
                : surahsMemorized + 1,
            todayGoal,
            goalProgress
        };
    } catch (error) {
        console.error("Error getting student dashboard stats:", error);
        return {
            stars: 0,
            surahsMemorized: 0,
            currentStreak: 0,
            rank: 0,
            totalStudents: 0
        };
    }
}

export async function getStudentRecentActivity(studentId: string): Promise<RecentActivity[]> {
    try {
        const activities: RecentActivity[] = [];

        // Get recent evaluations
        const recentEvaluations = await prisma.evaluation.findMany({
            where: { studentId },
            orderBy: { evaluatedAt: "desc" },
            take: 3,
            include: {
                teacher: {
                    include: { user: true }
                }
            }
        });

        for (const eval_ of recentEvaluations) {
            const gradeLabels: Record<string, string> = {
                EXCELLENT: "Excellent",
                GOOD: "Bien",
                AVERAGE: "Moyen",
                NEEDS_IMPROVEMENT: "À améliorer"
            };
            activities.push({
                id: eval_.id,
                type: "EVALUATION",
                title: `Évaluation: ${eval_.grade}`,
                description: `${eval_.surahNumber}:${eval_.verseFrom}-${eval_.verseTo}`,
                date: eval_.evaluatedAt.toISOString(),
                icon: "📝"
            });
        }

        // Get recent badges earned
        const recentBadges = await prisma.studentBadge.findMany({
            where: { studentId },
            orderBy: { earnedAt: "desc" },
            take: 2,
            include: { badge: true }
        });

        for (const sb of recentBadges) {
            activities.push({
                id: sb.id,
                type: "BADGE",
                title: `Badge: ${sb.badge.name}`,
                description: sb.badge.description,
                date: sb.earnedAt.toISOString(),
                icon: sb.badge.icon
            });
        }

        // Sort by date
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return activities.slice(0, 5);
    } catch (error) {
        console.error("Error getting recent activity:", error);
        return [];
    }
}

// ==================== PROGRESS ====================

export async function getStudentProgress(studentId: string): Promise<{
    currentSurah?: SurahProgress;
    statistics: {
        totalVersesMemorized: number;
        averageScore: number;
        memorizationSpeed: number;
        bestStreak: number;
    };
    recentProgress: SurahProgress[];
}> {
    try {
        const allProgress = await prisma.progress.findMany({
            where: { studentId },
            orderBy: { surahNumber: "asc" }
        });

        // Current surah being worked on
        const currentSurah = allProgress
            .filter(p => p.percentage > 0 && p.percentage < 100)
            .sort((a, b) => b.percentage - a.percentage)[0];

        // Get evaluations for score calculation
        const evaluations = await prisma.evaluation.findMany({
            where: { studentId },
            orderBy: { evaluatedAt: "desc" }
        });

        // Calculate statistics
        const totalVersesMemorized = allProgress.reduce((sum, p) => sum + p.versesMemorized, 0);

        const averageScore = evaluations.length > 0
            ? Math.round(evaluations.reduce((sum, e) => {
                return sum + ((e.tajweed + e.fluency + (e.makharij || 0)) / 3);
            }, 0) / evaluations.length)
            : 0;

        // Calculate memorization speed (verses per week - simplified)
        const firstProgress = allProgress.sort((a, b) =>
            new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
        )[0];

        let memorizationSpeed = 0;
        if (firstProgress) {
            const daysSinceStart = Math.max(1, Math.floor(
                (Date.now() - new Date(firstProgress.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
            ));
            memorizationSpeed = Math.round((totalVersesMemorized / daysSinceStart) * 7);
        }

        // Calculate best streak
        const attendance = await prisma.attendance.findMany({
            where: { studentId, status: "PRESENT" },
            orderBy: { date: "desc" }
        });

        let bestStreak = 0;
        let currentStreak = 0;
        let lastDate: Date | null = null;

        for (const att of attendance) {
            const attDate = new Date(att.date);
            attDate.setHours(0, 0, 0, 0);

            if (!lastDate) {
                currentStreak = 1;
            } else {
                const diffDays = Math.floor(
                    (lastDate.getTime() - attDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    bestStreak = Math.max(bestStreak, currentStreak);
                    currentStreak = 1;
                }
            }
            lastDate = attDate;
        }
        bestStreak = Math.max(bestStreak, currentStreak);

        return {
            currentSurah: currentSurah ? {
                ...currentSurah,
                surahNameAr: getSurahInfo(currentSurah.surahNumber).nameAr,
                status: getStatusFromProgress(currentSurah)
            } : undefined,
            statistics: {
                totalVersesMemorized,
                averageScore,
                memorizationSpeed,
                bestStreak
            },
            recentProgress: allProgress.slice(-10).reverse().map(p => ({
                ...p,
                surahNameAr: getSurahInfo(p.surahNumber).nameAr,
                status: getStatusFromProgress(p)
            }))
        };
    } catch (error) {
        console.error("Error getting student progress:", error);
        return {
            statistics: {
                totalVersesMemorized: 0,
                averageScore: 0,
                memorizationSpeed: 0,
                bestStreak: 0
            },
            recentProgress: []
        };
    }
}

export async function getAllSurahProgress(studentId: string): Promise<SurahProgress[]> {
    try {
        const progress = await prisma.progress.findMany({
            where: { studentId },
            orderBy: { surahNumber: "asc" }
        });

        return progress.map(p => ({
            ...p,
            surahNameAr: getSurahInfo(p.surahNumber).nameAr,
            status: getStatusFromProgress(p)
        }));
    } catch (error) {
        console.error("Error getting all surah progress:", error);
        return [];
    }
}

export async function updateProgressStatus(
    progressId: string,
    status: SurahProgress["status"]
): Promise<{ success: boolean }> {
    try {
        // Note: Progress model doesn't have status field
        // This would need to be added to the schema or managed differently
        // For now, we'll update the percentage based on status
        const progress = await prisma.progress.findUnique({
            where: { id: progressId }
        });

        if (!progress) {
            throw new Error("Progress not found");
        }

        let updates: any = { lastUpdated: new Date() };

        if (status === "MEMORIZED") {
            updates.percentage = 100;
            updates.versesMemorized = progress.versesTotal;
        } else if (status === "NOT_STARTED") {
            updates.percentage = 0;
            updates.versesMemorized = 0;
        }

        await prisma.progress.update({
            where: { id: progressId },
            data: updates
        });

        revalidatePathFn("/student/progress");
        return { success: true };
    } catch (error) {
        console.error("Error updating progress status:", error);
        return { success: false };
    }
}

export async function getSurahDetails(studentId: string, surahNumber: number): Promise<{
    progress?: SurahProgress;
    evaluations: Array<{
        id: string;
        date: string;
        grade: string;
        score: number;
        notes?: string;
        teacherName: string;
    }>;
}> {
    try {
        const progress = await prisma.progress.findUnique({
            where: {
                studentId_surahNumber: {
                    studentId,
                    surahNumber
                }
            }
        });

        const evaluations = await prisma.evaluation.findMany({
            where: {
                studentId,
                surahNumber
            },
            orderBy: { evaluatedAt: "desc" },
            include: {
                teacher: {
                    include: { user: true }
                }
            }
        });

        return {
            progress: progress ? {
                ...progress,
                surahNameAr: getSurahInfo(progress.surahNumber).nameAr,
                status: getStatusFromProgress(progress)
            } : undefined,
            evaluations: evaluations.map(e => ({
                id: e.id,
                date: e.evaluatedAt.toISOString(),
                grade: e.grade,
                score: Math.round((e.tajweed + e.fluency + (e.makharij || 0)) / 3),
                notes: e.notes || undefined,
                teacherName: e.teacher.user.name || "Teacher"
            }))
        };
    } catch (error) {
        console.error("Error getting surah details:", error);
        return { evaluations: [] };
    }
}

// ==================== BADGES ====================

export async function getStudentBadges(studentId: string): Promise<BadgeInfo[]> {
    try {
        const earnedBadges = await prisma.studentBadge.findMany({
            where: { studentId },
            include: { badge: true }
        });

        const earnedBadgeIds = earnedBadges.map(sb => sb.badgeId);

        // Get all available badges
        const allBadges = await prisma.badge.findMany();

        // If no badges in DB, use defaults
        const badgeDefinitions = getDefaultBadgeDefinitions();

        return badgeDefinitions.map(def => {
            const earned = earnedBadges.find(sb => sb.badge.id === def.id);
            const rarity = getBadgeRarity(def.type, def.id);

            return {
                id: def.id,
                name: def.name,
                nameAr: def.nameAr,
                description: def.description,
                descriptionAr: def.descriptionAr,
                icon: def.icon,
                type: def.type,
                rarity,
                earnedAt: earned?.earnedAt.toISOString(),
                criteria: def.criteria
            };
        });
    } catch (error) {
        console.error("Error getting student badges:", error);
        return [];
    }
}

export async function getAllAvailableBadges(): Promise<BadgeInfo[]> {
    try {
        const badgeDefinitions = getDefaultBadgeDefinitions();

        return badgeDefinitions.map(def => ({
            id: def.id,
            name: def.name,
            nameAr: def.nameAr,
            description: def.description,
            descriptionAr: def.descriptionAr,
            icon: def.icon,
            type: def.type,
            rarity: getBadgeRarity(def.type, def.id),
            criteria: def.criteria
        }));
    } catch (error) {
        console.error("Error getting available badges:", error);
        return [];
    }
}

export async function checkAndAwardBadges(studentId: string): Promise<BadgeInfo[]> {
    try {
        const newlyEarned: BadgeInfo[] = [];

        // Get student stats
        const stats = await getStudentDashboardStats(studentId);
        const progress = await prisma.progress.findMany({ where: { studentId } });
        const evaluations = await prisma.evaluation.findMany({ where: { studentId } });

        const surahsMemorized = progress.filter(p => p.percentage >= 100).length;
        const totalVerses = progress.reduce((sum, p) => sum + p.versesMemorized, 0);
        const excellentEvals = evaluations.filter(e => e.grade === "EXCELLENT").length;

        // Get already earned badges
        const earnedBadges = await prisma.studentBadge.findMany({
            where: { studentId },
            include: { badge: true }
        });
        const earnedBadgeIds = earnedBadges.map(sb => sb.badge.id);

        // Check each badge criteria
        const badgeDefinitions = getDefaultBadgeDefinitions();

        for (const def of badgeDefinitions) {
            if (earnedBadgeIds.includes(def.id)) continue;

            let shouldAward = false;

            switch (def.id) {
                case "first-surah":
                    shouldAward = surahsMemorized >= 1;
                    break;
                case "ten-surahs":
                    shouldAward = surahsMemorized >= 10;
                    break;
                case "thirty-surahs":
                    shouldAward = surahsMemorized >= 30;
                    break;
                case "half-quran":
                    shouldAward = surahsMemorized >= 57;
                    break;
                case "full-quran":
                    shouldAward = surahsMemorized >= 114;
                    break;
                case "streak-7":
                    shouldAward = stats.currentStreak >= 7;
                    break;
                case "streak-30":
                    shouldAward = stats.currentStreak >= 30;
                    break;
                case "streak-90":
                    shouldAward = stats.currentStreak >= 90;
                    break;
                case "streak-365":
                    shouldAward = stats.currentStreak >= 365;
                    break;
                case "stars-100":
                    shouldAward = stats.stars >= 100;
                    break;
                case "stars-500":
                    shouldAward = stats.stars >= 500;
                    break;
                case "stars-1000":
                    shouldAward = stats.stars >= 1000;
                    break;
                case "stars-5000":
                    shouldAward = stats.stars >= 5000;
                    break;
                case "excellent-eval":
                    shouldAward = excellentEvals >= 1;
                    break;
                case "excellent-5":
                    shouldAward = excellentEvals >= 5;
                    break;
                case "excellent-10":
                    shouldAward = excellentEvals >= 10;
                    break;
                case "verses-100":
                    shouldAward = totalVerses >= 100;
                    break;
                case "verses-500":
                    shouldAward = totalVerses >= 500;
                    break;
                case "verses-1000":
                    shouldAward = totalVerses >= 1000;
                    break;
            }

            if (shouldAward) {
                // Create badge if it doesn't exist
                let badge = await prisma.badge.findUnique({ where: { id: def.id } });

                if (!badge) {
                    badge = await prisma.badge.create({
                        data: {
                            id: def.id,
                            name: def.name,
                            nameAr: def.nameAr,
                            description: def.description,
                            descriptionAr: def.descriptionAr,
                            icon: def.icon,
                            type: def.type,
                            criteria: def.criteria
                        }
                    });
                }

                // Award badge to student
                await prisma.studentBadge.create({
                    data: {
                        studentId,
                        badgeId: badge.id
                    }
                });

                newlyEarned.push({
                    ...def,
                    rarity: getBadgeRarity(def.type, def.id),
                    earnedAt: new Date().toISOString()
                });
            }
        }

        if (newlyEarned.length > 0) {
            revalidatePathFn("/student/badges");
            revalidatePathFn("/student");
        }

        return newlyEarned;
    } catch (error) {
        console.error("Error checking and awarding badges:", error);
        return [];
    }
}

// ==================== RECITATION ====================

export async function markReadyToRecite(input: MarkReadyInput): Promise<{ success: boolean; message?: string }> {
    try {
        const { progressId, versesReady, notes } = markReadySchema.parse(input);

        // Get the progress record
        const progress = await prisma.progress.findUnique({
            where: { id: progressId }
        });

        if (!progress) {
            return { success: false, message: "Progress not found" };
        }

        // Parse verses ready
        let versesMemorized = progress.versesMemorized;

        if (versesReady.includes("-")) {
            const [from, to] = versesReady.split("-").map(Number);
            versesMemorized = Math.max(versesMemorized, to);
        } else if (versesReady.includes(",")) {
            const verses = versesReady.split(",").map(Number);
            versesMemorized = Math.max(versesMemorized, Math.max(...verses));
        } else {
            versesMemorized = Math.max(versesMemorized, Number(versesReady));
        }

        // Update progress
        const newPercentage = Math.round((versesMemorized / progress.versesTotal) * 100);

        await prisma.progress.update({
            where: { id: progressId },
            data: {
                versesMemorized,
                percentage: newPercentage,
                lastUpdated: new Date()
            }
        });

        // Note: Status would need a separate field in the Progress model
        // For now, we just update the memorization progress

        revalidatePathFn("/student/recitation");
        revalidatePathFn("/student");

        return { success: true, message: "Ready to recite marked successfully" };
    } catch (error) {
        console.error("Error marking ready to recite:", error);
        return { success: false, message: "Failed to mark ready to recite" };
    }
}

export async function cancelRecitation(progressId: string): Promise<{ success: boolean }> {
    try {
        // In a more complete implementation, this would handle
        // canceling pending submissions
        await prisma.progress.update({
            where: { id: progressId },
            data: { lastUpdated: new Date() }
        });

        revalidatePathFn("/student/recitation");
        return { success: true };
    } catch (error) {
        console.error("Error canceling recitation:", error);
        return { success: false };
    }
}

export async function getPendingRecitations(studentId: string): Promise<RecitationSubmission[]> {
    try {
        // Get evaluations that are pending or recent
        const evaluations = await prisma.evaluation.findMany({
            where: { studentId },
            orderBy: { evaluatedAt: "desc" },
            take: 20
        });

        const progress = await prisma.progress.findMany({
            where: { studentId }
        });

        return evaluations.map(e => {
            const prog = progress.find(p => p.surahNumber === e.surahNumber);
            return {
                id: e.id,
                surahNumber: e.surahNumber,
                surahName: getSurahInfo(e.surahNumber).name,
                verseRange: `${e.verseFrom}-${e.verseTo}`,
                status: e.grade === "NEEDS_IMPROVEMENT" ? "NEEDS_REVISION" : "APPROVED",
                submittedAt: e.evaluatedAt.toISOString(),
                evaluatedAt: e.evaluatedAt.toISOString(),
                score: Math.round((e.tajweed + e.fluency + (e.makharij || 0)) / 3),
                feedback: e.notes || undefined
            };
        });
    } catch (error) {
        console.error("Error getting pending recitations:", error);
        return [];
    }
}

export async function getRecitationHistory(studentId: string): Promise<Array<{
    id: string;
    surahName: string;
    verseRange: string;
    date: string;
    score: number;
    grade: string;
    teacherName: string;
    strengths: string[];
    improvements: string[];
    notes?: string;
}>> {
    try {
        const evaluations = await prisma.evaluation.findMany({
            where: { studentId },
            orderBy: { evaluatedAt: "desc" },
            include: {
                teacher: {
                    include: { user: true }
                }
            }
        });

        return evaluations.map(e => ({
            id: e.id,
            surahName: getSurahInfo(e.surahNumber).name,
            verseRange: `${e.verseFrom}-${e.verseTo}`,
            date: e.evaluatedAt.toISOString(),
            score: Math.round((e.tajweed + e.fluency + (e.makharij || 0)) / 3),
            grade: e.grade,
            teacherName: e.teacher.user.name || "Teacher",
            strengths: e.notes ? [e.notes] : [],
            improvements: e.grade === "NEEDS_IMPROVEMENT" ? ["Review and practice more"] : [],
            notes: e.notes || undefined
        }));
    } catch (error) {
        console.error("Error getting recitation history:", error);
        return [];
    }
}

// ==================== PROFILE ====================

export async function updateStudentProfile(
    studentId: string,
    data: ProfileInput
): Promise<{ success: boolean }> {
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true }
        });

        if (!student) {
            return { success: false };
        }

        // Update user data
        if (data.name) {
            await prisma.user.update({
                where: { id: student.userId },
                data: { name: data.name }
            });
        }

        // Update parent phone if applicable
        if (data.phone) {
            const parents = await prisma.parent.findMany({
                where: { children: { some: { id: studentId } } }
            });

            for (const parent of parents) {
                await prisma.parent.update({
                    where: { id: parent.id },
                    data: { phone: data.phone }
                });
            }
        }

        revalidatePathFn("/student/profile");
        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false };
    }
}

export async function uploadAvatar(
    studentId: string,
    file: File
): Promise<{ success: boolean; imageUrl?: string }> {
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true }
        });

        if (!student) {
            return { success: false };
        }

        // In a real implementation, this would upload to cloud storage
        // For now, we'll just create a data URL
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const dataUrl = `data:${file.type};base64,${base64}`;

        await prisma.user.update({
            where: { id: student.userId },
            data: { image: dataUrl }
        });

        revalidatePathFn("/student/profile");
        return { success: true, imageUrl: dataUrl };
    } catch (error) {
        console.error("Error uploading avatar:", error);
        return { success: false };
    }
}

export async function changePassword(
    studentId: string,
    oldPassword: string,
    newPassword: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true }
        });

        if (!student) {
            return { success: false, message: "Student not found" };
        }

        // In a real app, you'd verify the old password
        // For now, we'll just update it (simplified)
        // This would use bcrypt in production

        await prisma.user.update({
            where: { id: student.userId },
            data: { password: newPassword } // Would hash this in production
        });

        return { success: true, message: "Password changed successfully" };
    } catch (error) {
        console.error("Error changing password:", error);
        return { success: false, message: "Failed to change password" };
    }
}

// ==================== GAMIFICATION ====================

export async function getLeaderboard(groupId?: string): Promise<Array<{
    rank: number;
    studentId: string;
    name: string;
    stars: number;
    surahsMemorized: number;
    streak: number;
}>> {
    try {
        const students = await prisma.student.findMany({
            where: groupId ? { groupId } : undefined,
            include: {
                user: true,
                progress: true,
                attendance: {
                    where: { status: "PRESENT" },
                    orderBy: { date: "desc" }
                }
            }
        });

        const leaderboard = students.map((student, index) => {
            const surahsMemorized = student.progress.filter(p => p.percentage >= 100).length;
            const stars = (surahsMemorized * 50) + (student.progress.filter(p => p.percentage > 0).length * 5);

            // Calculate streak
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < student.attendance.length; i++) {
                const attDate = new Date(student.attendance[i].date);
                attDate.setHours(0, 0, 0, 0);

                const expectedDate = new Date(today);
                expectedDate.setDate(expectedDate.getDate() - i);

                if (attDate.getTime() === expectedDate.getTime()) {
                    streak++;
                } else {
                    break;
                }
            }

            return {
                rank: index + 1,
                studentId: student.id,
                name: student.user.name || "Student",
                stars,
                surahsMemorized,
                streak
            };
        });

        // Sort by stars
        leaderboard.sort((a, b) => b.stars - a.stars);

        // Update ranks
        return leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));
    } catch (error) {
        console.error("Error getting leaderboard:", error);
        return [];
    }
}

export async function getStarsHistory(studentId: string): Promise<Array<{
    date: string;
    stars: number;
    reason: string;
}>> {
    try {
        // Get all badges earned (each badge gives stars)
        const badges = await prisma.studentBadge.findMany({
            where: { studentId },
            orderBy: { earnedAt: "asc" },
            include: { badge: true }
        });

        return badges.map(b => ({
            date: b.earnedAt.toISOString(),
            stars: 25, // Each badge gives 25 stars
            reason: `Earned: ${b.badge.name}`
        }));
    } catch (error) {
        console.error("Error getting stars history:", error);
        return [];
    }
}

export async function updateStreak(studentId: string): Promise<{
    currentStreak: number;
    bonusStars: number
}> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already marked present today
        const todayStr = today.toISOString().split("T")[0];

        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                studentId,
                date: {
                    gte: new Date(todayStr)
                }
            }
        });

        if (existingAttendance) {
            // Already marked
            const allAttendance = await prisma.attendance.findMany({
                where: { studentId, status: "PRESENT" },
                orderBy: { date: "desc" }
            });

            let streak = 0;
            for (let i = 0; i < allAttendance.length; i++) {
                const attDate = new Date(allAttendance[i].date);
                attDate.setHours(0, 0, 0, 0);

                const expectedDate = new Date(today);
                expectedDate.setDate(expectedDate.getDate() - i);

                if (attDate.getTime() === expectedDate.getTime()) {
                    streak++;
                } else {
                    break;
                }
            }

            return { currentStreak: streak, bonusStars: 0 };
        }

        // Award stars for daily attendance
        let bonusStars = 2;

        // Calculate new streak
        const allAttendance = await prisma.attendance.findMany({
            where: { studentId, status: "PRESENT" },
            orderBy: { date: "desc" }
        });

        let streak = 1;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        for (const att of allAttendance) {
            const attDate = new Date(att.date);
            attDate.setHours(0, 0, 0, 0);

            if (attDate.getTime() === yesterday.getTime()) {
                streak++;
                yesterday.setDate(yesterday.getDate() - 1);
            } else {
                break;
            }
        }

        // Bonus stars for streaks
        if (streak === 7) bonusStars += 30;
        if (streak === 30) bonusStars += 100;
        if (streak === 90) bonusStars += 250;
        if (streak === 365) bonusStars += 1000;

        return { currentStreak: streak, bonusStars };
    } catch (error) {
        console.error("Error updating streak:", error);
        return { currentStreak: 0, bonusStars: 0 };
    }
}

// ==================== HELPER FUNCTIONS ====================

function getSurahInfo(surahNumber: number): { name: string; nameAr: string; verses: number } {
    const surahs: Record<number, { name: string; nameAr: string; verses: number }> = {
        1: { name: "Al-Fatiha", nameAr: "الفاتحة", verses: 7 },
        2: { name: "Al-Baqarah", nameAr: "البقرة", verses: 286 },
        3: { name: "Aal-E-Imran", nameAr: "آل عمران", verses: 200 },
        4: { name: "An-Nisa", nameAr: "النساء", verses: 176 },
        5: { name: "Al-Maidah", nameAr: "المائدة", verses: 120 },
        6: { name: "Al-Anam", nameAr: "الأنعام", verses: 165 },
        7: { name: "Al-Araf", nameAr: "الأعراف", verses: 206 },
        8: { name: "Al-Anfal", nameAr: "الأنفال", verses: 75 },
        9: { name: "At-Tawbah", nameAr: "التوبة", verses: 129 },
        10: { name: "Yunus", nameAr: "يونس", verses: 109 },
        11: { name: "Hud", nameAr: "هود", verses: 123 },
        12: { name: "Yusuf", nameAr: "يوسف", verses: 111 },
        13: { name: "Ar-Rad", nameAr: "الرعد", verses: 43 },
        14: { name: "Ibrahim", nameAr: "إبراهيم", verses: 52 },
        15: { name: "Al-Hijr", nameAr: "الحجر", verses: 99 },
        16: { name: "An-Nahl", nameAr: "النحل", verses: 128 },
        17: { name: "Al-Isra", nameAr: "الإسراء", verses: 111 },
        18: { name: "Al-Kahf", nameAr: "الكهف", verses: 110 },
        19: { name: "Maryam", nameAr: "مريم", verses: 98 },
        20: { name: "Ta-Ha", nameAr: "طه", verses: 135 },
        21: { name: "Al-Anbiya", nameAr: "الأنبياء", verses: 112 },
        22: { name: "Al-Hajj", nameAr: "الحج", verses: 78 },
        23: { name: "Al-Muminun", nameAr: "المؤمنون", verses: 118 },
        24: { name: "An-Nur", nameAr: "النور", verses: 64 },
        25: { name: "Al-Furqan", nameAr: "الفرقان", verses: 77 },
        26: { name: "Ash-Shuara", nameAr: "الشعراء", verses: 227 },
        27: { name: "An-Naml", nameAr: "النمل", verses: 93 },
        28: { name: "Al-Qasas", nameAr: "القصص", verses: 88 },
        29: { name: "Al-Ankabut", nameAr: "العنكبوت", verses: 69 },
        30: { name: "Ar-Rum", nameAr: "الروم", verses: 60 },
        31: { name: "Luqman", nameAr: "لقمان", verses: 34 },
        32: { name: "As-Sajdah", nameAr: "السجدة", verses: 30 },
        33: { name: "Al-Ahzab", nameAr: "الأحزاب", verses: 73 },
        34: { name: "Saba", nameAr: "سبأ", verses: 54 },
        35: { name: "Fatir", nameAr: "فاطر", verses: 45 },
        36: { name: "Yasin", nameAr: "يس", verses: 83 },
        37: { name: "As-Saffat", nameAr: "الصافات", verses: 182 },
        38: { name: "Sad", nameAr: "ص", verses: 88 },
        39: { name: "Az-Zumar", nameAr: "الزمر", verses: 75 },
        40: { name: "Ghafir", nameAr: "غافر", verses: 85 },
        41: { name: "Fussilat", nameAr: "فصلت", verses: 54 },
        42: { name: "Ash-Shura", nameAr: "الشورى", verses: 53 },
        43: { name: "Az-Zukhruf", nameAr: "الزخرف", verses: 89 },
        44: { name: "Ad-Dukhan", nameAr: "الدخان", verses: 59 },
        45: { name: "Al-Jathiyah", nameAr: "الجاثية", verses: 37 },
        46: { name: "Al-Ahqaf", nameAr: "الأحقاف", verses: 35 },
        47: { name: "Muhammad", nameAr: "محمد", verses: 38 },
        48: { name: "Al-Fath", nameAr: "الفتح", verses: 29 },
        49: { name: "Al-Hujurat", nameAr: "الحجرات", verses: 18 },
        50: { name: "Qaf", nameAr: "ق", verses: 45 },
        51: { name: "Adh-Dhariyat", nameAr: "الذاريات", verses: 60 },
        52: { name: "At-Tur", nameAr: "الطور", verses: 49 },
        53: { name: "An-Najm", nameAr: "النجم", verses: 62 },
        54: { name: "Al-Qamar", nameAr: "القمر", verses: 55 },
        55: { name: "Ar-Rahman", nameAr: "الرحمن", verses: 78 },
        56: { name: "Al-Waqiah", nameAr: "الواقعة", verses: 96 },
        57: { name: "Al-Hadid", nameAr: "الحديد", verses: 29 },
        58: { name: "Al-Mujadila", nameAr: "المجادلة", verses: 22 },
        59: { name: "Al-Hashr", nameAr: "الحشر", verses: 24 },
        60: { name: "Al-Mumtahanah", nameAr: "الممتحنة", verses: 13 },
        61: { name: "As-Saf", nameAr: "الصف", verses: 14 },
        62: { name: "Al-Jumuah", nameAr: "الجمعة", verses: 11 },
        63: { name: "Al-Munafiqun", nameAr: "المنافقون", verses: 11 },
        64: { name: "At-Taghabun", nameAr: "التغابن", verses: 18 },
        65: { name: "At-Talaq", nameAr: "الطلاق", verses: 12 },
        66: { name: "At-Tahrim", nameAr: "التحريم", verses: 12 },
        67: { name: "Al-Mulk", nameAr: "الملك", verses: 30 },
        68: { name: "Al-Qalam", nameAr: "القلم", verses: 52 },
        69: { name: "Al-Haqqah", nameAr: "الحاقة", verses: 52 },
        70: { name: "Al-Maarij", nameAr: "المعارج", verses: 44 },
        71: { name: "Nuh", nameAr: "نوح", verses: 28 },
        72: { name: "Al-Jinn", nameAr: "الجن", verses: 28 },
        73: { name: "Al-Muzzammil", nameAr: "المزمل", verses: 20 },
        74: { name: "Al-Muddaththir", nameAr: "المدثر", verses: 56 },
        75: { name: "Al-Qiyamah", nameAr: "القيامة", verses: 40 },
        76: { name: "Al-Insan", nameAr: "الإنسان", verses: 31 },
        77: { name: "Al-Mursalat", nameAr: "المرسلات", verses: 50 },
        78: { name: "An-Naba", nameAr: "النبأ", verses: 40 },
        79: { name: "An-Naziat", nameAr: "النازعات", verses: 46 },
        80: { name: "Abasa", nameAr: "عبس", verses: 42 },
        81: { name: "At-Takwir", nameAr: "التكوير", verses: 29 },
        82: { name: "Al-Infitar", nameAr: "الانفطار", verses: 19 },
        83: { name: "Al-Mutaffifin", nameAr: "المطففين", verses: 36 },
        84: { name: "Al-Inshiqaq", nameAr: "الانشقاق", verses: 25 },
        85: { name: "Al-Buruj", nameAr: "البروج", verses: 22 },
        86: { name: "At-Tariq", nameAr: "الطارق", verses: 17 },
        87: { name: "Al-Ala", nameAr: "الأعلى", verses: 19 },
        88: { name: "Al-Ghashiyah", nameAr: "الغاشية", verses: 26 },
        89: { name: "Al-Fajr", nameAr: "الفجر", verses: 30 },
        90: { name: "Al-Balad", nameAr: "البلد", verses: 20 },
        91: { name: "Ash-Shams", nameAr: "الشمس", verses: 15 },
        92: { name: "Al-Layl", nameAr: "الليل", verses: 21 },
        93: { name: "Ad-Duha", nameAr: "الضحى", verses: 11 },
        94: { name: "Ash-Sharh", nameAr: "الشرح", verses: 8 },
        95: { name: "At-Tin", nameAr: "التين", verses: 8 },
        96: { name: "Al-Alaq", nameAr: "العلق", verses: 19 },
        97: { name: "Al-Qadr", nameAr: "القدر", verses: 5 },
        98: { name: "Al-Bayyinah", nameAr: "البينة", verses: 8 },
        99: { name: "Az-Zalzalah", nameAr: "الزلزلة", verses: 8 },
        100: { name: "Al-Adiyat", nameAr: "العاديات", verses: 11 },
        101: { name: "Al-Qariah", nameAr: "القارعة", verses: 11 },
        102: { name: "At-Takathur", nameAr: "التكاثر", verses: 8 },
        103: { name: "Al-Asr", nameAr: "العصر", verses: 3 },
        104: { name: "Al-Humazah", nameAr: "الهمزة", verses: 9 },
        105: { name: "Al-Fil", nameAr: "الفيل", verses: 5 },
        106: { name: "Quraysh", nameAr: "قريش", verses: 4 },
        107: { name: "Al-Maun", nameAr: "الماعون", verses: 7 },
        108: { name: "Al-Kawthar", nameAr: "الكوثر", verses: 3 },
        109: { name: "Al-Kafirun", nameAr: "الكافرون", verses: 6 },
        110: { name: "An-Nasr", nameAr: "النصر", verses: 3 },
        111: { name: "Al-Masad", nameAr: "المسد", verses: 5 },
        112: { name: "Al-Ikhlas", nameAr: "الإخلاص", verses: 4 },
        113: { name: "Al-Falaq", nameAr: "الفلق", verses: 5 },
        114: { name: "An-Nas", nameAr: "الناس", verses: 6 },
    };

    return surahs[surahNumber] || { name: `Surah ${surahNumber}`, nameAr: `سورة ${surahNumber}`, verses: 0 };
}

function getDefaultBadgeDefinitions() {
    return [
        // Memorization milestones
        { id: "first-surah", name: "First Surah", nameAr: "أول سورة", description: "Memorize your first surah", descriptionAr: "حفظت أول سورة", icon: "🌱", type: "MEMORIZATION_MILESTONE", criteria: "Memorize 1 surah" },
        { id: "ten-surahs", name: "Ten Surahs", nameAr: "عشر سور", description: "Memorize 10 surahs", descriptionAr: "حفظت عشر سور", icon: "📖", type: "MEMORIZATION_MILESTONE", criteria: "Memorize 10 surahs" },
        { id: "thirty-surahs", name: "Thirty Surahs", nameAr: "ثلاثون سورة", description: "Memorize 30 surahs", descriptionAr: "حفظت ثلاثين سورة", icon: "🎯", type: "MEMORIZATION_MILESTONE", criteria: "Memorize 30 surahs" },
        { id: "half-quran", name: "Half Quran", nameAr: "نصف القرآن", description: "Memorize 57 surahs (half the Quran)", descriptionAr: "حفظت 57 سورة", icon: "📚", type: "MEMORIZATION_MILESTONE", criteria: "Memorize 57 surahs" },
        { id: "full-quran", name: "Full Quran", nameAr: "القرآن كامل", description: "Memorize all 114 surahs", descriptionAr: "حفظت القرآن كاملاً", icon: "👑", type: "MEMORIZATION_MILESTONE", criteria: "Memorize all 114 surahs" },

        // Streak badges
        { id: "streak-7", name: "Week Warrior", nameAr: "محارب الأسبوع", description: "7-day attendance streak", descriptionAr: "حضور متواصل لسبعة أيام", icon: "🔥", type: "STREAK", criteria: "7-day streak" },
        { id: "streak-30", name: "Month Master", nameAr: "سيد الشهر", description: "30-day attendance streak", descriptionAr: "حضور متواصل لثلاثين يوماً", icon: "💎", type: "STREAK", criteria: "30-day streak" },
        { id: "streak-90", name: "Quarter Champion", nameAr: "بطل الربع", description: "90-day attendance streak", descriptionAr: "حضور متواصل لتسعين يوماً", icon: "🏅", type: "STREAK", criteria: "90-day streak" },
        { id: "streak-365", name: "Year Legend", nameAr: "أسطورة السنة", description: "365-day attendance streak", descriptionAr: "حضور متواصل لسنة كاملة", icon: "🌟", type: "STREAK", criteria: "365-day streak" },

        // Stars badges
        { id: "stars-100", name: "Rising Star", nameAr: "نجم صاعد", description: "Earn 100 stars", descriptionAr: "اكتسبت 100 نجمة", icon: "⭐", type: "STARS", criteria: "100 stars" },
        { id: "stars-500", name: "Shining Star", nameAr: "نجم لامع", description: "Earn 500 stars", descriptionAr: "اكتسبت 500 نجمة", icon: "🌠", type: "STARS", criteria: "500 stars" },
        { id: "stars-1000", name: "Super Star", nameAr: "نجم فوق", description: "Earn 1000 stars", descriptionAr: "اكتسبت 1000 نجمة", icon: "💫", type: "STARS", criteria: "1000 stars" },
        { id: "stars-5000", name: "Legendary Star", nameAr: "نجم أسطوري", description: "Earn 5000 stars", descriptionAr: "اكتسبت 5000 نجمة", icon: "✨", type: "STARS", criteria: "5000 stars" },

        // Evaluation badges
        { id: "excellent-eval", name: "Excellence", nameAr: "التميز", description: "Receive your first Excellent evaluation", descriptionAr: "حصلت على أول تقييم ممتاز", icon: "🏆", type: "EVALUATION", criteria: "1 excellent evaluation" },
        { id: "excellent-5", name: "Excellence Master", nameAr: "سيد التميز", description: "Receive 5 Excellent evaluations", descriptionAr: "حصلت على 5 تقييمات ممتازة", icon: "🎖️", type: "EVALUATION", criteria: "5 excellent evaluations" },
        { id: "excellent-10", name: "Excellence Legend", nameAr: "أسطورة التميز", description: "Receive 10 Excellent evaluations", descriptionAr: "حصلت على 10 تقييمات ممتازة", icon: "👑", type: "EVALUATION", criteria: "10 excellent evaluations" },

        // Verses badges
        { id: "verses-100", name: "Verse Collector", nameAr: "جامع الآيات", description: "Memorize 100 verses", descriptionAr: "حفظت 100 آية", icon: "📝", type: "VERSES", criteria: "100 verses" },
        { id: "verses-500", name: "Verse Master", nameAr: "سيد الآيات", description: "Memorize 500 verses", descriptionAr: "حفظت 500 آية", icon: "📜", type: "VERSES", criteria: "500 verses" },
        { id: "verses-1000", name: "Verse Legend", nameAr: "أسطورة الآيات", description: "Memorize 1000 verses", descriptionAr: "حفظت 1000 آية", icon: "📕", type: "VERSES", criteria: "1000 verses" },
    ];
}

function getBadgeRarity(type: string, id: string): "common" | "rare" | "epic" | "legendary" {
    // Legendary badges
    if (["full-quran", "streak-365", "stars-5000", "excellent-10"].includes(id)) {
        return "legendary";
    }
    // Epic badges
    if (["half-quran", "streak-90", "stars-1000", "excellent-5"].includes(id)) {
        return "epic";
    }
    // Rare badges
    if (["thirty-surahs", "streak-30", "stars-500", "excellent-eval", "verses-500", "verses-1000"].includes(id)) {
        return "rare";
    }
    // Common badges
    return "common";
}
