import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phone: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
    role: z.enum(["PARENT", "STUDENT", "TEACHER"]).default("STUDENT"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    image: z.string().url().optional(),
    locale: z.enum(["fr", "ar"]).optional(),
    phone: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    isActive: z.boolean().optional(),
    role: z.enum(["PARENT", "STUDENT", "TEACHER"]).optional(),
    bio: z.string().optional(),
    specialization: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
