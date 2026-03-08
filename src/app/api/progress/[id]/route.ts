import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateProgressSchema = {
    versesMemorized: z.number().int().min(0).optional(),
    percentage: z.number().min(0).max(100).optional(),
};

import { z } from "zod";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const progress = await prisma.progress.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        group: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!progress) {
            return NextResponse.json({ error: "Progress not found" }, { status: 404 });
        }

        return NextResponse.json(progress);
    } catch (error) {
        console.error("Error fetching progress:", error);
        return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const progress = await prisma.progress.findUnique({
            where: { id },
            include: { student: true },
        });

        if (!progress) {
            return NextResponse.json({ error: "Progress not found" }, { status: 404 });
        }

        // Calculate percentage if versesMemorized is being updated
        let percentage = body.percentage;
        if (body.versesMemorized !== undefined) {
            percentage = (body.versesMemorized / progress.versesTotal) * 100;
        }

        const updatedProgress = await prisma.progress.update({
            where: { id },
            data: {
                ...(body.versesMemorized !== undefined && { versesMemorized: body.versesMemorized }),
                ...(percentage !== undefined && { percentage }),
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

        return NextResponse.json(updatedProgress);
    } catch (error) {
        console.error("Error updating progress:", error);
        return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const progress = await prisma.progress.findUnique({
            where: { id },
        });

        if (!progress) {
            return NextResponse.json({ error: "Progress not found" }, { status: 404 });
        }

        await prisma.progress.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Progress deleted successfully" });
    } catch (error) {
        console.error("Error deleting progress:", error);
        return NextResponse.json({ error: "Failed to delete progress" }, { status: 500 });
    }
}
