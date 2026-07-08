"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/AuthShell";
import type { Project, ProgrammaticCheckKind } from "@/lib/types";

interface CheckDraft {
  kind: ProgrammaticCheckKind;
  pattern?: string;
  keywords?: string;
}

const CHECK_LABEL: Record<ProgrammaticCheckKind, string> = {
  json_schema: "JSON schema validation",
  regex: "Regex match (blocks on match)",
  keyword: "Keyword match (blocks on match)",
  groundedness: "Groundedness vs. reference (flags if ungrounded)",
  pii: "PII detection (blocks on detection)",
};

export function CreatePolicyForm() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [checks, setChecks] = useState<CheckDraft[]>([{ kind: "pii" }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []));
  }, []);

  function updateCheck(index: number, patch: Partial<CheckDraft>) {
    setChecks((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch("/api/guardrails/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        name,
        checks: checks.map((c) => ({
          kind: c.kind,
          pattern: c.pattern || undefined,
          keywords: c.keywords ? c.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    setName("");
    setChecks([{ kind: "pii" }]);
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-white/5 bg-surface-card p-4">
      <h3 className="text-sm font-medium text-signal-white">New guardrail policy</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-signal-muted">Feature</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
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
        <Field label="Policy name" type="text" value={name} onChange={setName} required />
      </div>

      <div className="flex flex-col gap-3">
        {checks.map((check, i) => (
          <div key={i} className="rounded-md bg-surface-raised p-3">
            <select
              value={check.kind}
              onChange={(e) => updateCheck(i, { kind: e.target.value as ProgrammaticCheckKind })}
              className="w-full rounded-md border border-white/10 bg-surface-card px-3 py-2 text-sm text-signal-white outline-none focus-visible:border-block"
            >
              {(Object.keys(CHECK_LABEL) as ProgrammaticCheckKind[])
                .filter((k) => k !== "json_schema")
                .map((kind) => (
                  <option key={kind} value={kind}>
                    {CHECK_LABEL[kind]}
                  </option>
                ))}
            </select>
            {check.kind === "regex" && (
              <input
                value={check.pattern ?? ""}
                onChange={(e) => updateCheck(i, { pattern: e.target.value })}
                placeholder="Pattern, e.g. \\b\\d{3}-\\d{2}-\\d{4}\\b"
                className="mt-2 w-full rounded-md border border-white/10 bg-surface-card px-3 py-2 font-mono text-xs text-signal-white outline-none focus-visible:border-block"
              />
            )}
            {check.kind === "keyword" && (
              <input
                value={check.keywords ?? ""}
                onChange={(e) => updateCheck(i, { keywords: e.target.value })}
                placeholder="Blocked keywords, comma-separated"
                className="mt-2 w-full rounded-md border border-white/10 bg-surface-card px-3 py-2 text-sm text-signal-white outline-none focus-visible:border-block"
              />
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setChecks((prev) => [...prev, { kind: "pii" }])}>
            + Add check
          </Button>
          {checks.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setChecks((prev) => prev.slice(0, -1))}
            >
              Remove last
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-block">{error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating…" : "Create policy"}
      </Button>
    </form>
  );
}
