import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/user";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validated = registerSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.errors[0].message },
                { status: 400 }
            );
        }

        const { name, email, phone, gender, password, role } = validated.data;

        console.log("[Register] Attempting to create user:", { name, email, phone, gender, role });

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Cet email est déjà utilisé" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with role
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                gender,
                role: role || "STUDENT",
            },
        });
        console.log("[Register] User created successfully:", user.id);

        // Create role-specific profile
        if (role === "STUDENT") {
            await prisma.student.create({
                data: {
                    userId: user.id,
                },
            });
        } else if (role === "PARENT") {
            await prisma.parent.create({
                data: {
                    userId: user.id,
                },
            });
        } else if (role === "TEACHER") {
            await prisma.teacher.create({
                data: {
                    userId: user.id,
                },
            });
        }

        return NextResponse.json(
            { message: "Compte créé avec succès", userId: user.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("[Register] Full error details:", error);
        if (error instanceof Error) {
            console.error("[Register] Error name:", error.name);
            console.error("[Register] Error message:", error.message);
            console.error("[Register] Error stack:", error.stack);
        }
        return NextResponse.json(
            { error: "Une erreur est survenue lors de l'inscription" },
            { status: 500 }
        );
    }
}
