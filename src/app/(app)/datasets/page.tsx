import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { LinkButton } from "@/components/ui/Button";
import { RailCard } from "@/components/ui/Rail";
import { timeAgo } from "@/lib/utils";
import type { EvalDataset } from "@/lib/types";

export default async function DatasetsPage() {
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: datasets } = await supabase
    .from("eval_datasets")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .order("created_at", { ascending: false });

  const list = (datasets ?? []) as EvalDataset[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-signal-white">Datasets</h1>
          <p className="mt-1 text-sm text-signal-muted">
            Test cases with inputs and optional reference outputs — versioned so every eval run is reproducible.
          </p>
        </div>
        <LinkButton href="/datasets/new">New dataset</LinkButton>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-12 text-center text-sm text-signal-muted">
          No datasets yet. Create one to start adding test cases.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((dataset) => (
            <RailCard key={dataset.id} href={`/datasets/${dataset.id}`} accentClassName="border-t-judge" className="w-full">
              <div className="text-[15px] font-medium text-signal-white">{dataset.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-signal-muted">
                {dataset.description || "No description yet."}
              </p>
              {dataset.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dataset.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-signal-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 text-[11px] text-signal-muted">Created {timeAgo(dataset.created_at)}</div>
            </RailCard>
          ))}
        </div>
      )}
    </div>
  );
}
