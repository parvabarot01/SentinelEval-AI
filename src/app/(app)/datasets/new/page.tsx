"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/AuthShell";

export default function NewDatasetPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch("/api/datasets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    const { dataset } = await res.json();
    router.push(`/datasets/${dataset.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-medium text-signal-white">Create a dataset</h1>
      <p className="mt-1 text-sm text-signal-muted">Starts at version 1 — add test cases once it's created.</p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="Dataset name" type="text" value={name} onChange={setName} required />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-signal-muted">Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-signal-white outline-none focus-visible:border-block"
          />
        </label>
        <Field label="Tags (comma-separated)" type="text" value={tags} onChange={setTags} />
        {error && <p className="text-sm text-block">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 w-fit">
          {pending ? "Creating…" : "Create dataset"}
        </Button>
      </form>
    </div>
  );
}
