import { z } from "zod";

// Legacy schema for backward compatibility
export const createEvaluationSchema = z.object({
    studentId: z.string().cuid(),
    surahNumber: z.number().int().min(1).max(114),
    verseFrom: z.number().int().min(1),
    verseTo: z.number().int().min(1),
    grade: z.enum(["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"]),
    tajweed: z.number().int().min(0).max(100),
    fluency: z.number().int().min(0).max(100),
    makharij: z.number().int().min(0).max(100),
    notes: z.string().max(1000).optional(),
});

export const updateEvaluationSchema = createEvaluationSchema.partial();

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type LegacyUpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;

// New comprehensive evaluation schema for teacher dashboard
export const evaluationInputSchema = z.object({
    studentId: z.string().uuid("Invalid student ID"),
    progressId: z.string().uuid("Invalid progress ID").optional(),
    surahNumber: z.number().int().min(1).max(114).optional(),
    verseFrom: z.number().int().min(1).optional(),
    verseTo: z.number().int().min(1).optional(),
    memorizationScore: z.number().min(0).max(100, "Score must be between 0 and 100"),
    tajweedScore: z.number().min(0).max(100, "Score must be between 0 and 100"),
    fluencyScore: z.number().min(0).max(100, "Score must be between 0 and 100"),
    makharijScore: z.number().min(0).max(100, "Score must be between 0 and 100").optional(),
    tafsirUnderstanding: z.number().min(0).max(100, "Score must be between 0 and 100").optional(),
    teacherNotes: z.string().max(2000).optional(),
    strengths: z.array(z.string()).default([]),
    improvements: z.array(z.string()).default([]),
    revisionRequired: z.boolean().default(false),
    decision: z.enum(["approved", "needs_revision", "rejected"]),
});

// Type for evaluation input with calculated final score
export type EvaluationInput = z.infer<typeof evaluationInputSchema> & {
    finalScore?: number;
};

// Function to calculate final score from evaluation input
export function calculateFinalScore(data: EvaluationInput): number {
    const scores = [
        data.memorizationScore,
        data.tajweedScore,
        data.fluencyScore,
    ];

    if (data.makharijScore !== undefined && data.makharijScore !== null) {
        scores.push(data.makharijScore);
    }

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Common strength tags
export const STRENGTH_TAGS = [
    "excellent_memorization",
    "proper_tajweed",
    "beautiful_voice",
    "good_fluency",
    "clear_pronunciation",
    "excellent_recitation",
    "good_concentration",
    "memorized_well",
    "confident_recitation",
    "accurate_makharij",
];

// Common improvement tags
export const IMPROVEMENT_TAGS = [
    "needs_more_practice",
    "tajweed_errors",
    "pronunciation_issues",
    "fluency_needs_work",
    "memorization_gaps",
    "speed_issues",
    "makharij_needs_improvement",
    "confidence_building",
    "concentration_needed",
    "review_required",
];

export const updateEvaluationInputSchema = evaluationInputSchema.partial();

export type UpdateEvaluationInput = z.infer<typeof updateEvaluationInputSchema>;
