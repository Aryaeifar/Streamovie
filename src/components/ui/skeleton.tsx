import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-sheen rounded-xl bg-white/[0.04]", className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-white/20 border-t-brand-400",
        className,
      )}
    />
  );
}
