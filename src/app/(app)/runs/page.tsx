import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { LinkButton } from "@/components/ui/Button";
import { RailCard } from "@/components/ui/Rail";
import { VerdictChip, verdictBorderClass } from "@/components/ui/VerdictChip";
import { timeAgo, verdictFromScore } from "@/lib/utils";
import type { EvalRunSummary } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

export default async function RunsPage() {
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("eval_run_summary")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .order("created_at", { ascending: false })
    .returns<EvalRunSummary[]>();

  const list = runs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-signal-white">Runs</h1>
          <p className="mt-1 text-sm text-signal-muted">Every suite execution against a feature version.</p>
        </div>
        <LinkButton href="/runs/new">Run a suite</LinkButton>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-12 text-center text-sm text-signal-muted">
          No runs yet. Run a suite against a feature version to see scores here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((run) => {
            const verdict =
              run.status === "completed" && run.avg_score !== null
                ? verdictFromScore(run.avg_score)
                : "pending";
            return (
              <RailCard
                key={run.run_id}
                href={`/runs/${run.run_id}`}
                accentClassName={verdictBorderClass(verdict)}
                className="w-full"
              >
                <div className="flex items-center justify-between">
                  <VerdictChip verdict={verdict} label={run.status === "completed" ? undefined : STATUS_LABEL[run.status]} />
                  {run.avg_score !== null && (
                    <span className="font-mono text-lg text-signal-white">{run.avg_score.toFixed(2)}</span>
                  )}
                </div>
                <div className="mt-3 text-[11px] text-signal-muted">
                  {run.total_cases} case{run.total_cases === 1 ? "" : "s"} · {run.pass_count} pass · {run.block_count} block
                </div>
                <div className="mt-2 text-[11px] text-signal-muted">Started {timeAgo(run.created_at)}</div>
              </RailCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
