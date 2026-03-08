import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStudentSchema, updateStudentSchema } from "@/lib/validations/student";

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const groupId = searchParams.get("groupId");
        const status = searchParams.get("status"); // 'active', 'inactive'

        const where: any = {};

        if (groupId) {
            where.groupId = groupId;
        }

        // For role-based filtering
        if (session.user.role === "TEACHER") {
            // Teachers can see students in their groups
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.user.id },
            });
            if (teacher) {
                where.group = { teacherId: teacher.id };
            }
        } else if (session.user.role === "PARENT") {
            // Parents can see their children
            const parent = await prisma.parent.findUnique({
                where: { userId: session.user.id },
            });
            if (parent) {
                where.parents = { some: { id: parent.id } };
            }
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { enrolledAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            role: true,
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
            prisma.student.count({ where }),
        ]);

        return NextResponse.json({
            students,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = createStudentSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { userId, dateOfBirth, groupId, parentIds } = validated.data;

        // Check if user exists and is a student
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.role !== "STUDENT") {
            return NextResponse.json({ error: "Invalid student user" }, { status: 400 });
        }

        // Check if student profile already exists
        const existingStudent = await prisma.student.findUnique({
            where: { userId },
        });

        if (existingStudent) {
            return NextResponse.json({ error: "Student profile already exists" }, { status: 400 });
        }

        const student = await prisma.student.create({
            data: {
                userId,
                dateOfBirth,
                groupId,
                parents: parentIds ? {
                    connect: parentIds.map(id => ({ id })),
                } : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                group: true,
            },
        });

        return NextResponse.json(student, { status: 201 });
    } catch (error) {
        console.error("Error creating student:", error);
        return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
    }
}
