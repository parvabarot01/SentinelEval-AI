import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { createProjectVersionSchema } from "@/lib/validation/projects";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const ctx = await requireOrgContext("engineer");
    const body = createProjectVersionSchema.parse(await request.json());

    // a new version becomes "current" for its environment; demote the prior one
    await ctx.supabase
      .from("project_versions")
      .update({ is_current_for_env: false })
      .eq("project_id", projectId)
      .eq("environment", body.environment);

    const { data, error } = await ctx.supabase
      .from("project_versions")
      .insert({
        project_id: projectId,
        org_id: ctx.orgId,
        version_label: body.versionLabel,
        environment: body.environment,
        system_prompt: body.systemPrompt,
        model: body.model,
        temperature: body.temperature,
        config: body.config ?? {},
        is_current_for_env: true,
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) throw error;

    await recordAudit(ctx, {
      action: "project_version.created",
      entityType: "project_version",
      entityId: data.id,
      after: data,
    });

    return Response.json({ version: data }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
