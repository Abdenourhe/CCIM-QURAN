"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Use require for Next.js functions to avoid TypeScript issues
const nextCache = require("next/cache");
const revalidatePath = nextCache.revalidatePath;

// ==================== USER VALIDATIONS ====================

export const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    role: z.enum(["ADMIN", "TEACHER", "PARENT", "STUDENT"]),
    bio: z.string().optional(),
    specialization: z.string().optional(),
    dateOfBirth: z.string().optional(),
    groupId: z.string().optional(),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    role: z.enum(["ADMIN", "TEACHER", "PARENT", "STUDENT"]).optional(),
    isActive: z.boolean().optional(),
    bio: z.string().optional(),
    specialization: z.string().optional(),
    dateOfBirth: z.string().optional(),
    groupId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ==================== GROUP VALIDATIONS ====================

export const createGroupSchema = z.object({
    name: z.string().min(2, "Group name is required"),
    description: z.string().optional(),
    teacherId: z.string().min(1, "Teacher is required"),
});

export const updateGroupSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    teacherId: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// ==================== ANNOUNCEMENT VALIDATIONS ====================

export const createAnnouncementSchema = z.object({
    title: z.string().min(2, "Title is required"),
    titleAr: z.string().optional(),
    content: z.string().min(10, "Content must be at least 10 characters"),
    contentAr: z.string().optional(),
    target: z.string().default("ALL"),
    groupId: z.string().optional(),
    pinned: z.boolean().default(false),
});

export const updateAnnouncementSchema = z.object({
    title: z.string().min(2).optional(),
    titleAr: z.string().optional(),
    content: z.string().min(10).optional(),
    contentAr: z.string().optional(),
    target: z.string().optional(),
    groupId: z.string().optional(),
    pinned: z.boolean().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// ==================== USER ACTIONS ====================

export async function createUser(data: CreateUserInput) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return { error: "Email already exists" };
        }

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                gender: data.gender,
                role: data.role,
                teacherProfile: data.role === "TEACHER" ? {
                    create: {
                        bio: data.bio,
                        speciality: data.specialization,
                    },
                } : undefined,
                studentProfile: data.role === "STUDENT" ? {
                    create: {
                        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                        groupId: data.groupId,
                    },
                } : undefined,
            },
            include: {
                teacherProfile: true,
                studentProfile: true,
            },
        });

        revalidatePath("/admin/users");
        return { success: true, user };
    } catch (error) {
        console.error("Error creating user:", error);
        return { error: "Failed to create user" };
    }
}

export async function updateUser(id: string, data: UpdateUserInput) {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id },
            include: {
                teacherProfile: true,
                studentProfile: true,
            },
        });

        if (!currentUser) {
            return { error: "User not found" };
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                gender: data.gender,
                isActive: data.isActive,
            },
        });

        if (data.role === "TEACHER") {
            await prisma.teacher.upsert({
                where: { userId: id },
                update: {
                    bio: data.bio,
                    speciality: data.specialization,
                },
                create: {
                    userId: id,
                    bio: data.bio,
                    speciality: data.specialization,
                },
            });
        }

        if (data.role === "STUDENT") {
            await prisma.student.upsert({
                where: { userId: id },
                update: {
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    groupId: data.groupId,
                },
                create: {
                    userId: id,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    groupId: data.groupId,
                },
            });
        }

        revalidatePath("/admin/users");
        return { success: true, user };
    } catch (error) {
        console.error("Error updating user:", error);
        return { error: "Failed to update user" };
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({
            where: { id },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { error: "Failed to delete user" };
    }
}

export async function getUsers(filters?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const { search, role, page = 1, limit = 10 } = filters || {};

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }

        if (role && role !== "ALL") {
            where.role = role;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    teacherProfile: true,
                    studentProfile: {
                        include: {
                            group: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Error getting users:", error);
        return { error: "Failed to get users", users: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }
}

export async function getUserById(id: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                teacherProfile: true,
                studentProfile: {
                    include: {
                        group: true,
                    },
                },
            },
        });

        return user;
    } catch (error) {
        console.error("Error getting user:", error);
        return null;
    }
}

// ==================== GROUP ACTIONS ====================

export async function createGroup(data: CreateGroupInput) {
    try {
        const group = await prisma.group.create({
            data: {
                name: data.name,
                description: data.description,
                teacherId: data.teacherId,
            },
            include: {
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        revalidatePath("/admin/groups");
        return { success: true, group };
    } catch (error) {
        console.error("Error creating group:", error);
        return { error: "Failed to create group" };
    }
}

export async function updateGroup(id: string, data: UpdateGroupInput) {
    try {
        const group = await prisma.group.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                teacherId: data.teacherId,
            },
            include: {
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        revalidatePath("/admin/groups");
        return { success: true, group };
    } catch (error) {
        console.error("Error updating group:", error);
        return { error: "Failed to update group" };
    }
}

export async function deleteGroup(id: string) {
    try {
        await prisma.student.updateMany({
            where: { groupId: id },
            data: { groupId: null },
        });

        await prisma.group.delete({
            where: { id },
        });

        revalidatePath("/admin/groups");
        return { success: true };
    } catch (error) {
        console.error("Error deleting group:", error);
        return { error: "Failed to delete group" };
    }
}

export async function getGroups(filters?: {
    search?: string;
    teacherId?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const { search, teacherId, page = 1, limit = 10 } = filters || {};

        const where: Record<string, unknown> = {};

        if (search) {
            where.name = { contains: search };
        }

        if (teacherId) {
            where.teacherId = teacherId;
        }

        const [groups, total] = await Promise.all([
            prisma.group.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    teacher: {
                        include: {
                            user: true,
                        },
                    },
                    students: true,
                },
            }),
            prisma.group.count({ where }),
        ]);

        return {
            groups,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Error getting groups:", error);
        return { error: "Failed to get groups", groups: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }
}

export async function getGroupById(id: string) {
    try {
        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                teacher: {
                    include: {
                        user: true,
                    },
                },
                students: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return group;
    } catch (error) {
        console.error("Error getting group:", error);
        return null;
    }
}

// ==================== ANNOUNCEMENT ACTIONS ====================

export async function createAnnouncement(data: CreateAnnouncementInput, authorId: string) {
    try {
        const announcement = await prisma.announcement.create({
            data: {
                title: data.title,
                titleAr: data.titleAr,
                content: data.content,
                contentAr: data.contentAr,
                target: data.target,
                groupId: data.groupId,
                pinned: data.pinned,
                authorId,
            },
        });

        revalidatePath("/admin/announcements");
        return { success: true, announcement };
    } catch (error) {
        console.error("Error creating announcement:", error);
        return { error: "Failed to create announcement" };
    }
}

export async function updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
    try {
        const announcement = await prisma.announcement.update({
            where: { id },
            data: {
                title: data.title,
                titleAr: data.titleAr,
                content: data.content,
                contentAr: data.contentAr,
                target: data.target,
                groupId: data.groupId,
                pinned: data.pinned,
            },
        });

        revalidatePath("/admin/announcements");
        return { success: true, announcement };
    } catch (error) {
        console.error("Error updating announcement:", error);
        return { error: "Failed to update announcement" };
    }
}

export async function deleteAnnouncement(id: string) {
    try {
        await prisma.announcement.delete({
            where: { id },
        });

        revalidatePath("/admin/announcements");
        return { success: true };
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return { error: "Failed to delete announcement" };
    }
}

export async function toggleAnnouncementPin(id: string) {
    try {
        const announcement = await prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) {
            return { error: "Announcement not found" };
        }

        const updated = await prisma.announcement.update({
            where: { id },
            data: { pinned: !announcement.pinned },
        });

        revalidatePath("/admin/announcements");
        return { success: true, announcement: updated };
    } catch (error) {
        console.error("Error toggling announcement pin:", error);
        return { error: "Failed to toggle announcement pin" };
    }
}

export async function getAnnouncements(filters?: {
    search?: string;
    target?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const { search, target, page = 1, limit = 10 } = filters || {};

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { content: { contains: search } },
            ];
        }

        if (target && target !== "ALL") {
            where.target = target;
        }

        const [announcements, total] = await Promise.all([
            prisma.announcement.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [
                    { pinned: "desc" },
                    { createdAt: "desc" },
                ],
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.announcement.count({ where }),
        ]);

        return {
            announcements,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Error getting announcements:", error);
        return { error: "Failed to get announcements", announcements: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }
}

export async function getAnnouncementById(id: string) {
    try {
        const announcement = await prisma.announcement.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return announcement;
    } catch (error) {
        console.error("Error getting announcement:", error);
        return null;
    }
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
    try {
        const [
            totalUsers,
            totalStudents,
            totalTeachers,
            totalGroups,
            totalAnnouncements,
            recentUsers,
            recentActivity,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "STUDENT" } }),
            prisma.user.count({ where: { role: "TEACHER" } }),
            prisma.group.count(),
            prisma.announcement.count(),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            }),
            prisma.auditLog.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return {
            totalUsers,
            totalStudents,
            totalTeachers,
            totalGroups,
            totalAnnouncements,
            recentUsers,
            recentActivity,
        };
    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        return {
            totalUsers: 0,
            totalStudents: 0,
            totalTeachers: 0,
            totalGroups: 0,
            totalAnnouncements: 0,
            recentUsers: [],
            recentActivity: [],
        };
    }
}

// ==================== REPORTS ====================

export async function getStudentReports() {
    try {
        const students = await prisma.user.findMany({
            where: { role: "STUDENT" },
            include: {
                studentProfile: {
                    include: {
                        group: true,
                        progress: true,
                        evaluations: true,
                        attendance: true,
                    },
                },
            },
        });

        const studentReports = students.map((student) => {
            const profile = student.studentProfile;
            if (!profile) return null;

            const totalProgress = profile.progress.reduce((acc: number, p: { percentage: number }) => acc + p.percentage, 0);
            const avgProgress = profile.progress.length > 0 ? totalProgress / profile.progress.length : 0;

            const evaluations = profile.evaluations || [];
            const avgScore = evaluations.length > 0
                ? evaluations.reduce((acc: number, e: { grade: string }) => acc + (parseInt(e.grade) || 0), 0) / evaluations.length
                : 0;

            const attendance = profile.attendance || [];
            const presentDays = attendance.filter((a: { status: string }) => a.status === "PRESENT").length;
            const attendanceRate = attendance.length > 0 ? (presentDays / attendance.length) * 100 : 0;

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                group: profile.group?.name || "No Group",
                surahsMemorized: profile.progress.filter((p: { percentage: number }) => p.percentage >= 100).length,
                completionRate: avgProgress,
                avgEvaluationScore: avgScore,
                attendanceRate,
            };
        }).filter(Boolean);

        return studentReports;
    } catch (error) {
        console.error("Error getting student reports:", error);
        return [];
    }
}

export async function getTeacherReports() {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: "TEACHER" },
            include: {
                teacherProfile: {
                    include: {
                        groups: true,
                        evaluations: {
                            where: {
                                evaluatedAt: {
                                    gte: new Date(new Date().setDate(1)),
                                },
                            },
                        },
                    },
                },
            },
        });

        const teacherReports = teachers.map((teacher) => {
            const profile = teacher.teacherProfile;
            if (!profile) return null;

            const totalStudents = profile.groups.reduce((acc: number, g: { students: unknown[] }) => acc + (g.students?.length || 0), 0);
            const evaluationsThisMonth = profile.evaluations.length;

            return {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                specialization: profile.speciality,
                bio: profile.bio,
                groupsCount: profile.groups.length,
                totalStudents,
                evaluationsThisMonth,
            };
        }).filter(Boolean);

        return teacherReports;
    } catch (error) {
        console.error("Error getting teacher reports:", error);
        return [];
    }
}

export async function getGroupReports() {
    try {
        const groups = await prisma.group.findMany({
            include: {
                teacher: {
                    include: {
                        user: true,
                    },
                },
                students: true,
                attendance: {
                    where: {
                        date: {
                            gte: new Date(new Date().setDate(1)),
                        },
                    },
                },
            },
        });

        const groupReports = groups.map((group) => {
            const totalCapacity = 20;
            const currentEnrollment = group.students.length;
            const enrollmentRate = (currentEnrollment / totalCapacity) * 100;

            const attendance = group.attendance || [];
            const presentCount = attendance.filter((a: { status: string }) => a.status === "PRESENT").length;
            const attendanceRate = attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0;

            return {
                id: group.id,
                name: group.name,
                teacher: group.teacher.user.name,
                currentEnrollment,
                maxCapacity: totalCapacity,
                enrollmentRate,
                attendanceRate,
            };
        });

        return groupReports;
    } catch (error) {
        console.error("Error getting group reports:", error);
        return [];
    }
}

// ==================== TEACHERS LIST ====================

export async function getTeachers() {
    try {
        const teachers = await prisma.teacher.findMany({
            include: {
                user: true,
                groups: true,
            },
        });

        return teachers;
    } catch (error) {
        console.error("Error getting teachers:", error);
        return [];
    }
}

// ==================== GROUPS LIST ====================

export async function getAllGroups() {
    try {
        const groups = await prisma.group.findMany({
            orderBy: { name: "asc" },
            include: {
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return groups;
    } catch (error) {
        console.error("Error getting groups:", error);
        return [];
    }
}
