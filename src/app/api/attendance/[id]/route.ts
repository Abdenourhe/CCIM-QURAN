import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAttendanceSchema = z.object({
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).optional(),
    notes: z.string().optional(),
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

        const attendance = await prisma.attendance.findUnique({
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
        });

        if (!attendance) {
            return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
        }

        return NextResponse.json(attendance);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
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
        const validated = updateAttendanceSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const attendance = await prisma.attendance.findUnique({
            where: { id },
        });

        if (!attendance) {
            return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
        }

        // Teachers can only update their own attendance records
        if (session.user.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.user.id },
            });
            if (!teacher || attendance.teacherId !== teacher.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const updatedAttendance = await prisma.attendance.update({
            where: { id },
            data: validated.data,
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

        return NextResponse.json(updatedAttendance);
    } catch (error) {
        console.error("Error updating attendance:", error);
        return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const attendance = await prisma.attendance.findUnique({
            where: { id },
        });

        if (!attendance) {
            return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
        }

        // Teachers can only delete their own attendance records
        if (session.user.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.user.id },
            });
            if (!teacher || attendance.teacherId !== teacher.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        await prisma.attendance.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Attendance deleted successfully" });
    } catch (error) {
        console.error("Error deleting attendance:", error);
        return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 });
    }
}
