import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { createTestCaseSchema } from "@/lib/validation/datasets";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: datasetId } = await params;
    const ctx = await requireOrgContext("engineer");
    const body = createTestCaseSchema.parse(await request.json());

    const { data, error } = await ctx.supabase
      .from("test_cases")
      .insert({
        dataset_id: datasetId,
        dataset_version_id: body.datasetVersionId,
        org_id: ctx.orgId,
        input: body.input,
        expected_output: body.expectedOutput ?? null,
        reference: body.reference ?? null,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "test_case.created",
      entityType: "test_case",
      entityId: data.id,
      after: data,
    });

    return Response.json({ testCase: data }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
