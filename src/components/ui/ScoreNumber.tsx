"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreNumberProps {
  value: number; // 0..1
  className?: string;
  decimals?: number;
}

/** Mono, tabular-nums score readout that counts up from 0 on mount (design system "score settle" moment). */
export function ScoreNumber({ value, className, decimals = 2 }: ScoreNumberProps) {
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const durationMs = 600;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span className={cn("font-mono font-tabular", className)}>{display.toFixed(decimals)}</span>
  );
}
