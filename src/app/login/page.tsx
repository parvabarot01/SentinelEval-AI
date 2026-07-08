"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/Button";
import { AuthShell, Field } from "@/components/ui/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

    if (signInError) {
      setError(signInError.message);
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell title="Log in">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Work email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        {error && <p className="text-sm text-block">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-signal-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-block hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
