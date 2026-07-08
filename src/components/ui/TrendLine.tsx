import { verdictFromScore } from "@/lib/utils";

const VERDICT_COLOR = {
  pass: "var(--pass-green)",
  watch: "var(--watch-amber)",
  block: "var(--block-coral)",
  pending: "var(--signal-muted)",
} as const;

interface TrendPoint {
  score: number; // 0..1
  label: string; // shown in the native tooltip, e.g. "v12 — Jul 3"
}

const WIDTH = 480;
const HEIGHT = 96;
const PAD_X = 12;
const PAD_Y = 16;

/**
 * Single-series score trend across runs — one hue per skill's "single series
 * needs no legend" rule, with per-point verdict color as secondary status
 * encoding. Native <title> gives a minimal hover tooltip without pulling in a
 * charting dependency for something this small.
 */
export function TrendLine({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) return null;

  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_Y * 2;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? PAD_X + innerWidth / 2 : PAD_X + (i / (points.length - 1)) * innerWidth;
    const y = PAD_Y + (1 - p.score) * innerHeight;
    return { ...p, x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Score trend across runs">
      {/* recessive gridlines at 0.7 (watch) and 0.85 (pass) thresholds */}
      {[0.7, 0.85].map((threshold) => {
        const y = PAD_Y + (1 - threshold) * innerHeight;
        return (
          <line
            key={threshold}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={y}
            y2={y}
            stroke="var(--surface-raised)"
            strokeWidth={1}
          />
        );
      })}

      <path d={linePath} fill="none" stroke="var(--signal-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={5} fill={VERDICT_COLOR[verdictFromScore(c.score)]} stroke="var(--surface-card)" strokeWidth={2}>
          <title>
            {c.label}: {c.score.toFixed(2)}
          </title>
        </circle>
      ))}

      <text x={last.x} y={last.y - 12} textAnchor="end" className="font-mono" fontSize={11} fill="var(--signal-white)">
        {last.score.toFixed(2)}
      </text>
    </svg>
  );
}
