import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { createSuiteSchema } from "@/lib/validation/suites";

export async function GET() {
  try {
    const ctx = await requireOrgContext("viewer");
    const { data, error } = await ctx.supabase
      .from("eval_suites")
      .select("*")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ suites: data });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext("engineer");
    const body = createSuiteSchema.parse(await request.json());

    const { data, error } = await ctx.supabase
      .from("eval_suites")
      .insert({
        org_id: ctx.orgId,
        project_id: body.projectId ?? null,
        name: body.name,
        description: body.description ?? null,
        created_by: ctx.userId,
      })
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "suite.created",
      entityType: "eval_suite",
      entityId: data.id,
      after: data,
    });

    return Response.json({ suite: data }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
