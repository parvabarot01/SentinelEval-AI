"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createOrgSchema } from "@/lib/validation/auth";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AuthShell, Field } from "@/components/ui/AuthShell";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = createOrgSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("create_organization", {
      org_name: parsed.data.name,
      org_slug: slugify(parsed.data.name),
    });

    if (rpcError) {
      setError(rpcError.message);
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell title="Create an organization">
      <p className="mb-4 text-sm text-signal-muted">
        Organizations keep your datasets, suites, and eval history separate from every other team on SentinelEval.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Organization name" type="text" value={name} onChange={setName} required />
        {error && <p className="text-sm text-block">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Creating…" : "Create organization"}
        </Button>
      </form>
    </AuthShell>
  );
}
