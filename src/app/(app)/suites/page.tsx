import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { LinkButton } from "@/components/ui/Button";
import { RailCard } from "@/components/ui/Rail";
import { timeAgo } from "@/lib/utils";
import type { EvalSuite } from "@/lib/types";

export default async function SuitesPage() {
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: suites } = await supabase
    .from("eval_suites")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .order("created_at", { ascending: false });

  const list = (suites ?? []) as EvalSuite[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-signal-white">Suites</h1>
          <p className="mt-1 text-sm text-signal-muted">
            A suite is a set of criteria — judge, programmatic, or human — applied to a dataset.
          </p>
        </div>
        <LinkButton href="/suites/new">New suite</LinkButton>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-12 text-center text-sm text-signal-muted">
          No suites yet. Create one, then add criteria like &quot;factual accuracy&quot; or &quot;correct refusal.&quot;
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((suite) => (
            <RailCard key={suite.id} href={`/suites/${suite.id}`} accentClassName="border-t-judge" className="w-full">
              <div className="text-[15px] font-medium text-signal-white">{suite.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-signal-muted">
                {suite.description || "No description yet."}
              </p>
              <div className="mt-4 text-[11px] text-signal-muted">Created {timeAgo(suite.created_at)}</div>
            </RailCard>
          ))}
        </div>
      )}
    </div>
  );
}
