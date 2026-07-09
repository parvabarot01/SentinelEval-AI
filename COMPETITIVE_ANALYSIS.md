# Competitive Analysis

## Landscape

| Product | Core strength | Where it stops |
|---|---|---|
| **Braintrust** | Fast eval loop, great DX for engineers, strong experiment tracking | Guardrails and runtime enforcement aren't the product — it's a pre-ship tool, not a governance layer |
| **LangSmith** | Deep tracing/observability tied to LangChain, good for debugging chains | Evaluation is a feature bolted onto tracing, not a first-class governed workflow; promotion gating isn't native |
| **Humanloop** | Strong prompt management + human feedback loop | Weaker on statistical rigor (agreement metrics, significance testing) and no regression-gated promotion workflow |
| **Arize Phoenix** | Excellent open-source observability, drift detection, embeddings analysis | Built for ML observability generally, not eval-suite-and-guardrail workflow specifically; steeper setup for a non-ML-infra team |
| **Patronus AI** | Purpose-built guardrails and safety evals, strong on the safety side | Governance/promotion workflow and cross-team executive rollup are thinner; more point-solution than platform |

## Where SentinelEval sits

None of the above combine all three of: (1) pre-ship multi-method evaluation, (2) inline runtime guardrails, and (3) a promotion governance layer with an automatic regression gate — as one product with one audit trail. Most teams today stitch together an eval tool + a guardrails vendor + a manual sign-off spreadsheet. That stitching is exactly the gap: the eval results and the guardrail decisions live in different systems, so there's no single place to answer "was this version safe to promote, and why."

**Positioning:** the zero-cost, self-serve alternative to that three-tool stitch — for a team that wants evaluation and guardrails to share one schema, one audit log, and one regression gate, not three dashboards that don't talk to each other.

## Where we're deliberately behind (v1)

- No tracing/observability of arbitrary chain-of-thought or multi-step agent execution (Phoenix/LangSmith's strength) — SentinelEval scores inputs/outputs against a suite, not full execution traces.
- No managed hosting of the judge model beyond Groq's free tier — a well-funded team may want a higher-throughput or fine-tuned judge.
- Single-model judge (Llama 3.3 70B via Groq) rather than a marketplace of judge models.

These are reasonable v1 trade-offs for the zero-cost constraint (see PRICING_STRATEGY.md) and the product's actual thesis — governance over eval + guardrails, not general observability.
