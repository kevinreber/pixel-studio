import { z } from "zod";

export const VideoCommentSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters")
    .transform((str) => str.trim()),
});

export type VideoCommentFormData = z.infer<typeof VideoCommentSchema>;

export const VideoCommentResponseSchema = z.object({
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

export type VideoCommentResponse = z.infer<typeof VideoCommentResponseSchema>;
