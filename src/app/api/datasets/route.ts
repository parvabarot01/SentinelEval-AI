import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { createDatasetSchema } from "@/lib/validation/datasets";

export async function GET() {
  try {
    const ctx = await requireOrgContext("viewer");
    const { data, error } = await ctx.supabase
      .from("eval_datasets")
      .select("*")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ datasets: data });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext("engineer");
    const body = createDatasetSchema.parse(await request.json());

    const { data: dataset, error } = await ctx.supabase
      .from("eval_datasets")
      .insert({
        org_id: ctx.orgId,
        project_id: body.projectId ?? null,
        name: body.name,
        description: body.description ?? null,
        tags: body.tags ?? [],
        created_by: ctx.userId,
      })
      .select()
      .single();
    if (error) throw error;

    const { data: version, error: versionError } = await ctx.supabase
      .from("dataset_versions")
      .insert({
        dataset_id: dataset.id,
        org_id: ctx.orgId,
        version_number: 1,
        note: "Initial version",
        created_by: ctx.userId,
      })
      .select()
      .single();
    if (versionError) throw versionError;

    await recordAudit(ctx, {
      action: "dataset.created",
      entityType: "eval_dataset",
      entityId: dataset.id,
      after: dataset,
    });

    return Response.json({ dataset, version }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
