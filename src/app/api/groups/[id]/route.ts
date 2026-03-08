import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateGroupSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    teacherId: z.string().cuid().optional(),
});

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

        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                teacher: {
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
                },
                students: {
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
                },
            },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Check access permissions
        if (session.user.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.user.id },
            });
            if (!teacher || group.teacherId !== teacher.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        return NextResponse.json(group);
    } catch (error) {
        console.error("Error fetching group:", error);
        return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = updateGroupSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const group = await prisma.group.findUnique({
            where: { id },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        const updatedGroup = await prisma.group.update({
            where: { id },
            data: validated.data,
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(updatedGroup);
    } catch (error) {
        console.error("Error updating group:", error);
        return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
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

        const group = await prisma.group.findUnique({
            where: { id },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Remove all students from group first
        await prisma.student.updateMany({
            where: { groupId: id },
            data: { groupId: null },
        });

        await prisma.group.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error("Error deleting group:", error);
        return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
    }
}

// Add student to group
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Teachers can only modify their own groups
        if (session.user.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.user.id },
            });
            if (!teacher) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const group = await prisma.group.findUnique({ where: { id } });
            if (!group || group.teacherId !== teacher.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ error: "Student ID required" }, { status: 400 });
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        const updatedStudent = await prisma.student.update({
            where: { id: studentId },
            data: { groupId: id },
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

        return NextResponse.json(updatedStudent);
    } catch (error) {
        console.error("Error adding student to group:", error);
        return NextResponse.json({ error: "Failed to add student to group" }, { status: 500 });
    }
}
