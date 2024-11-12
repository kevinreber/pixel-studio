import { z } from "zod";

export const CommentSchema = z.object({
  imageId: z.string().min(1, "Image ID is required"),
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters")
    .transform((str) => str.trim()),
});

export type CommentFormData = z.infer<typeof CommentSchema>;

export const CommentResponseSchema = z.object({
  success: z.boolean(),
  comment: z
    .object({
      id: z.string(),
      message: z.string(),
      createdAt: z.date(),
      user: z.object({
        id: z.string(),
        username: z.string(),
        image: z.string().nullable(),
      }),
    })
    .optional(),
  error: z.string().optional(),
});

export type CommentResponse = z.infer<typeof CommentResponseSchema>;
