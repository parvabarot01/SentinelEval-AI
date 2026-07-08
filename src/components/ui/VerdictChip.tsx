import { cn, type Verdict } from "@/lib/utils";

const VERDICT_STYLES: Record<Verdict, { label: string; classes: string }> = {
  pass: { label: "Pass", classes: "bg-pass/15 text-pass border-pass/30" },
  watch: { label: "Watch", classes: "bg-watch/15 text-watch border-watch/30" },
  block: { label: "Blocked", classes: "bg-block/15 text-block border-block/30" },
  pending: { label: "Pending", classes: "bg-white/5 text-signal-muted border-white/10" },
};

export function VerdictChip({ verdict, label }: { verdict: Verdict; label?: string }) {
  const style = VERDICT_STYLES[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style.classes,
      )}
    >
      {label ?? style.label}
    </span>
  );
}

export function verdictBorderClass(verdict: Verdict): string {
  return { pass: "border-t-pass", watch: "border-t-watch", block: "border-t-block", pending: "border-t-white/10" }[
    verdict
  ];
}

export function verdictTextClass(verdict: Verdict): string {
  return { pass: "text-pass", watch: "text-watch", block: "text-block", pending: "text-signal-muted" }[verdict];
}
