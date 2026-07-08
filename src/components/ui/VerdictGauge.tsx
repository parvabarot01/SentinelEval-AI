"use client";

import { useEffect, useState } from "react";
import { verdictFromScore } from "@/lib/utils";
import { ScoreNumber } from "./ScoreNumber";

const VERDICT_COLOR = {
  pass: "var(--pass-green)",
  watch: "var(--watch-amber)",
  block: "var(--block-coral)",
  pending: "var(--signal-muted)",
} as const;

interface VerdictGaugeProps {
  score: number; // 0..1
  label?: string;
}

/** Animated 0→value fill bar, green→amber→coral — the signature verdict-spectrum element. */
export function VerdictGauge({ score, label }: VerdictGaugeProps) {
  const [width, setWidth] = useState(0);
  const verdict = verdictFromScore(score);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setWidth(score * 100);
      return;
    }
    const raf = requestAnimationFrame(() => setWidth(score * 100));
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-signal-muted">
          <span>{label}</span>
          <ScoreNumber value={score} />
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-[600ms] ease-out"
          style={{ width: `${width}%`, backgroundColor: VERDICT_COLOR[verdict] }}
        />
      </div>
    </div>
  );
}
