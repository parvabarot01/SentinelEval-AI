"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface DetailSheetProps {
  title: string;
  children: ReactNode;
}

/**
 * Modal-over-scrim on desktop; on mobile this same route renders full-bleed
 * (no `fixed inset` wrapper needed there since the page itself IS the detail
 * view — see app/(app)/runs/[id]/page.tsx for how it's composed as a
 * parallel/intercepting route in a later pass; for now this always renders
 * as an overlay, which degrades gracefully to full-screen on small viewports).
 */
export function DetailSheet({ title, children }: DetailSheetProps) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-canvas-deep/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
        onClick={() => router.back()}
      />
      <div className="relative flex h-full w-full flex-col overflow-y-auto bg-surface-card p-6 shadow-2xl sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-2xl sm:rounded-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-medium text-signal-white">{title}</h2>
          <button
            onClick={() => router.back()}
            className="rounded-md p-1.5 text-signal-muted hover:bg-white/5 hover:text-signal-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
