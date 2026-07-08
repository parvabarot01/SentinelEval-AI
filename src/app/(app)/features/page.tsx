import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { LinkButton } from "@/components/ui/Button";
import { RailCard } from "@/components/ui/Rail";
import { timeAgo } from "@/lib/utils";
import type { Project } from "@/lib/types";

export default async function FeaturesPage() {
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .order("created_at", { ascending: false });

  const list = (projects ?? []) as Project[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-signal-white">Features</h1>
          <p className="mt-1 text-sm text-signal-muted">
            LLM features under test — each one tracks versioned prompt/model config across dev, staging, and prod.
          </p>
        </div>
        <LinkButton href="/features/new">New feature</LinkButton>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-12 text-center text-sm text-signal-muted">
          No features registered yet. Register your first LLM feature to start building eval suites against it.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((project) => (
            <RailCard key={project.id} href={`/features/${project.id}`} accentClassName="border-t-judge" className="w-full">
              <div className="text-[15px] font-medium text-signal-white">{project.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-signal-muted">
                {project.description || "No description yet."}
              </p>
              <div className="mt-4 text-[11px] text-signal-muted">Registered {timeAgo(project.created_at)}</div>
            </RailCard>
          ))}
        </div>
      )}
    </div>
  );
}
