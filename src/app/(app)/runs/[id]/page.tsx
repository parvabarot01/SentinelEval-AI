import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { VerdictChip, verdictTextClass } from "@/components/ui/VerdictChip";
import { VerdictGauge } from "@/components/ui/VerdictGauge";
import { verdictFromScore, timeAgo } from "@/lib/utils";
import { ExplainRegressionButton } from "./ExplainButton";
import type { EvalRunSummary, CaseVerdict } from "@/lib/types";

interface CaseResultRow {
  id: string;
  method: string;
  score: number | null;
  verdict: CaseVerdict;
  rationale: string | null;
  test_cases: { input: string; expected_output: string | null } | null;
  rubrics: { name: string; criterion_type: string } | null;
}

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("eval_run_summary")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .eq("run_id", id)
    .single<EvalRunSummary>();

  if (!run) notFound();

  const { data: results } = await supabase
    .from("eval_case_results")
    .select("id, method, score, verdict, rationale, test_cases(input, expected_output), rubrics(name, criterion_type)")
    .eq("run_id", id)
    .order("created_at", { ascending: true })
    .returns<CaseResultRow[]>();

  const list = results ?? [];
  const overallVerdict = run.avg_score !== null ? verdictFromScore(run.avg_score) : "pending";

  // group by rubric name for the per-criterion breakdown
  const byRubric = new Map<string, CaseResultRow[]>();
  for (const row of list) {
    const key = row.rubrics?.name ?? "Unknown criterion";
    byRubric.set(key, [...(byRubric.get(key) ?? []), row]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <VerdictChip verdict={overallVerdict} />
            <span className="text-xs text-signal-muted">
              {run.status} · started {timeAgo(run.created_at)}
            </span>
          </div>
          <h1 className="font-display text-2xl font-medium text-signal-white">Run results</h1>
        </div>
        {overallVerdict === "block" && <ExplainRegressionButton runId={id} />}
      </div>

      {run.avg_score !== null && (
        <div className="max-w-md rounded-lg border border-white/5 bg-surface-card p-4">
          <VerdictGauge score={run.avg_score} label="Overall score" />
          <div className="mt-3 text-xs text-signal-muted">
            {run.pass_count} pass · {run.watch_count} watch · {run.block_count} block · {run.pending_count} pending review
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {Array.from(byRubric.entries()).map(([rubricName, rows]) => (
          <div key={rubricName} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-signal-white">{rubricName}</h2>
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {rows.map((row) => (
                <li key={row.id} className="rounded-lg border-t-2 border-t-judge bg-surface-card p-4">
                  <div className="flex items-center justify-between">
                    <VerdictChip verdict={row.verdict} />
                    {row.score !== null && (
                      <span className={`font-mono text-sm ${verdictTextClass(row.verdict)}`}>{row.score.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-wide text-signal-muted">Input</div>
                  <p className="mt-1 line-clamp-3 text-sm text-signal-white">{row.test_cases?.input}</p>
                  {row.rationale && (
                    <>
                      <div className="mt-3 text-xs uppercase tracking-wide text-judge">Judge rationale</div>
                      <p className="mt-1 text-xs text-signal-muted">{row.rationale}</p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {list.length === 0 && (
          <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-8 text-center text-sm text-signal-muted">
            {run.status === "queued" || run.status === "running"
              ? "Run in progress — results will appear here as each case completes."
              : "No results recorded for this run."}
          </div>
        )}
      </div>
    </div>
  );
}
