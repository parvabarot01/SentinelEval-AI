"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema } from "@/lib/validation/auth";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AuthShell, Field } from "@/components/ui/AuthShell";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = signUpSchema.safeParse({ email, password, orgName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setPending(false);
      return;
    }

    if (!data.session) {
      // email confirmation is required before a session exists — the org gets
      // created on first login instead (see /onboarding).
      setConfirmEmailSent(true);
      setPending(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc("create_organization", {
      org_name: parsed.data.orgName,
      org_slug: slugify(parsed.data.orgName),
    });

    if (rpcError) {
      setError(rpcError.message);
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (confirmEmailSent) {
    return (
      <AuthShell title="Check your inbox">
        <p className="text-sm text-signal-muted">
          We sent a confirmation link to <span className="text-signal-white">{email}</span>. Confirm your email,
          then <Link href="/login" className="text-block hover:underline">log in</Link> to finish setting up{" "}
          {orgName}.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Work email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
        <Field label="Organization name" type="text" value={orgName} onChange={setOrgName} required />
        {error && <p className="text-sm text-block">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-signal-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-block hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
