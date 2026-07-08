"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/AuthShell";
import type { CriterionType, ProgrammaticCheckKind } from "@/lib/types";

export function AddRubricForm({ suiteId }: { suiteId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [criterionType, setCriterionType] = useState<CriterionType>("llm_judge");
  const [programmaticKind, setProgrammaticKind] = useState<ProgrammaticCheckKind>("keyword");
  const [weight, setWeight] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch(`/api/suites/${suiteId}/rubrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        criterionType,
        programmaticKind: criterionType === "programmatic" ? programmaticKind : undefined,
        weight: Number(weight),
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    setName("");
    setDescription("");
    setWeight("1");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-white/5 bg-surface-card p-4">
      <h3 className="text-sm font-medium text-signal-white">Add criterion</h3>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name (e.g. factual accuracy)" type="text" value={name} onChange={setName} required />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-signal-muted">Method</span>
          <select
            value={criterionType}
            onChange={(e) => setCriterionType(e.target.value as CriterionType)}
            className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-signal-white outline-none focus-visible:border-block"
          >
            <option value="llm_judge">LLM judge</option>
            <option value="programmatic">Programmatic</option>
            <option value="human">Human review</option>
          </select>
        </label>
      </div>
      {criterionType === "programmatic" && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-signal-muted">Check kind</span>
          <select
            value={programmaticKind}
            onChange={(e) => setProgrammaticKind(e.target.value as ProgrammaticCheckKind)}
            className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-signal-white outline-none focus-visible:border-block"
          >
            <option value="json_schema">JSON schema validation</option>
            <option value="regex">Regex match</option>
            <option value="keyword">Keyword match</option>
            <option value="groundedness">Groundedness vs. reference</option>
            <option value="pii">PII detection</option>
          </select>
        </label>
      )}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What does this criterion check for?"
        rows={2}
        className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-sm text-signal-white outline-none focus-visible:border-block"
      />
      <Field label="Weight" type="number" value={weight} onChange={setWeight} />
      {error && <p className="text-sm text-block">{error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Adding…" : "Add criterion"}
      </Button>
    </form>
  );
}
