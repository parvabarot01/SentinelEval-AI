import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
});

export const createProjectVersionSchema = z.object({
  versionLabel: z.string().min(1).max(40),
  environment: z.enum(["dev", "staging", "prod"]),
  systemPrompt: z.string().max(20000),
  model: z.string().min(1).max(120).default("llama-3.3-70b-versatile"),
  temperature: z.number().min(0).max(2).default(0.2),
  config: z.record(z.string(), z.unknown()).optional(),
});
