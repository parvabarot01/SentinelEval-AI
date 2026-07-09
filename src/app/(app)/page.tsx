import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { HeroBillboard } from "@/components/ui/HeroBillboard";
import { Rail, RailCard } from "@/components/ui/Rail";
import { VerdictChip, verdictBorderClass } from "@/components/ui/VerdictChip";
import { StatTile } from "@/components/ui/StatTile";
import { timeAgo, verdictFromScore, type Verdict } from "@/lib/utils";
import type { EvalRunSummary, Promotion, GuardrailLog, Project } from "@/lib/types";

export default async function DashboardPage() {
  const orgContext = await getCurrentOrg();
  const orgId = orgContext!.current!.orgId;
  const supabase = await createClient();

  const [{ data: projects }, { data: recentRuns }, { data: openPromotions }, { data: recentBlocks }] = await Promise.all([
    supabase.from("projects").select("*").eq("org_id", orgId).returns<Project[]>(),
    supabase
      .from("eval_run_summary")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<EvalRunSummary[]>(),
    supabase
      .from("promotions")
      .select("*")
      .eq("org_id", orgId)
      .in("status", ["pending", "auto_blocked"])
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<Promotion[]>(),
    supabase
      .from("guardrail_logs")
      .select("*")
      .eq("org_id", orgId)
      .eq("decision", "block")
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<GuardrailLog[]>(),
  ]);

  const projectById = new Map((projects ?? []).map((p) => [p.id, p]));
  const regressedRuns = (recentRuns ?? []).filter((r) => r.block_count > 0);

  const hero = buildHero({ openPromotions: openPromotions ?? [], recentBlocks: recentBlocks ?? [], regressedRuns });

  // one tile per feature: its most recent completed run score
  const scorecardTiles = (projects ?? []).map((project) => {
    const latest = (recentRuns ?? []).find((r) => r.project_id === project.id && r.avg_score !== null);
    return {
      project,
      score: latest?.avg_score ?? null,
      verdict: latest?.avg_score !== undefined && latest?.avg_score !== null ? verdictFromScore(latest.avg_score) : ("pending" as Verdict),
    };
  });

  return (
    <div className="flex flex-col gap-10">
      <HeroBillboard {...hero} />

      {scorecardTiles.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 text-[15px] font-medium text-signal-white">Reliability scorecard</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {scorecardTiles.map(({ project, score, verdict }) => (
              <StatTile key={project.id} name={project.name} score={score ?? 0} verdict={verdict} subtitle={score === null ? "No runs yet" : undefined} />
            ))}
          </div>
        </section>
      )}

      <Rail title="Recent eval runs" isEmpty={(recentRuns ?? []).length === 0} emptyMessage="No runs yet — run a suite to see scores here.">
        {(recentRuns ?? []).map((run) => {
          const verdict = run.avg_score !== null ? verdictFromScore(run.avg_score) : "pending";
          return (
            <RailCard key={run.run_id} href={`/runs/${run.run_id}`} accentClassName={verdictBorderClass(verdict)}>
              <VerdictChip verdict={verdict} />
              {run.avg_score !== null && <div className="mt-3 font-mono text-lg text-signal-white">{run.avg_score.toFixed(2)}</div>}
              <div className="mt-2 text-[11px] text-signal-muted">{projectById.get(run.project_id)?.name}</div>
              <div className="mt-1 text-[11px] text-signal-muted">{timeAgo(run.created_at)}</div>
            </RailCard>
          );
        })}
      </Rail>

      <Rail
        title="Regressions this week"
        isEmpty={regressedRuns.length === 0}
        emptyMessage="No regressions detected in recent runs."
      >
        {regressedRuns.map((run) => (
          <RailCard key={run.run_id} href={`/runs/${run.run_id}`} accentClassName="border-t-block">
            <VerdictChip verdict="block" />
            <div className="mt-3 text-[11px] text-signal-muted">
              {run.block_count} of {run.total_cases} cases blocked
            </div>
            <div className="mt-1 text-[11px] text-signal-muted">{projectById.get(run.project_id)?.name}</div>
          </RailCard>
        ))}
      </Rail>

      <Rail
        title="Guardrail blocks"
        isEmpty={(recentBlocks ?? []).length === 0}
        emptyMessage="No guardrail blocks logged."
      >
        {(recentBlocks ?? []).map((log) => (
          <RailCard key={log.id} href="/guardrails" accentClassName="border-t-block">
            <VerdictChip verdict="block" />
            <div className="mt-3 text-[11px] text-signal-muted">{projectById.get(log.project_id)?.name}</div>
            <div className="mt-1 text-[11px] text-signal-muted">{log.direction} · {timeAgo(log.created_at)}</div>
          </RailCard>
        ))}
      </Rail>

      <Rail
        title="Awaiting promotion approval"
        isEmpty={(openPromotions ?? []).length === 0}
        emptyMessage="Nothing waiting on a promotion decision."
      >
        {(openPromotions ?? []).map((promo) => (
          <RailCard
            key={promo.id}
            href="/governance"
            accentClassName={promo.status === "auto_blocked" ? "border-t-block" : "border-t-watch"}
          >
            <VerdictChip verdict={promo.status === "auto_blocked" ? "block" : "watch"} label={promo.status === "auto_blocked" ? "Auto-blocked" : "Pending"} />
            <div className="mt-3 text-[11px] text-signal-muted">{projectById.get(promo.project_id)?.name} → {promo.environment}</div>
            <div className="mt-1 text-[11px] text-signal-muted">{timeAgo(promo.created_at)}</div>
          </RailCard>
        ))}
      </Rail>
    </div>
  );
}

function buildHero({
  openPromotions,
  recentBlocks,
  regressedRuns,
}: {
  openPromotions: Promotion[];
  recentBlocks: GuardrailLog[];
  regressedRuns: EvalRunSummary[];
}) {
  const autoBlocked = openPromotions.find((p) => p.status === "auto_blocked");
  if (autoBlocked) {
    return {
      eyebrow: "Promotion blocked",
      headline: "A promotion is auto-blocked on a regression",
      supporting: "Suite scores dropped significantly against the currently deployed version. Review the comparison before overriding.",
      verdict: "block" as Verdict,
      primaryHref: "/governance",
      primaryLabel: "Review promotion",
      secondaryHref: "/runs",
      secondaryLabel: "View runs",
    };
  }

  if (recentBlocks.length > 0) {
    return {
      eyebrow: "Guardrail activity",
      headline: `${recentBlocks.length} guardrail block${recentBlocks.length === 1 ? "" : "s"} logged recently`,
      supporting: "Production traffic tripped an active guardrail policy. Check what triggered it.",
      verdict: "block" as Verdict,
      primaryHref: "/guardrails",
      primaryLabel: "Review guardrails",
      secondaryHref: "/governance",
      secondaryLabel: "Governance",
    };
  }

  if (regressedRuns.length > 0) {
    return {
      eyebrow: "Regression",
      headline: "A recent eval run has blocked cases",
      supporting: "At least one criterion failed outright in a recent run. Drill in to see which one.",
      verdict: "block" as Verdict,
      primaryHref: `/runs/${regressedRuns[0].run_id}`,
      primaryLabel: "Review run",
      secondaryHref: "/runs",
      secondaryLabel: "All runs",
    };
  }

  if (openPromotions.length > 0) {
    return {
      eyebrow: "Governance",
      headline: "A promotion is awaiting your approval",
      supporting: "No regression detected — sign off to make it live.",
      verdict: "watch" as Verdict,
      primaryHref: "/governance",
      primaryLabel: "Review promotion",
      secondaryHref: "/runs",
      secondaryLabel: "View runs",
    };
  }

  return {
    eyebrow: "All clear",
    headline: "No regressions or guardrail blocks right now",
    supporting: "Register a feature, build a suite, and run it to start building your reliability history.",
    verdict: "pass" as Verdict,
    primaryHref: "/runs/new",
    primaryLabel: "Run a suite",
    secondaryHref: "/features",
    secondaryLabel: "Features",
  };
}
