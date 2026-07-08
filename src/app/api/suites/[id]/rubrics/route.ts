import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { createRubricSchema } from "@/lib/validation/suites";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: suiteId } = await params;
    const ctx = await requireOrgContext("engineer");
    const body = createRubricSchema.parse(await request.json());

    const { data, error } = await ctx.supabase
      .from("rubrics")
      .insert({
        suite_id: suiteId,
        org_id: ctx.orgId,
        name: body.name,
        description: body.description ?? null,
        criterion_type: body.criterionType,
        programmatic_kind: body.programmaticKind ?? null,
        weight: body.weight,
        config: body.config ?? {},
      })
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "rubric.created",
      entityType: "rubric",
      entityId: data.id,
      after: data,
    });

    return Response.json({ rubric: data }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
