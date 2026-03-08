import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEvaluationSchema } from "@/lib/validations/evaluation";

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
        const teacherId = searchParams.get("teacherId");

        const where: any = {};

        if (studentId) {
            where.studentId = studentId;
        }

        if (teacherId) {
            where.teacherId = teacherId;
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

        const [evaluations, total] = await Promise.all([
            prisma.evaluation.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { evaluatedAt: "desc" },
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
                },
            }),
            prisma.evaluation.count({ where }),
        ]);

        return NextResponse.json({
            evaluations,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching evaluations:", error);
        return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.user.id },
        });

        if (!teacher) {
            return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
        }

        const body = await request.json();
        const validated = createEvaluationSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { studentId, surahNumber, verseFrom, verseTo, grade, tajweed, fluency, makharij, notes } = validated.data;

        const evaluation = await prisma.evaluation.create({
            data: {
                studentId,
                teacherId: teacher.id,
                surahNumber,
                verseFrom,
                verseTo,
                grade,
                tajweed,
                fluency,
                makharij: makharij || 0,
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
            },
        });

        return NextResponse.json(evaluation, { status: 201 });
    } catch (error) {
        console.error("Error creating evaluation:", error);
        return NextResponse.json({ error: "Failed to create evaluation" }, { status: 500 });
    }
}
