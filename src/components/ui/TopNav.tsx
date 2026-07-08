"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { OrgMembership } from "@/lib/current-org";

const NAV_ITEMS = [
  { href: "/features", label: "Features" },
  { href: "/suites", label: "Suites" },
  { href: "/runs", label: "Runs" },
  { href: "/review", label: "Review" },
  { href: "/guardrails", label: "Guardrails" },
  { href: "/governance", label: "Governance" },
];

interface TopNavProps {
  memberships: OrgMembership[];
  currentOrgId?: string;
  userEmail?: string | null;
}

/** Transparent over the hero, gains a solid canvas background on scroll. */
export function TopNav({ memberships, currentOrgId, userEmail }: TopNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function onSwitchOrg(orgId: string) {
    await fetch("/api/org/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    });
    router.refresh();
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled ? "bg-canvas/95 backdrop-blur-sm border-b border-white/5" : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-lg font-medium text-block">
            SentinelEval
          </Link>
          <div className="hidden gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm transition-colors duration-150",
                    active ? "text-signal-white" : "text-signal-muted hover:text-signal-white",
                  )}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-block" />}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-signal-muted">
          {memberships.length > 0 && (
            <select
              value={currentOrgId}
              onChange={(e) => onSwitchOrg(e.target.value)}
              className="hidden rounded-md border border-white/10 bg-surface-raised px-2 py-1.5 text-signal-white sm:block"
            >
              {memberships.map((m) => (
                <option key={m.orgId} value={m.orgId}>
                  {m.orgName}
                </option>
              ))}
            </select>
          )}
          {userEmail && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-xs font-medium text-signal-white">
              {userEmail.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}
