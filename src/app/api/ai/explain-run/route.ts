import { z } from "zod";
import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { explainDecision } from "@/lib/groq";

const schema = z.object({ runId: z.string().uuid() });

/**
 * AI decision layer: "why did this version regress / which criterion is
 * driving failures" — grounded strictly in this run's actual scores, never
 * given free rein to speculate (see explainDecision's system prompt).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext("viewer");
    const { runId } = schema.parse(await request.json());

    const { data: run } = await ctx.supabase
      .from("eval_run_summary")
      .select("*")
      .eq("org_id", ctx.orgId)
      .eq("run_id", runId)
      .single();
    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    const { data: results } = await ctx.supabase
      .from("eval_case_results")
      .select("score, verdict, rationale, rubrics(name)")
      .eq("run_id", runId);

    const byRubric = new Map<string, { scores: number[]; blocks: number; total: number }>();
    for (const row of results ?? []) {
      const rubric = Array.isArray(row.rubrics) ? row.rubrics[0] : row.rubrics;
      const name = rubric?.name ?? "Unknown";
      const entry = byRubric.get(name) ?? { scores: [], blocks: 0, total: 0 };
      entry.total += 1;
      if (row.score !== null) entry.scores.push(row.score);
      if (row.verdict === "block") entry.blocks += 1;
      byRubric.set(name, entry);
    }

    const evidenceSummary = [
      `Overall: ${run.pass_count} pass, ${run.watch_count} watch, ${run.block_count} block out of ${run.total_cases} cases. Average score ${run.avg_score?.toFixed(2) ?? "n/a"}.`,
      ...Array.from(byRubric.entries()).map(([name, e]) => {
        const avg = e.scores.length ? e.scores.reduce((a, b) => a + b, 0) / e.scores.length : null;
        return `Criterion "${name}": ${e.blocks}/${e.total} blocked, average score ${avg?.toFixed(2) ?? "n/a"}.`;
      }),
    ].join("\n");

    const answer = await explainDecision({
      question: "Why did this eval run get blocked, and which criterion is driving the failures?",
      evidenceSummary,
    });

    return Response.json({ answer });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
