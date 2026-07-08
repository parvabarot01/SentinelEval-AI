"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ReviewDecision } from "@/lib/types";

export function ReviewItemCard({
  queueId,
  rubricName,
  input,
  candidateOutput,
}: {
  queueId: string;
  rubricName: string;
  input: string;
  candidateOutput: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<ReviewDecision | null>(null);

  async function submit(decision: ReviewDecision) {
    setPending(decision);
    await fetch(`/api/review/queue/${queueId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, notes: notes || undefined }),
    });
    router.refresh();
  }

  return (
    <div className="rounded-lg border-t-2 border-t-judge bg-surface-card p-4">
      <div className="text-xs uppercase tracking-wide text-judge">{rubricName}</div>
      <div className="mt-2 text-xs uppercase tracking-wide text-signal-muted">Input</div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-signal-white">{input}</p>
      {candidateOutput && (
        <>
          <div className="mt-3 text-xs uppercase tracking-wide text-signal-muted">Candidate output</div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-signal-white">{candidateOutput}</p>
        </>
      )}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="mt-3 w-full rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-sm text-signal-white outline-none focus-visible:border-block"
      />
      <div className="mt-3 flex gap-2">
        <Button variant="primary" disabled={!!pending} onClick={() => submit("accept")} className="bg-pass">
          {pending === "accept" ? "Saving…" : "Accept"}
        </Button>
        <Button variant="secondary" disabled={!!pending} onClick={() => submit("edit")}>
          {pending === "edit" ? "Saving…" : "Edit / partial"}
        </Button>
        <Button variant="secondary" disabled={!!pending} onClick={() => submit("reject")} className="text-block">
          {pending === "reject" ? "Saving…" : "Reject"}
        </Button>
      </div>
    </div>
  );
}
