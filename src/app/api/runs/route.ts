import { requireOrgContext, orgContextErrorResponse, OrgContextError } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { enqueueEvalRun } from "@/lib/qstash";
import { createRunSchema } from "@/lib/validation/runs";

export async function GET() {
  try {
    const ctx = await requireOrgContext("viewer");
    const { data, error } = await ctx.supabase
      .from("eval_runs")
      .select("*")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ runs: data });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext("engineer");

    // eval-run creation is one of the two highest-traffic, load-bearing
    // routes (project plan §3) — 20 runs/minute per org is generous for
    // interactive use while still bounding worst-case Groq spend.
    const { success } = await checkRateLimit("eval-run-create", ctx.orgId, 20, 60);
    if (!success) {
      return Response.json({ error: "Rate limit exceeded — try again shortly" }, { status: 429 });
    }

    const body = createRunSchema.parse(await request.json());

    const { data: projectVersion, error: versionError } = await ctx.supabase
      .from("project_versions")
      .select("id, project_id")
      .eq("id", body.projectVersionId)
      .eq("org_id", ctx.orgId)
      .single();
    if (versionError || !projectVersion) {
      throw new OrgContextError(404, "Project version not found");
    }

    const { data: run, error } = await ctx.supabase
      .from("eval_runs")
      .insert({
        org_id: ctx.orgId,
        project_id: projectVersion.project_id,
        project_version_id: body.projectVersionId,
        suite_id: body.suiteId,
        dataset_version_id: body.datasetVersionId,
        status: "queued",
        triggered_by: ctx.userId,
      })
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "run.created",
      entityType: "eval_run",
      entityId: run.id,
      after: run,
    });

    await enqueueEvalRun(run.id);

    return Response.json({ run }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
