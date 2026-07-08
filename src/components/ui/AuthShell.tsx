import type { ReactNode } from "react";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/5 bg-surface-card p-8">
        <div className="mb-6 font-display text-lg font-medium text-block">SentinelEval</div>
        <h1 className="mb-6 text-xl font-medium text-signal-white">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-signal-muted">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-white/10 bg-surface-raised px-3 py-2 text-signal-white outline-none focus-visible:border-block"
      />
    </label>
  );
}
