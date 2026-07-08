import { cn, type Verdict } from "@/lib/utils";
import { VerdictChip } from "./VerdictChip";
import { LinkButton } from "./Button";

interface HeroBillboardProps {
  eyebrow: string;
  headline: string;
  supporting: string;
  verdict: Verdict;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

/**
 * Spotlights the single most important current item — always answers
 * "what needs my attention right now," never a generic welcome message.
 */
export function HeroBillboard({
  eyebrow,
  headline,
  supporting,
  verdict,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: HeroBillboardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-8 py-14 sm:px-12 sm:py-20"
      style={{ background: "linear-gradient(90deg, #141B2E, #0B0E14)" }}
    >
      <div className="fade-up-enter relative max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <VerdictChip verdict={verdict} />
          <span className="text-xs uppercase tracking-wide text-signal-muted">{eyebrow}</span>
        </div>
        <h1 className="font-display text-3xl font-medium leading-tight text-signal-white sm:text-4xl">
          {headline}
        </h1>
        <p className="mt-4 max-w-lg text-[15px] text-signal-muted">{supporting}</p>
        <div className={cn("mt-8 flex items-center gap-3")}>
          <LinkButton href={primaryHref} variant="primary">
            {primaryLabel}
          </LinkButton>
          {secondaryHref && secondaryLabel && (
            <LinkButton href={secondaryHref} variant="secondary">
              {secondaryLabel}
            </LinkButton>
          )}
        </div>
      </div>
    </div>
  );
}
