import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAttendanceSchema = z.object({
    studentId: z.string().cuid(),
    groupId: z.string().cuid(),
    date: z.coerce.date(),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).default("PRESENT"),
    notes: z.string().optional(),
});

const updateAttendanceSchema = z.object({
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).optional(),
    notes: z.string().optional(),
});

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const studentId = searchParams.get("studentId");
        const groupId = searchParams.get("groupId");
        const date = searchParams.get("date");

        const where: any = {};

        if (studentId) {
            where.studentId = studentId;
        }

        if (groupId) {
            where.groupId = groupId;
        }

        if (date) {
            const dateObj = new Date(date);
            const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
            const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
            where.date = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        // Role-based filtering
        if (session.user.role === "STUDENT") {
            const student = await prisma.student.findUnique({
                where: { userId: session.user.id },
            });
            if (student) {
                where.studentId = student.id;
            }
        } else if (session.user.role === "PARENT") {
            const parent = await prisma.parent.findUnique({
                where: { userId: session.user.id },
            });
            if (parent) {
                where.student = { parents: { some: { id: parent.id } } };
            }
        } else if (session.user.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.user.id },
            });
            if (teacher) {
                where.teacherId = teacher.id;
            }
        }

        const [attendance, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { date: "desc" },
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    group: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.attendance.count({ where }),
        ]);

        return NextResponse.json({
            attendance,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.user.id },
        });

        if (!teacher && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
        }

        const body = await request.json();
        const validated = createAttendanceSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { studentId, groupId, date, status, notes } = validated.data;

        // Check for duplicate attendance
        const existing = await prisma.attendance.findUnique({
            where: {
                studentId_date: {
                    studentId,
                    date,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Attendance already recorded for this student and date" },
                { status: 400 }
            );
        }

        const attendance = await prisma.attendance.create({
            data: {
                studentId,
                teacherId: teacher?.id || "",
                groupId,
                date,
                status,
                notes,
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(attendance, { status: 201 });
    } catch (error) {
        console.error("Error creating attendance:", error);
        return NextResponse.json({ error: "Failed to create attendance" }, { status: 500 });
    }
}
