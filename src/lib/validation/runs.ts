import { z } from "zod";

export const createRunSchema = z.object({
  projectVersionId: z.string().uuid(),
  suiteId: z.string().uuid(),
  datasetVersionId: z.string().uuid(),
});
