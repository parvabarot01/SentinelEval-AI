import { z } from "zod";

export const createSuiteSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid().optional(),
});

export const createRubricSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  criterionType: z.enum(["llm_judge", "programmatic", "human"]),
  programmaticKind: z.enum(["json_schema", "regex", "keyword", "groundedness", "pii"]).optional(),
  weight: z.number().min(0).max(10).default(1),
  config: z.record(z.string(), z.unknown()).optional(),
});
