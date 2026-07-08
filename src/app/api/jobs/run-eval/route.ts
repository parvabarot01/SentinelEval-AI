import { Receiver } from "@upstash/qstash";
import { createAdminClient } from "@/lib/supabase/admin";
import { runFeatureUnderTest, judgeCase, checkGuardrailText } from "@/lib/groq";
import { verdictFromScore } from "@/lib/utils";
import type { EvalRun, ProjectVersion, Rubric, TestCase, CaseVerdict } from "@/lib/types";

/**
 * QStash-invoked worker: runs a suite against a feature version, one test
 * case at a time, scoring every rubric with its configured method. Runs with
 * the service-role client because this request carries no user session —
 * QStash calls back into our own API with a signed payload instead.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("upstash-signature");

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });

  if (!signature || !(await receiver.verify({ signature, body }).catch(() => false))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { runId } = JSON.parse(body) as { runId: string };
  const supabase = createAdminClient();

  const { data: run } = await supabase.from("eval_runs").select("*").eq("id", runId).single<EvalRun>();
  if (!run) return Response.json({ error: "Run not found" }, { status: 404 });

  await supabase.from("eval_runs").update({ status: "running" }).eq("id", runId);

  try {
    const [{ data: projectVersion }, { data: rubrics }, { data: testCases }] = await Promise.all([
      supabase.from("project_versions").select("*").eq("id", run.project_version_id).single<ProjectVersion>(),
      supabase.from("rubrics").select("*").eq("suite_id", run.suite_id).returns<Rubric[]>(),
      supabase.from("test_cases").select("*").eq("dataset_version_id", run.dataset_version_id).returns<TestCase[]>(),
    ]);

    if (!projectVersion || !rubrics || !testCases) {
      throw new Error("Missing project version, rubrics, or test cases for this run");
    }

    for (const testCase of testCases) {
      const output = await runFeatureUnderTest({
        systemPrompt: projectVersion.system_prompt,
        model: projectVersion.model,
        temperature: Number(projectVersion.temperature),
        input: testCase.input,
      });

      for (const rubric of rubrics) {
        await scoreCase(supabase, run, testCase, rubric, output);
      }
    }

    await supabase
      .from("eval_runs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", runId);
  } catch (err) {
    console.error(`eval run ${runId} failed`, err);
    await supabase.from("eval_runs").update({ status: "failed" }).eq("id", runId);
    return Response.json({ error: "Run failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

async function scoreCase(
  supabase: ReturnType<typeof createAdminClient>,
  run: EvalRun,
  testCase: TestCase,
  rubric: Rubric,
  output: string,
) {
  if (rubric.criterion_type === "llm_judge") {
    const verdict = await judgeCase({
      criterionName: rubric.name,
      criterionDescription: rubric.description ?? rubric.name,
      input: testCase.input,
      output,
      referenceOutput: testCase.expected_output ?? testCase.reference,
    });

    await supabase.from("eval_case_results").insert({
      run_id: run.id,
      org_id: run.org_id,
      test_case_id: testCase.id,
      rubric_id: rubric.id,
      method: "llm_judge",
      score: verdict.score,
      verdict: verdictFromScore(verdict.score) satisfies CaseVerdict,
      rationale: verdict.rationale,
      raw_output: output,
    });
    return;
  }

  if (rubric.criterion_type === "programmatic") {
    const { score, rationale } = await runProgrammaticCheck(rubric, testCase, output);
    await supabase.from("eval_case_results").insert({
      run_id: run.id,
      org_id: run.org_id,
      test_case_id: testCase.id,
      rubric_id: rubric.id,
      method: "programmatic",
      score,
      verdict: verdictFromScore(score) satisfies CaseVerdict,
      rationale,
      raw_output: output,
    });
    return;
  }

  // human: park the case pending a reviewer decision, no automated score yet
  const { data: result } = await supabase
    .from("eval_case_results")
    .insert({
      run_id: run.id,
      org_id: run.org_id,
      test_case_id: testCase.id,
      rubric_id: rubric.id,
      method: "human",
      score: null,
      verdict: "pending",
      raw_output: output,
    })
    .select()
    .single();

  await supabase.from("human_review_queue").insert({
    org_id: run.org_id,
    run_id: run.id,
    test_case_id: testCase.id,
    rubric_id: rubric.id,
    status: "pending",
  });

  return result;
}

async function runProgrammaticCheck(
  rubric: Rubric,
  testCase: TestCase,
  output: string,
): Promise<{ score: number; rationale: string }> {
  const kind = rubric.programmatic_kind ?? "keyword";

  if (kind === "json_schema") {
    try {
      JSON.parse(output);
      return { score: 1, rationale: "Output is valid JSON." };
    } catch {
      return { score: 0, rationale: "Output is not valid JSON." };
    }
  }

  const result = await checkGuardrailText({
    text: output,
    checkKind: kind,
    reference: testCase.reference ?? testCase.expected_output,
    config: rubric.config,
  });

  // for these check kinds, `triggered` means a problem was found — invert to a pass score
  return { score: result.triggered ? 0 : 1, rationale: result.reason || "No issues detected." };
}
