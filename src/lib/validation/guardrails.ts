import { z } from "zod";

export const guardrailCheckConfigSchema = z.object({
  kind: z.enum(["json_schema", "regex", "keyword", "groundedness", "pii"]),
  threshold: z.number().min(0).max(1).optional(),
  pattern: z.string().max(500).optional(),
  keywords: z.array(z.string().min(1).max(100)).max(50).optional(),
});

export const createGuardrailPolicySchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2).max(120),
  checks: z.array(guardrailCheckConfigSchema).min(1),
});

export const guardrailCheckRequestSchema = z.object({
  projectId: z.string().uuid(),
  direction: z.enum(["pre", "post"]),
  text: z.string().min(1).max(20000),
  reference: z.string().max(20000).optional(),
});
