import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTeacherSchema = z.object({
    userId: z.string().cuid(),
    speciality: z.string().optional(),
    bio: z.string().optional(),
});

const updateTeacherSchema = createTeacherSchema.partial();

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const where: any = {};

        if (search) {
            where.OR = [
                { user: { name: { contains: search } } },
                { speciality: { contains: search } },
            ];
        }

        const [teachers, total] = await Promise.all([
            prisma.teacher.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { id: "asc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                    groups: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.teacher.count({ where }),
        ]);

        return NextResponse.json({
            teachers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = createTeacherSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { userId, speciality, bio } = validated.data;

        // Check if user exists and is a teacher
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.role !== "TEACHER") {
            return NextResponse.json({ error: "Invalid teacher user" }, { status: 400 });
        }

        // Check if teacher profile already exists
        const existingTeacher = await prisma.teacher.findUnique({
            where: { userId },
        });

        if (existingTeacher) {
            return NextResponse.json({ error: "Teacher profile already exists" }, { status: 400 });
        }

        const teacher = await prisma.teacher.create({
            data: {
                userId,
                speciality,
                bio,
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
            },
        });

        return NextResponse.json(teacher, { status: 201 });
    } catch (error) {
        console.error("Error creating teacher:", error);
        return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
    }
}
