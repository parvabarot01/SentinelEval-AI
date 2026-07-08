import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { CreatePolicyForm } from "./CreatePolicyForm";
import { VerdictChip } from "@/components/ui/VerdictChip";
import { LinkButton } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";
import type { Verdict } from "@/lib/utils";
import type { GuardrailDecision } from "@/lib/types";

interface PolicyRow {
  id: string;
  name: string;
  is_active: boolean;
  checks: Array<{ kind: string }>;
  projects: { name: string } | null;
}

interface LogRow {
  id: string;
  direction: string;
  decision: GuardrailDecision;
  failing_checks: Array<{ kind: string; reason: string }>;
  created_at: string;
  projects: { name: string } | null;
}

const DECISION_VERDICT: Record<GuardrailDecision, Verdict> = {
  allow: "pass",
  flag: "watch",
  block: "block",
};

export default async function GuardrailsPage() {
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: policies } = await supabase
    .from("guardrail_policies")
    .select("id, name, is_active, checks, projects(name)")
    .eq("org_id", orgContext!.current!.orgId)
    .order("created_at", { ascending: false })
    .returns<PolicyRow[]>();

  const { data: logs } = await supabase
    .from("guardrail_logs")
    .select("id, direction, decision, failing_checks, created_at, projects(name)")
    .eq("org_id", orgContext!.current!.orgId)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<LogRow[]>();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-signal-white">Guardrails</h1>
          <p className="mt-1 text-sm text-signal-muted">
            Inline pre/post-response checks your backend calls before serving an LLM response.
          </p>
        </div>
        <LinkButton href="/settings/api-keys" variant="secondary">
          API keys
        </LinkButton>
      </div>

      <CreatePolicyForm />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-signal-muted">Policies ({(policies ?? []).length})</h2>
        {(policies ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-8 text-center text-sm text-signal-muted">
            No policies yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(policies ?? []).map((policy) => (
              <li key={policy.id} className="rounded-lg border-t-2 border-t-judge bg-surface-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-signal-white">{policy.name}</span>
                  <span className="text-xs text-signal-muted">{policy.projects?.name}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {policy.checks.map((c, i) => (
                    <span key={i} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-signal-muted">
                      {c.kind}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-signal-muted">Recent activity</h2>
        {(logs ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-8 text-center text-sm text-signal-muted">
            No guardrail checks logged yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {(logs ?? []).map((log) => (
              <li key={log.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-card p-3">
                <div className="flex items-center gap-3">
                  <VerdictChip verdict={DECISION_VERDICT[log.decision]} label={log.decision} />
                  <span className="text-xs text-signal-muted">
                    {log.projects?.name} · {log.direction}
                  </span>
                </div>
                <span className="text-[11px] text-signal-muted">{timeAgo(log.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
