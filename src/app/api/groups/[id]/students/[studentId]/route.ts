import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; studentId: string }> }
) {
    try {
        const session = await auth();
        const { id, studentId } = await params;

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

        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // Remove student from group
        await prisma.student.update({
            where: { id: studentId },
            data: { groupId: null },
        });

        return NextResponse.json({ message: "Student removed from group" });
    } catch (error) {
        console.error("Error removing student from group:", error);
        return NextResponse.json({ error: "Failed to remove student from group" }, { status: 500 });
    }
}
