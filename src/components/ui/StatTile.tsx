import { cn, type Verdict } from "@/lib/utils";
import { verdictBorderClass, verdictTextClass } from "./VerdictChip";
import { ScoreNumber } from "./ScoreNumber";

interface StatTileProps {
  name: string;
  score: number;
  verdict: Verdict;
  subtitle?: string;
}

/** Executive-dashboard grid cell — one tile per feature, the "wall of verdict-colored tiles." */
export function StatTile({ name, score, verdict, subtitle }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-t-2 bg-surface-card p-4 transition-[transform,filter] duration-150 ease-out hover:scale-[1.02] hover:brightness-110",
        verdictBorderClass(verdict),
      )}
    >
      <div className="text-[13px] font-medium text-signal-white">{name}</div>
      {subtitle && <div className="mt-0.5 text-xs text-signal-muted">{subtitle}</div>}
      <div className={cn("mt-3 text-2xl", verdictTextClass(verdict))}>
        <ScoreNumber value={score} />
      </div>
    </div>
  );
}
