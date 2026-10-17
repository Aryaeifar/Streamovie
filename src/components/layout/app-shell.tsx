"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useI18n } from "@/hooks/use-i18n";
import { useUIStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/utils";

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  const { t } = useI18n();
  const collapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-dvh flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-out lg:pb-0",
          collapsed ? "lg:ps-20" : "lg:ps-[280px]",
        )}
      >
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
      <BottomNav />
    </div>
  );
}
