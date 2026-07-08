import { requireOrgContext, orgContextErrorResponse, OrgContextError } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { detectRegression } from "@/lib/stats";
import { createPromotionSchema } from "@/lib/validation/promotions";
import type { EvalRunSummary } from "@/lib/types";

export async function GET() {
  try {
    const ctx = await requireOrgContext("viewer");
    const { data, error } = await ctx.supabase
      .from("promotions")
      .select("*")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ promotions: data });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext("engineer");
    const body = createPromotionSchema.parse(await request.json());

    const { data: toVersion, error: toVersionError } = await ctx.supabase
      .from("project_versions")
      .select("id, project_id")
      .eq("id", body.toVersionId)
      .eq("org_id", ctx.orgId)
      .single();
    if (toVersionError || !toVersion) {
      throw new OrgContextError(404, "Candidate version not found");
    }

    const { data: currentVersion } = await ctx.supabase
      .from("project_versions")
      .select("id")
      .eq("project_id", body.projectId)
      .eq("environment", body.environment)
      .eq("is_current_for_env", true)
      .maybeSingle();

    const regressionSummary = currentVersion
      ? await compareVersions(ctx.supabase, currentVersion.id, body.toVersionId)
      : { suites: [], hasRegression: false, note: "No prior version deployed to this environment — nothing to compare against." };

    const status = regressionSummary.hasRegression ? "auto_blocked" : "pending";

    const { data: promotion, error } = await ctx.supabase
      .from("promotions")
      .insert({
        org_id: ctx.orgId,
        project_id: body.projectId,
        from_version_id: currentVersion?.id ?? null,
        to_version_id: body.toVersionId,
        environment: body.environment,
        status,
        regression_summary: regressionSummary,
        requested_by: ctx.userId,
      })
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "promotion.requested",
      entityType: "promotion",
      entityId: promotion.id,
      after: promotion,
    });

    return Response.json({ promotion }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}

async function compareVersions(
  supabase: Awaited<ReturnType<typeof import("@/lib/auth/org-context").requireOrgContext>>["supabase"],
  baselineVersionId: string,
  candidateVersionId: string,
) {
  const { data: candidateRuns } = await supabase
    .from("eval_run_summary")
    .select("*")
    .eq("project_version_id", candidateVersionId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .returns<EvalRunSummary[]>();

  const suiteIds = Array.from(new Set((candidateRuns ?? []).map((r) => r.suite_id)));
  const suites: Array<{
    suiteId: string;
    baseline: { passes: number; total: number } | null;
    candidate: { passes: number; total: number };
    delta: number;
    isRegression: boolean;
    pValue: number;
  }> = [];

  let hasRegression = false;

  for (const suiteId of suiteIds) {
    const candidate = (candidateRuns ?? []).find((r) => r.suite_id === suiteId)!;

    const { data: baselineRuns } = await supabase
      .from("eval_run_summary")
      .select("*")
      .eq("project_version_id", baselineVersionId)
      .eq("suite_id", suiteId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<EvalRunSummary[]>();

    const baseline = baselineRuns?.[0];

    const check = detectRegression(
      { passes: baseline?.pass_count ?? 0, total: baseline?.total_cases ?? 0 },
      { passes: candidate.pass_count, total: candidate.total_cases },
    );

    if (check.isRegression) hasRegression = true;

    suites.push({
      suiteId,
      baseline: baseline ? { passes: baseline.pass_count, total: baseline.total_cases } : null,
      candidate: { passes: candidate.pass_count, total: candidate.total_cases },
      delta: check.delta,
      isRegression: check.isRegression,
      pValue: check.pValue,
    });
  }

  return { suites, hasRegression };
}
