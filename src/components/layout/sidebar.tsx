"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Clapperboard, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { isNavActive, sidebarNav } from "@/lib/navigation";
import { useUIStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);
  const sections = sidebarNav(t);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-50 hidden flex-col overflow-hidden border-e border-white/[0.06] bg-ink-950/70 backdrop-blur-2xl transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-20" : "w-[280px]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          backgroundImage:
            "radial-gradient(130% 70% at 50% 0%, rgb(var(--theme-glow-1) / 0.20), transparent 72%)",
        }}
      />

      <div className="relative flex h-16 shrink-0 items-center px-4">
        <Link
          href="/"
          aria-label={t.brand.name}
          className={cn("flex min-w-0 items-center gap-2.5", collapsed && "mx-auto")}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-magenta-500 text-white shadow-lg shadow-brand-700/30">
            <Clapperboard className="size-5" />
          </span>
          {!collapsed ? (
            <span className="truncate text-base font-extrabold tracking-tight text-fog-50">
              {t.brand.name}
            </span>
          ) : null}
        </Link>

        {!collapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={t.nav.collapseSidebar}
            className="ms-auto inline-flex size-8 items-center justify-center rounded-lg text-fog-500 transition hover:bg-white/5 hover:text-white"
          >
            <PanelLeftClose className="size-[18px] rtl:-scale-x-100" />
          </button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="relative flex shrink-0 justify-center pb-1">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={t.nav.expandSidebar}
            className="inline-flex size-8 items-center justify-center rounded-lg text-fog-500 transition hover:bg-white/5 hover:text-white"
          >
            <PanelLeftOpen className="size-[18px] rtl:-scale-x-100" />
          </button>
        </div>
      ) : null}

      <nav aria-label={t.nav.menu} className="no-scrollbar relative flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section, index) => (
          <div key={section.label}>
            {!collapsed ? (
              <p
                className={cn(
                  "px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fog-500",
                  index === 0 ? "pt-2" : "pt-4",
                )}
              >
                {section.label}
              </p>
            ) : index > 0 ? (
              <div className="mx-auto my-2 h-px w-8 bg-white/[0.06]" />
            ) : null}

            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group/item relative flex h-12 items-center rounded-2xl text-sm font-semibold transition",
                      collapsed ? "justify-center" : "gap-3 px-2.5",
                      active ? "text-white" : "text-fog-300 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-500 to-magenta-500 shadow-[0_14px_34px_-14px_var(--color-brand-500)]"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative flex size-9 shrink-0 items-center justify-center rounded-xl transition",
                        active
                          ? "bg-white/15 text-white"
                          : "bg-white/[0.04] text-fog-300 group-hover/item:bg-white/10 group-hover/item:text-white",
                      )}
                    >
                      <Icon className="size-[18px]" />
                    </span>
                    {!collapsed ? <span className="relative truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative shrink-0 border-t border-white/[0.06] p-3">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          title={collapsed ? t.settings.title : undefined}
          className={cn(
            "group/item flex h-12 w-full items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-sm font-semibold text-fog-200 transition hover:border-white/10 hover:bg-white/[0.07] hover:text-white",
            collapsed ? "justify-center" : "gap-3 px-2.5",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-fog-300 transition group-hover/item:text-white">
            <Settings className="size-[18px]" />
          </span>
          {!collapsed ? (
            <>
              <span className="truncate">{t.settings.title}</span>
              <ChevronRight className="ms-auto size-4 text-fog-500 rtl:rotate-180" />
            </>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
