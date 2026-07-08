import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-block text-canvas-deep font-semibold hover:brightness-110 active:brightness-95",
  secondary:
    "bg-white/10 text-signal-white backdrop-blur-sm hover:bg-white/15 border border-white/10",
  ghost: "text-signal-muted hover:text-signal-white hover:bg-white/5",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-[background-color,filter] duration-150 ease-out disabled:opacity-40 disabled:pointer-events-none";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={cn(BASE, VARIANT_CLASSES[variant], className)} {...props} />;
}

interface LinkButtonProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
}

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={cn(BASE, VARIANT_CLASSES[variant], className)} {...props} />;
}
