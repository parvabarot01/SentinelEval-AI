"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/AuthShell";
import { timeAgo } from "@/lib/utils";

interface KeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [name, setName] = useState("");
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reload() {
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((d) => setKeys(d.keys ?? []));
  }

  useEffect(reload, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    const { key } = await res.json();
    setFreshKey(key.plaintext);
    setName("");
    setPending(false);
    reload();
  }

  async function revoke(id: string) {
    await fetch(`/api/settings/api-keys/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-signal-white">API keys</h1>
        <p className="mt-1 text-sm text-signal-muted">
          Used by your own backend to call the guardrail-check endpoint. Keys are shown once at creation.
        </p>
      </div>

      {freshKey && (
        <div className="rounded-lg border border-pass/30 bg-pass/10 p-4">
          <div className="text-xs font-medium text-pass">Copy this now — it won&apos;t be shown again</div>
          <code className="mt-2 block break-all font-mono text-sm text-signal-white">{freshKey}</code>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <Field label="Key name (e.g. production backend)" type="text" value={name} onChange={setName} required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create key"}
        </Button>
      </form>
      {error && <p className="text-sm text-block">{error}</p>}

      <ul className="flex flex-col gap-2">
        {keys.map((key) => (
          <li key={key.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-card p-4">
            <div>
              <div className="text-sm text-signal-white">{key.name}</div>
              <div className="mt-1 font-mono text-xs text-signal-muted">
                {key.key_prefix}… · created {timeAgo(key.created_at)}
                {key.revoked_at && " · revoked"}
              </div>
            </div>
            {!key.revoked_at && (
              <Button variant="ghost" onClick={() => revoke(key.id)}>
                Revoke
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
