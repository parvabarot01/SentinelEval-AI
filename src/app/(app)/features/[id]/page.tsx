import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { LinkButton } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";
import type { Project, ProjectVersion, ProjectEnvironment } from "@/lib/types";

const ENVIRONMENTS: ProjectEnvironment[] = ["dev", "staging", "prod"];

export default async function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .eq("id", id)
    .single<Project>();

  if (!project) notFound();

  const { data: versions } = await supabase
    .from("project_versions")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const versionsByEnv = ENVIRONMENTS.map((env) => ({
    env,
    versions: ((versions ?? []) as ProjectVersion[]).filter((v) => v.environment === env),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-signal-white">{project.name}</h1>
          <p className="mt-1 text-sm text-signal-muted">{project.description || "No description yet."}</p>
        </div>
        <LinkButton href={`/features/${project.id}/versions/new`}>New version</LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {versionsByEnv.map(({ env, versions: envVersions }) => (
          <div key={env} className="rounded-lg border border-white/5 bg-surface-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-signal-muted">{env}</h2>
              {envVersions[0] && (
                <span className="font-mono text-xs text-pass">{envVersions[0].version_label}</span>
              )}
            </div>
            {envVersions.length === 0 ? (
              <p className="text-xs text-signal-muted">No version deployed yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {envVersions.map((v) => (
                  <li key={v.id} className="rounded-md bg-surface-raised p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-signal-white">{v.version_label}</span>
                      {v.is_current_for_env && (
                        <span className="rounded-full bg-pass/15 px-2 py-0.5 text-[10px] font-medium text-pass">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-signal-muted">
                      {v.model} · temp {v.temperature} · {timeAgo(v.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
