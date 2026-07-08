import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { createDatasetVersionSchema } from "@/lib/validation/datasets";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: datasetId } = await params;
    const ctx = await requireOrgContext("engineer");
    const body = createDatasetVersionSchema.parse(await request.json());

    const { data: latest } = await ctx.supabase
      .from("dataset_versions")
      .select("version_number")
      .eq("dataset_id", datasetId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber = (latest?.version_number ?? 0) + 1;

    const { data: version, error } = await ctx.supabase
      .from("dataset_versions")
      .insert({
        dataset_id: datasetId,
        org_id: ctx.orgId,
        version_number: nextVersionNumber,
        note: body.note ?? null,
        created_by: ctx.userId,
      })
      .select()
      .single();
    if (error) throw error;

    if (body.copyFromVersionId) {
      const { data: priorCases } = await ctx.supabase
        .from("test_cases")
        .select("input, expected_output, reference, metadata")
        .eq("dataset_version_id", body.copyFromVersionId);

      if (priorCases && priorCases.length > 0) {
        await ctx.supabase.from("test_cases").insert(
          priorCases.map((c) => ({
            dataset_id: datasetId,
            dataset_version_id: version.id,
            org_id: ctx.orgId,
            input: c.input,
            expected_output: c.expected_output,
            reference: c.reference,
            metadata: c.metadata,
          })),
        );
      }
    }

    await recordAudit(ctx, {
      action: "dataset_version.created",
      entityType: "dataset_version",
      entityId: version.id,
      after: version,
    });

    return Response.json({ version }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
