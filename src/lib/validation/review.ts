import { z } from "zod";

export const completeReviewSchema = z.object({
  decision: z.enum(["accept", "edit", "reject"]),
  notes: z.string().max(2000).optional(),
  score: z.number().min(0).max(1).optional(),
});
