import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAnnouncementSchema = z.object({
    title: z.string().min(1, "Title is required"),
    titleAr: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    contentAr: z.string().optional(),
    target: z.enum(["ALL", "STUDENTS", "TEACHERS", "PARENTS", "GROUP"]).default("ALL"),
    groupId: z.string().cuid().optional(),
});

const updateAnnouncementSchema = z.object({
    title: z.string().min(1).optional(),
    titleAr: z.string().optional(),
    content: z.string().min(1).optional(),
    contentAr: z.string().optional(),
    pinned: z.boolean().optional(),
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
        const target = searchParams.get("target");
        const groupId = searchParams.get("groupId");

        const where: any = {};

        if (target) {
            where.target = target;
        }

        if (groupId) {
            where.groupId = groupId;
        }

        // Role-based filtering for target
        if (session.user.role === "STUDENT") {
            where.OR = [
                { target: "ALL" },
                { target: "STUDENTS" },
            ];
        } else if (session.user.role === "PARENT") {
            where.OR = [
                { target: "ALL" },
                { target: "PARENTS" },
            ];
        } else if (session.user.role === "TEACHER") {
            where.OR = [
                { target: "ALL" },
                { target: "TEACHERS" },
            ];
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
                            image: true,
                        },
                    },
                },
            }),
            prisma.announcement.count({ where }),
        ]);

        return NextResponse.json({
            announcements,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = createAnnouncementSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { title, titleAr, content, contentAr, target, groupId } = validated.data;

        const announcement = await prisma.announcement.create({
            data: {
                title,
                titleAr,
                content,
                contentAr,
                target,
                groupId,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json(announcement, { status: 201 });
    } catch (error) {
        console.error("Error creating announcement:", error);
        return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
    }
}
