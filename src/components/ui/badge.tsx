import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide",
  {
    variants: {
      variant: {
        solid: "border-transparent bg-gradient-to-r from-brand-500 to-magenta-500 text-white",
        soft: "border-white/10 bg-white/[0.06] text-fog-200 backdrop-blur",
        outline: "border-white/20 text-fog-200",
        gold: "border-gold-400/30 bg-gold-400/10 text-gold-300",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[11px]",
        md: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "soft", size: "md" },
  },
);

export function Badge({
  className,
  variant,
  size,
  children,
}: VariantProps<typeof badgeVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeVariants({ variant, size }), className)}>{children}</span>;
}
