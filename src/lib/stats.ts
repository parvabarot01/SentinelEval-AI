import * as ss from "simple-statistics";

/** Cohen's kappa for judge-vs-human pass/fail agreement beyond chance. */
export function cohensKappa(judgePasses: boolean[], humanPasses: boolean[]): number {
  if (judgePasses.length !== humanPasses.length || judgePasses.length === 0) return 0;
  const n = judgePasses.length;

  let agree = 0;
  let judgeTrue = 0;
  let humanTrue = 0;
  for (let i = 0; i < n; i++) {
    if (judgePasses[i] === humanPasses[i]) agree++;
    if (judgePasses[i]) judgeTrue++;
    if (humanPasses[i]) humanTrue++;
  }

  const observedAgreement = agree / n;
  const expectedAgreement =
    (judgeTrue / n) * (humanTrue / n) + ((n - judgeTrue) / n) * ((n - humanTrue) / n);

  if (expectedAgreement === 1) return 1;
  return (observedAgreement - expectedAgreement) / (1 - expectedAgreement);
}

/** Wilson score interval for a pass-rate proportion — more reliable than normal approximation at small n. */
export function wilsonConfidenceInterval(
  successes: number,
  total: number,
  confidence = 0.95,
): { lower: number; upper: number; point: number } {
  if (total === 0) return { lower: 0, upper: 0, point: 0 };

  const z = confidence === 0.99 ? 2.576 : confidence === 0.9 ? 1.645 : 1.96;
  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));

  return {
    point: p,
    lower: Math.max(0, (center - margin) / denominator),
    upper: Math.min(1, (center + margin) / denominator),
  };
}

export interface RegressionCheck {
  isRegression: boolean;
  zScore: number;
  pValue: number;
  delta: number;
}

/**
 * Two-proportion z-test on pass rates between a baseline version and a
 * candidate version, for one criterion. Flags a regression when the drop is
 * both below `minDelta` and statistically significant (p < 0.05) — protects
 * against gating promotions on noise from a handful of test cases.
 */
export function detectRegression(
  baseline: { passes: number; total: number },
  candidate: { passes: number; total: number },
  minDelta = 0.03,
): RegressionCheck {
  if (baseline.total === 0 || candidate.total === 0) {
    return { isRegression: false, zScore: 0, pValue: 1, delta: 0 };
  }

  const p1 = baseline.passes / baseline.total;
  const p2 = candidate.passes / candidate.total;
  const delta = p2 - p1;

  const pooled = (baseline.passes + candidate.passes) / (baseline.total + candidate.total);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / baseline.total + 1 / candidate.total));

  if (se === 0) {
    return { isRegression: false, zScore: 0, pValue: 1, delta };
  }

  const zScore = (p2 - p1) / se;
  // two-tailed p-value from the standard normal CDF
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));

  return {
    isRegression: delta < -minDelta && pValue < 0.05,
    zScore,
    pValue,
    delta,
  };
}

function normalCdf(z: number): number {
  return (1 + erf(z / Math.sqrt(2))) / 2;
}

// Abramowitz-Stegun approximation — simple-statistics doesn't ship an erf/CDF helper.
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

export function mean(values: number[]): number {
  return values.length ? ss.mean(values) : 0;
}

export function standardDeviation(values: number[]): number {
  return values.length > 1 ? ss.standardDeviation(values) : 0;
}
