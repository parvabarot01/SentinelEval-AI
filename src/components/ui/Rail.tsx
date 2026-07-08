import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RailProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

/** Horizontal scroll-snap row — the core browse pattern of the app. */
export function Rail({ title, action, children, emptyMessage, isEmpty }: RailProps) {
  return (
    <section className="fade-up-enter">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-medium text-signal-white">{title}</h2>
        {action}
      </div>
      {isEmpty ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-8 text-center text-sm text-signal-muted">
          {emptyMessage ?? "Nothing here yet."}
        </div>
      ) : (
        <div className="rail-scroll flex gap-4 overflow-x-auto pb-2">{children}</div>
      )}
    </section>
  );
}

export function RailCard({
  href,
  accentClassName,
  children,
  className,
}: {
  href?: string;
  accentClassName: string;
  children: ReactNode;
  className?: string;
}) {
  const Comp = href ? "a" : "div";
  return (
    <Comp
      {...(href ? { href } : {})}
      className={cn(
        "group w-64 flex-shrink-0 rounded-lg border-t-2 bg-surface-card p-4",
        "transition-[transform,box-shadow,filter] duration-[180ms] ease-out",
        "hover:z-10 hover:scale-[1.04] hover:shadow-xl hover:shadow-black/40 hover:brightness-110",
        accentClassName,
        className,
      )}
    >
      {children}
    </Comp>
  );
}
