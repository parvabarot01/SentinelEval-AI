import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { AddRubricForm } from "./AddRubricForm";
import { LinkButton } from "@/components/ui/Button";
import { TrendLine } from "@/components/ui/TrendLine";
import type { EvalSuite, Rubric, EvalRunSummary } from "@/lib/types";

const CRITERION_LABEL: Record<Rubric["criterion_type"], string> = {
  llm_judge: "LLM judge",
  programmatic: "Programmatic",
  human: "Human review",
};

export default async function SuiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: suite } = await supabase
    .from("eval_suites")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .eq("id", id)
    .single<EvalSuite>();

  if (!suite) notFound();

  const { data: rubrics } = await supabase
    .from("rubrics")
    .select("*")
    .eq("suite_id", id)
    .order("created_at", { ascending: true })
    .returns<Rubric[]>();

  const list = rubrics ?? [];

  const { data: runHistory } = await supabase
    .from("eval_run_summary")
    .select("*")
    .eq("suite_id", id)
    .eq("status", "completed")
    .not("avg_score", "is", null)
    .order("created_at", { ascending: true })
    .returns<EvalRunSummary[]>();

  const trendPoints = (runHistory ?? []).map((run) => ({
    score: run.avg_score!,
    label: new Date(run.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-signal-white">{suite.name}</h1>
          <p className="mt-1 text-sm text-signal-muted">{suite.description || "No description yet."}</p>
        </div>
        {list.length > 0 && <LinkButton href={`/runs/new?suite=${suite.id}`}>Run this suite</LinkButton>}
      </div>

      {trendPoints.length > 1 && (
        <div className="rounded-lg border border-white/5 bg-surface-card p-4">
          <h2 className="mb-2 text-sm font-medium text-signal-muted">Score trend across runs</h2>
          <TrendLine points={trendPoints} />
        </div>
      )}

      <AddRubricForm suiteId={id} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-signal-muted">Criteria ({list.length})</h2>
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-8 text-center text-sm text-signal-muted">
            No criteria yet. Add one above to define what &quot;pass&quot; means for this suite.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {list.map((rubric) => (
              <li key={rubric.id} className="rounded-lg border-t-2 border-t-judge bg-surface-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-signal-white">{rubric.name}</span>
                  <span className="rounded-full bg-judge/15 px-2 py-0.5 text-[10px] font-medium text-judge">
                    {CRITERION_LABEL[rubric.criterion_type]}
                  </span>
                </div>
                {rubric.description && <p className="mt-1 text-xs text-signal-muted">{rubric.description}</p>}
                <div className="mt-3 font-mono text-[11px] text-signal-muted">
                  weight {rubric.weight}
                  {rubric.programmatic_kind && ` · ${rubric.programmatic_kind}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
