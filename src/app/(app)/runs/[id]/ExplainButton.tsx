"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ExplainRegressionButton({ runId }: { runId: string }) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/ai/explain-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Couldn't generate an explanation");
    } else {
      setAnswer(body.answer);
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="secondary" onClick={onClick} disabled={pending}>
        {pending ? "Thinking…" : "Why did this fail?"}
      </Button>
      {(answer || error) && (
        <div className="max-w-sm rounded-lg border border-judge/30 bg-judge/10 p-3 text-right text-sm text-signal-white">
          {error ? <span className="text-block">{error}</span> : answer}
        </div>
      )}
    </div>
  );
}
