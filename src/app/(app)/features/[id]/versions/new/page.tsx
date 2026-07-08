"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/AuthShell";
import type { ProjectEnvironment } from "@/lib/types";

export default function NewVersionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [versionLabel, setVersionLabel] = useState("");
  const [environment, setEnvironment] = useState<ProjectEnvironment>("dev");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [temperature, setTemperature] = useState("0.2");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch(`/api/projects/${params.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionLabel,
        environment,
        model,
        temperature: Number(temperature),
        systemPrompt,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    router.push(`/features/${params.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-medium text-signal-white">New version</h1>
      <p className="mt-1 text-sm text-signal-muted">
        Register a versioned prompt/model config as a deployable artifact for one environment.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Version label (e.g. v12)" type="text" value={versionLabel} onChange={setVersionLabel} required />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-signal-muted">Environment</span>
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Model" type="text" value={model} onChange={setModel} required />
          <Field label="Temperature" type="number" value={temperature} onChange={setTemperature} required />
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-signal-muted">System prompt</span>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 font-mono text-xs text-signal-white outline-none focus-visible:border-block"
          />
        </label>
        {error && <p className="text-sm text-block">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 w-fit">
          {pending ? "Saving…" : "Save version"}
        </Button>
      </form>
    </div>
  );
}
