import { z } from "zod";

export const createPromotionSchema = z.object({
  projectId: z.string().uuid(),
  toVersionId: z.string().uuid(),
  environment: z.enum(["dev", "staging", "prod"]),
});

export const decidePromotionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});
