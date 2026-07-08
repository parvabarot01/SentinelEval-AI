import Groq from "groq-sdk";

const JUDGE_MODEL = "llama-3.3-70b-versatile";

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return client;
}

export interface JudgeVerdict {
  score: number; // 0..1
  passed: boolean;
  rationale: string;
}

/**
 * LLM-as-judge: scores a single test case output against one rubric
 * criterion. Structured JSON output via response_format so the route handler
 * can persist score + rationale directly, no free-text parsing.
 */
export async function judgeCase(params: {
  criterionName: string;
  criterionDescription: string;
  input: string;
  output: string;
  referenceOutput?: string | null;
}): Promise<JudgeVerdict> {
  const groq = getClient();

  const completion = await groq.chat.completions.create({
    model: JUDGE_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an exacting evaluation judge for an enterprise LLM quality gate. " +
          "Score the candidate output strictly against the single named criterion, " +
          "ignoring qualities unrelated to that criterion. Respond with JSON only: " +
          '{"score": number between 0 and 1, "passed": boolean, "rationale": string (1-3 sentences)}.',
      },
      {
        role: "user",
        content: [
          `Criterion: ${params.criterionName}`,
          `Criterion definition: ${params.criterionDescription}`,
          `Input given to the system under test:\n${params.input}`,
          params.referenceOutput ? `Reference / expected output:\n${params.referenceOutput}` : null,
          `Candidate output to judge:\n${params.output}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<JudgeVerdict>;

  const score = typeof parsed.score === "number" ? Math.min(1, Math.max(0, parsed.score)) : 0;
  return {
    score,
    passed: parsed.passed ?? score >= 0.85,
    rationale: parsed.rationale ?? "No rationale returned.",
  };
}

/** Runs the feature-under-test itself (simulated target model) for a test case. */
export async function runFeatureUnderTest(params: {
  systemPrompt: string;
  model: string;
  temperature: number;
  input: string;
}): Promise<string> {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: params.model,
    temperature: params.temperature,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.input },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

/** AI decision layer: explains a regression or promotion-safety question, grounded in real eval data. */
export async function explainDecision(params: {
  question: string;
  evidenceSummary: string;
}): Promise<string> {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: JUDGE_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are SentinelEval's decision layer. Answer the question grounded strictly " +
          "in the evidence provided — cite specific criteria and score deltas, never " +
          "speculate beyond the given data. Keep the answer under 150 words.",
      },
      {
        role: "user",
        content: `Question: ${params.question}\n\nEvidence:\n${params.evidenceSummary}`,
      },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

export async function checkGuardrailText(params: {
  text: string;
  checkKind: "pii" | "groundedness" | "keyword" | "regex";
  reference?: string | null;
  config?: Record<string, unknown>;
}): Promise<{ triggered: boolean; reason: string }> {
  if (params.checkKind === "keyword") {
    const keywords = (params.config?.keywords as string[]) ?? [];
    const hit = keywords.find((kw) => params.text.toLowerCase().includes(kw.toLowerCase()));
    return hit ? { triggered: true, reason: `Matched blocked keyword "${hit}"` } : { triggered: false, reason: "" };
  }
  if (params.checkKind === "regex") {
    const pattern = params.config?.pattern as string | undefined;
    if (!pattern) return { triggered: false, reason: "" };
    const match = new RegExp(pattern).test(params.text);
    return match ? { triggered: true, reason: `Matched pattern /${pattern}/` } : { triggered: false, reason: "" };
  }

  // pii / groundedness need judgment — delegate to the judge model
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: JUDGE_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          params.checkKind === "pii"
            ? 'Detect personally identifiable information (names, emails, phone numbers, addresses, SSNs, card numbers) in the text. Respond {"triggered": boolean, "reason": string}.'
            : 'Determine whether the text is factually grounded in the reference — flag unsupported claims not present in the reference. Respond {"triggered": boolean, "reason": string} where triggered=true means NOT grounded.',
      },
      {
        role: "user",
        content: params.reference
          ? `Reference:\n${params.reference}\n\nText to check:\n${params.text}`
          : `Text to check:\n${params.text}`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
    triggered?: boolean;
    reason?: string;
  };
  return { triggered: parsed.triggered ?? false, reason: parsed.reason ?? "" };
}
