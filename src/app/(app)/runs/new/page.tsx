"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Project, ProjectVersion, EvalSuite, EvalDataset, DatasetVersion } from "@/lib/types";

export default function NewRunPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [suites, setSuites] = useState<EvalSuite[]>([]);
  const [datasets, setDatasets] = useState<EvalDataset[]>([]);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [datasetVersions, setDatasetVersions] = useState<DatasetVersion[]>([]);

  const [projectId, setProjectId] = useState("");
  const [projectVersionId, setProjectVersionId] = useState("");
  const [suiteId, setSuiteId] = useState(searchParams.get("suite") ?? "");
  const [datasetId, setDatasetId] = useState("");
  const [datasetVersionId, setDatasetVersionId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []));
    fetch("/api/suites")
      .then((r) => r.json())
      .then((d) => setSuites(d.suites ?? []));
    fetch("/api/datasets")
      .then((r) => r.json())
      .then((d) => setDatasets(d.datasets ?? []));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/versions`)
      .then((r) => r.json())
      .then((d) => setVersions(d.versions ?? []));
  }, [projectId]);

  useEffect(() => {
    if (!datasetId) return;
    fetch(`/api/datasets/${datasetId}/versions`)
      .then((r) => r.json())
      .then((d) => setDatasetVersions(d.versions ?? []));
  }, [datasetId]);

  function onProjectChange(id: string) {
    setProjectId(id);
    setProjectVersionId("");
    setVersions([]);
  }

  function onDatasetChange(id: string) {
    setDatasetId(id);
    setDatasetVersionId("");
    setDatasetVersions([]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!projectVersionId || !suiteId || !datasetVersionId) {
      setError("Choose a feature version, a suite, and a dataset version.");
      return;
    }

    setPending(true);
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectVersionId, suiteId, datasetVersionId }),
    });

    if (!res.ok) {
      const resBody = await res.json();
      setError(resBody.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    const { run } = await res.json();
    router.push(`/runs/${run.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-medium text-signal-white">Run a suite</h1>
      <p className="mt-1 text-sm text-signal-muted">
        Runs execute async — this queues the job and takes you to its live status.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Select label="Feature" value={projectId} onChange={onProjectChange} options={projects.map((p) => [p.id, p.name])} />
        <Select
          label="Version"
          value={projectVersionId}
          onChange={setProjectVersionId}
          options={versions.map((v) => [v.id, `${v.version_label} (${v.environment})`])}
          disabled={!projectId}
        />
        <Select label="Suite" value={suiteId} onChange={setSuiteId} options={suites.map((s) => [s.id, s.name])} />
        <Select label="Dataset" value={datasetId} onChange={onDatasetChange} options={datasets.map((d) => [d.id, d.name])} />
        <Select
          label="Dataset version"
          value={datasetVersionId}
          onChange={setDatasetVersionId}
          options={datasetVersions.map((v) => [v.id, `v${v.version_number}`])}
          disabled={!datasetId}
        />
        {error && <p className="text-sm text-block">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 w-fit">
          {pending ? "Queuing…" : "Run suite"}
        </Button>
      </form>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-signal-muted">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        required
        className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-signal-white outline-none focus-visible:border-block disabled:opacity-40"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
