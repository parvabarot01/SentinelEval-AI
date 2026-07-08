"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { DatasetVersion } from "@/lib/types";

export function VersionSwitcher({ datasetId, versions }: { datasetId: string; versions: DatasetVersion[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("version") ?? versions[0]?.id;

  return (
    <select
      value={current}
      onChange={(e) => router.push(`/datasets/${datasetId}?version=${e.target.value}`)}
      className="rounded-md border border-white/10 bg-surface-raised px-3 py-1.5 text-sm text-signal-white outline-none focus-visible:border-block"
    >
      {versions.map((v) => (
        <option key={v.id} value={v.id}>
          v{v.version_number}
        </option>
      ))}
    </select>
  );
}

export function NewVersionButton({ datasetId, latestVersionId }: { datasetId: string; latestVersionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const res = await fetch(`/api/datasets/${datasetId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ copyFromVersionId: latestVersionId, note: "Copied from prior version" }),
    });
    if (res.ok) {
      const { version } = await res.json();
      router.push(`/datasets/${datasetId}?version=${version.id}`);
      router.refresh();
    }
    setPending(false);
  }

  return (
    <Button variant="secondary" onClick={onClick} disabled={pending}>
      {pending ? "Creating…" : "New version"}
    </Button>
  );
}
