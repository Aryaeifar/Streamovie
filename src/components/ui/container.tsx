import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Constrains content to the app's max width with consistent gutters. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}
