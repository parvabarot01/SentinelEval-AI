"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function AddTestCaseForm({ datasetId, datasetVersionId }: { datasetId: string; datasetVersionId: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch(`/api/datasets/${datasetId}/test-cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datasetVersionId,
        input,
        expectedOutput: expectedOutput || undefined,
        reference: reference || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    setInput("");
    setExpectedOutput("");
    setReference("");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-white/5 bg-surface-card p-4">
      <h3 className="text-sm font-medium text-signal-white">Add test case</h3>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Input given to the feature under test"
        rows={2}
        required
        className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-sm text-signal-white outline-none focus-visible:border-block"
      />
      <textarea
        value={expectedOutput}
        onChange={(e) => setExpectedOutput(e.target.value)}
        placeholder="Expected output (optional)"
        rows={2}
        className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-sm text-signal-white outline-none focus-visible:border-block"
      />
      <textarea
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Reference material for groundedness checks (optional)"
        rows={2}
        className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-sm text-signal-white outline-none focus-visible:border-block"
      />
      {error && <p className="text-sm text-block">{error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Adding…" : "Add test case"}
      </Button>
    </form>
  );
}
