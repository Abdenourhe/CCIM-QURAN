import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEvaluationSchema } from "@/lib/validations/evaluation";

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

        const evaluation = await prisma.evaluation.findUnique({
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

        if (!evaluation) {
            return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
        }

        // Check access permissions
        if (session.user.role === "STUDENT") {
            const student = await prisma.student.findUnique({
                where: { userId: session.user.id },
            });
            if (!student || evaluation.studentId !== student.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        return NextResponse.json(evaluation);
    } catch (error) {
        console.error("Error fetching evaluation:", error);
        return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

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
        const validated = updateEvaluationSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validated.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const evaluation = await prisma.evaluation.findUnique({
            where: { id },
        });

        if (!evaluation) {
            return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
        }

        // Only the teacher who created the evaluation can update it
        if (evaluation.teacherId !== teacher.id && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const updatedEvaluation = await prisma.evaluation.update({
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

        return NextResponse.json(updatedEvaluation);
    } catch (error) {
        console.error("Error updating evaluation:", error);
        return NextResponse.json({ error: "Failed to update evaluation" }, { status: 500 });
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

        const evaluation = await prisma.evaluation.findUnique({
            where: { id },
        });

        if (!evaluation) {
            return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
        }

        // Check ownership for teachers
        if (session.user.role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: session.user.id },
            });
            if (!teacher || evaluation.teacherId !== teacher.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        await prisma.evaluation.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Evaluation deleted successfully" });
    } catch (error) {
        console.error("Error deleting evaluation:", error);
        return NextResponse.json({ error: "Failed to delete evaluation" }, { status: 500 });
    }
}
