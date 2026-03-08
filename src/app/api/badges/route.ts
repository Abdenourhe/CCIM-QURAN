import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const awardBadgeSchema = z.object({
    studentId: z.string().cuid(),
    badgeId: z.string().cuid(),
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

        const [badges, total] = await Promise.all([
            prisma.badge.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prisma.badge.count(),
        ]);

        return NextResponse.json({
            badges,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching badges:", error);
        return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = awardBadgeSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { studentId, badgeId } = validated.data;

        // Verify student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // Verify badge exists
        const badge = await prisma.badge.findUnique({
            where: { id: badgeId },
        });

        if (!badge) {
            return NextResponse.json({ error: "Badge not found" }, { status: 404 });
        }

        // Check if student already has this badge
        const existing = await prisma.studentBadge.findUnique({
            where: {
                studentId_badgeId: {
                    studentId,
                    badgeId,
                },
            },
        });

        if (existing) {
            return NextResponse.json({ error: "Student already has this badge" }, { status: 400 });
        }

        const studentBadge = await prisma.studentBadge.create({
            data: {
                studentId,
                badgeId,
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
                badge: true,
            },
        });

        return NextResponse.json(studentBadge, { status: 201 });
    } catch (error) {
        console.error("Error awarding badge:", error);
        return NextResponse.json({ error: "Failed to award badge" }, { status: 500 });
    }
}
