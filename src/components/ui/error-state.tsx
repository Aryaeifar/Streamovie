"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel: string;
  className?: string;
  compact?: boolean;
};

export function ErrorState({ title, description, onRetry, retryLabel, className, compact }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-danger-500/25 bg-danger-500/[0.07] p-4",
        compact && "items-center",
        className,
      )}
      role="alert"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-danger-500/15 text-danger-400">
        <AlertTriangle className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-fog-100">{title}</p>
        {description ? <p className="mt-0.5 text-sm text-fog-400">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} className="shrink-0">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
