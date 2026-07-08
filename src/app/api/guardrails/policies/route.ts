import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { createGuardrailPolicySchema } from "@/lib/validation/guardrails";

export async function GET() {
  try {
    const ctx = await requireOrgContext("viewer");
    const { data, error } = await ctx.supabase
      .from("guardrail_policies")
      .select("*")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ policies: data });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext("engineer");
    const body = createGuardrailPolicySchema.parse(await request.json());

    const { data, error } = await ctx.supabase
      .from("guardrail_policies")
      .insert({
        org_id: ctx.orgId,
        project_id: body.projectId,
        name: body.name,
        checks: body.checks,
        created_by: ctx.userId,
      })
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "guardrail_policy.created",
      entityType: "guardrail_policy",
      entityId: data.id,
      after: data,
    });

    return Response.json({ policy: data }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
