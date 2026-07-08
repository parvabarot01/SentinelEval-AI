import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/api-keys";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkGuardrailText } from "@/lib/groq";
import { guardrailCheckRequestSchema } from "@/lib/validation/guardrails";
import type { GuardrailCheckConfig, GuardrailDecision } from "@/lib/types";

/**
 * Inline pre/post-response guardrail check — called by the customer's own
 * backend around their LLM feature, not from a browser. Authenticated with
 * an org API key (see /settings/api-keys), not a Supabase session, so it
 * runs on the service-role client. This and eval-run creation are the two
 * highest-traffic, load-bearing routes (project plan §3), hence the rate limit.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!apiKey) {
    return Response.json({ error: "Missing API key" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const keyHash = hashApiKey(apiKey);

  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("id, org_id, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!keyRow || keyRow.revoked_at) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { success } = await checkRateLimit("guardrail-check", keyRow.id, 60, 60);
  if (!success) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const parsed = guardrailCheckRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  const body = parsed.data;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", body.projectId)
    .eq("org_id", keyRow.org_id)
    .maybeSingle();
  if (!project) {
    return Response.json({ error: "Project not found for this API key's organization" }, { status: 404 });
  }

  const { data: policies } = await supabase
    .from("guardrail_policies")
    .select("*")
    .eq("project_id", body.projectId)
    .eq("is_active", true);

  const failingChecks: Array<{ kind: string; reason: string }> = [];
  let hasBlockingFailure = false;
  let hasFlaggingFailure = false;

  for (const policy of policies ?? []) {
    for (const check of policy.checks as GuardrailCheckConfig[]) {
      if (check.kind === "json_schema") continue; // schema validation applies to structured feature output, evaluated at eval-run time, not the guardrail webhook

      const result = await checkGuardrailText({
        text: body.text,
        checkKind: check.kind,
        reference: body.reference,
        config: check as unknown as Record<string, unknown>,
      });

      if (result.triggered) {
        failingChecks.push({ kind: check.kind, reason: result.reason });
        if (check.kind === "groundedness") {
          hasFlaggingFailure = true;
        } else {
          hasBlockingFailure = true;
        }
      }
    }
  }

  const decision: GuardrailDecision = hasBlockingFailure ? "block" : hasFlaggingFailure ? "flag" : "allow";

  await supabase.from("guardrail_logs").insert({
    org_id: keyRow.org_id,
    project_id: body.projectId,
    policy_id: policies?.[0]?.id ?? null,
    direction: body.direction,
    input: body.direction === "pre" ? body.text : null,
    output: body.direction === "post" ? body.text : null,
    decision,
    failing_checks: failingChecks,
  });

  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);

  return Response.json({ decision, failingChecks });
}
