"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Project, ProjectVersion, ProjectEnvironment } from "@/lib/types";

export function RequestPromotionForm() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [projectId, setProjectId] = useState("");
  const [toVersionId, setToVersionId] = useState("");
  const [environment, setEnvironment] = useState<ProjectEnvironment>("prod");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/versions`)
      .then((r) => r.json())
      .then((d) => setVersions(d.versions ?? []));
  }, [projectId]);

  function onProjectChange(id: string) {
    setProjectId(id);
    setToVersionId("");
    setVersions([]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, toVersionId, environment }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-white/5 bg-surface-card p-4">
      <h3 className="text-sm font-medium text-signal-white">Request a promotion</h3>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-signal-muted">Feature</span>
          <select
            value={projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            required
            className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-signal-white outline-none focus-visible:border-block"
          >
            <option value="" disabled>
              Select…
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-signal-muted">Candidate version</span>
          <select
            value={toVersionId}
            onChange={(e) => setToVersionId(e.target.value)}
            required
            disabled={!projectId}
            className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-signal-white outline-none focus-visible:border-block disabled:opacity-40"
          >
            <option value="" disabled>
              Select…
            </option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.version_label} ({v.environment})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-signal-muted">Target environment</span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as ProjectEnvironment)}
            className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-signal-white outline-none focus-visible:border-block"
          >
            <option value="dev">dev</option>
            <option value="staging">staging</option>
            <option value="prod">prod</option>
          </select>
        </label>
      </div>
      {error && <p className="text-sm text-block">{error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Checking for regressions…" : "Request promotion"}
      </Button>
    </form>
  );
}
