"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function PromotionActions({ promotionId }: { promotionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function decide(action: "approve" | "reject") {
    setPending(action);
    await fetch(`/api/promotions/${promotionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button disabled={!!pending} onClick={() => decide("approve")}>
        {pending === "approve" ? "Approving…" : "Approve"}
      </Button>
      <Button variant="secondary" disabled={!!pending} onClick={() => decide("reject")}>
        {pending === "reject" ? "Rejecting…" : "Reject"}
      </Button>
    </div>
  );
}
