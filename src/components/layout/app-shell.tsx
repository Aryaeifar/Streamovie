"use client";

import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t.nav.skipToContent}
      </a>
      <SiteHeader />
      <main id="content" className={cn("flex-1", className)}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
