import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { RequestPromotionForm } from "./RequestPromotionForm";
import { PromotionActions } from "./PromotionActions";
import { VerdictChip } from "@/components/ui/VerdictChip";
import { timeAgo } from "@/lib/utils";
import type { Verdict } from "@/lib/utils";
import type { Promotion, Project, ProjectVersion } from "@/lib/types";

const STATUS_VERDICT: Record<Promotion["status"], Verdict> = {
  pending: "watch",
  approved: "pass",
  rejected: "block",
  auto_blocked: "block",
};

const STATUS_LABEL: Record<Promotion["status"], string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  auto_blocked: "Auto-blocked — regression detected",
};

export default async function GovernancePage() {
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();
  const canDecide = orgContext!.current!.role === "owner" || orgContext!.current!.role === "admin";

  const { data: promotions } = await supabase
    .from("promotions")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .order("created_at", { ascending: false })
    .returns<Promotion[]>();

  const list = promotions ?? [];

  const projectIds = Array.from(new Set(list.map((p) => p.project_id)));
  const versionIds = Array.from(new Set(list.flatMap((p) => [p.from_version_id, p.to_version_id]).filter(Boolean) as string[]));

  const [{ data: projects }, { data: versions }] = await Promise.all([
    projectIds.length
      ? supabase.from("projects").select("*").in("id", projectIds).returns<Project[]>()
      : Promise.resolve({ data: [] as Project[] }),
    versionIds.length
      ? supabase.from("project_versions").select("*").in("id", versionIds).returns<ProjectVersion[]>()
      : Promise.resolve({ data: [] as ProjectVersion[] }),
  ]);

  const projectById = new Map((projects ?? []).map((p) => [p.id, p]));
  const versionById = new Map((versions ?? []).map((v) => [v.id, v]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-medium text-signal-white">Governance</h1>
        <p className="mt-1 text-sm text-signal-muted">
          Every promotion is checked against prior scores before it can go live — regressions auto-block.
        </p>
      </div>

      <RequestPromotionForm />

      <div className="flex flex-col gap-3">
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-12 text-center text-sm text-signal-muted">
            No promotion requests yet.
          </div>
        ) : (
          list.map((promo) => {
            const project = projectById.get(promo.project_id);
            const toVersion = versionById.get(promo.to_version_id);
            const fromVersion = promo.from_version_id ? versionById.get(promo.from_version_id) : null;
            const summary = promo.regression_summary as { suites?: Array<{ suiteId: string; delta: number; isRegression: boolean }> };

            return (
              <div key={promo.id} className="rounded-lg border-t-2 border-t-judge bg-surface-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-medium text-signal-white">
                      {project?.name} → {promo.environment}
                    </div>
                    <div className="mt-1 font-mono text-xs text-signal-muted">
                      {fromVersion?.version_label ?? "none"} → {toVersion?.version_label}
                    </div>
                  </div>
                  <VerdictChip verdict={STATUS_VERDICT[promo.status]} label={STATUS_LABEL[promo.status]} />
                </div>

                {summary?.suites && summary.suites.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1">
                    {summary.suites.map((s) => (
                      <li key={s.suiteId} className="font-mono text-xs text-signal-muted">
                        suite {s.suiteId.slice(0, 8)} · delta {(s.delta * 100).toFixed(1)}pp
                        {s.isRegression && <span className="ml-2 text-block">regression</span>}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-signal-muted">Requested {timeAgo(promo.created_at)}</span>
                  {canDecide && (promo.status === "pending" || promo.status === "auto_blocked") && (
                    <PromotionActions promotionId={promo.id} />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
