import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "L'email est requis" },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Always return success to prevent email enumeration
        // In production, you would send an actual email here
        if (user) {
            // Create a reset token (valid for 1 hour)
            const resetToken = crypto.randomBytes(32).toString("hex");
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Store the token in the database
            await prisma.verificationToken.create({
                data: {
                    identifier: email,
                    token: resetToken,
                    expires,
                },
            });

            // In production, send this token via email
            // For now, we'll just log it
            console.log(`Password reset token for ${email}: ${resetToken}`);
            
            // Note: In a real application, you would integrate with an email service
            // like SendGrid, Resend, Nodemailer, etc.
        }

        return NextResponse.json(
            { message: "Si un compte existe avec cet email, un lien de réinitialisation sera envoyé." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue" },
            { status: 500 }
        );
    }
}
