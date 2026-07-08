import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { ReviewItemCard } from "./ReviewItemCard";

interface QueueRow {
  id: string;
  test_cases: { input: string } | null;
  rubrics: { name: string } | null;
}

export default async function ReviewQueuePage() {
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: queue } = await supabase
    .from("human_review_queue")
    .select("id, test_cases(input), rubrics(name)")
    .eq("org_id", orgContext!.current!.orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<QueueRow[]>();

  const list = queue ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-signal-white">Review queue</h1>
        <p className="mt-1 text-sm text-signal-muted">
          Cases flagged for human review — your decision feeds directly into the run&apos;s score.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-12 text-center text-sm text-signal-muted">
          Nothing pending review right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((item) => (
            <ReviewItemCard
              key={item.id}
              queueId={item.id}
              rubricName={item.rubrics?.name ?? "Unknown criterion"}
              input={item.test_cases?.input ?? ""}
              candidateOutput={null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
