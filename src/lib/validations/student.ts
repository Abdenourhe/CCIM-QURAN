import { z } from "zod";

export const createStudentSchema = z.object({
    userId: z.string().cuid(),
    dateOfBirth: z.coerce.date().optional(),
    groupId: z.string().cuid().optional(),
    parentIds: z.array(z.string().cuid()).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
