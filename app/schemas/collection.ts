import { z } from "zod";

export const CollectionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(50, "Title must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
});

export type CollectionFormData = z.infer<typeof CollectionSchema>;
