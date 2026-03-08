import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProgressSchema = z.object({
    studentId: z.string().cuid(),
    surahNumber: z.number().int().min(1).max(114),
    surahName: z.string(),
    versesTotal: z.number().int().min(1),
    versesMemorized: z.number().int().min(0).optional().default(0),
});

const updateProgressSchema = z.object({
    versesMemorized: z.number().int().min(0).optional(),
    percentage: z.number().min(0).max(100).optional(),
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

        const where: any = {};

        if (studentId) {
            where.studentId = studentId;
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
                where.student = { group: { teacherId: teacher.id } };
            }
        }

        const [progress, total] = await Promise.all([
            prisma.progress.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { lastUpdated: "desc" },
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
                },
            }),
            prisma.progress.count({ where }),
        ]);

        return NextResponse.json({
            progress,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching progress:", error);
        return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = createProgressSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { studentId, surahNumber, surahName, versesTotal, versesMemorized } = validated.data;

        // Check if progress already exists for this student and surah
        const existing = await prisma.progress.findUnique({
            where: {
                studentId_surahNumber: {
                    studentId,
                    surahNumber,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Progress already exists for this surah" },
                { status: 400 }
            );
        }

        const percentage = versesMemorized ? (versesMemorized / versesTotal) * 100 : 0;

        const progress = await prisma.progress.create({
            data: {
                studentId,
                surahNumber,
                surahName,
                versesTotal,
                versesMemorized,
                percentage,
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
            },
        });

        return NextResponse.json(progress, { status: 201 });
    } catch (error) {
        console.error("Error creating progress:", error);
        return NextResponse.json({ error: "Failed to create progress" }, { status: 500 });
    }
}
