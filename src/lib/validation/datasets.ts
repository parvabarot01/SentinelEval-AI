import { z } from "zod";

export const createDatasetSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
});

export const createDatasetVersionSchema = z.object({
  note: z.string().max(500).optional(),
  copyFromVersionId: z.string().uuid().optional(),
});

export const createTestCaseSchema = z.object({
  datasetVersionId: z.string().uuid(),
  input: z.string().min(1).max(20000),
  expectedOutput: z.string().max(20000).optional(),
  reference: z.string().max(20000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
