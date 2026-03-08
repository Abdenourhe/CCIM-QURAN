import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    try {
        const session = await auth();
        const { studentId } = await params;

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify the student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // Check access permissions
        if (session.user.role === "STUDENT") {
            const currentStudent = await prisma.student.findUnique({
                where: { userId: session.user.id },
            });
            if (!currentStudent || currentStudent.id !== studentId) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        } else if (session.user.role === "PARENT") {
            const parent = await prisma.parent.findUnique({
                where: { userId: session.user.id },
            });
            if (parent && !student.parents.some((p: { id: string }) => p.id === parent.id)) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const studentBadges = await prisma.studentBadge.findMany({
            where: { studentId },
            include: {
                badge: true,
            },
            orderBy: { earnedAt: "desc" },
        });

        return NextResponse.json({
            student: {
                id: student.id,
                user: student.user,
            },
            badges: studentBadges,
            totalBadges: studentBadges.length,
        });
    } catch (error) {
        console.error("Error fetching student badges:", error);
        return NextResponse.json({ error: "Failed to fetch student badges" }, { status: 500 });
    }
}
