"use client";

import { useCallback, useEffect, useRef } from "react";
import { Check, Settings, X } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import type { Locale } from "@/i18n/config";
import { themeSwatches, themes, type ThemeId } from "@/lib/themes";
import { useUIStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/utils";

const LANGUAGES: { value: Locale; labelKey: "english" | "persian" }[] = [
  { value: "en", labelKey: "english" },
  { value: "fa", labelKey: "persian" },
];

export function SettingsLauncher() {
  const { t } = useI18n();
  const locale = useUIStore((state) => state.locale);
  const setLocale = useUIStore((state) => state.setLocale);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  const open = useUIStore((state) => state.settingsOpen);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setSettingsOpen(false);
    const opener = openerRef.current;
    if (opener && opener.isConnected) opener.focus();
    else triggerRef.current?.focus();
  }, [setSettingsOpen]);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setSettingsOpen(true)}
        aria-label={t.settings.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed end-0 top-1/2 z-40 flex -translate-y-1/2 items-center justify-center rounded-s-2xl border border-e-0 border-white/10 bg-ink-850/90 px-2.5 py-3 text-fog-300 shadow-[var(--shadow-lift)] backdrop-blur-xl transition hover:bg-ink-800 hover:text-white lg:hidden"
      >
        <Settings className="size-5" />
      </button>

      <div
        onClick={close}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[60] bg-ink-950/70 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.settings.title}
        inert={!open}
        className={cn(
          "fixed inset-y-0 end-0 z-[70] flex w-[min(22rem,90vw)] flex-col border-s border-white/10 bg-ink-900/95 shadow-[var(--shadow-lift)] backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-magenta-500 text-white">
              <Settings className="size-[18px]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-fog-50">{t.settings.title}</h2>
              <p className="text-xs text-fog-400">{t.settings.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t.settings.close}
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-fog-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-fog-500">
              {t.common.language}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((option) => {
                const active = locale === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    data-locale-option={option.value}
                    onClick={() => setLocale(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition",
                      active
                        ? "border-brand-400/60 bg-brand-500/15 text-white"
                        : "border-white/10 bg-white/5 text-fog-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span>{t.common[option.labelKey]}</span>
                    {active ? <Check className="size-4 text-brand-300" /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-fog-500">
              {t.settings.theme}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {themes.map((id: ThemeId) => {
                const swatch = themeSwatches[id];
                const active = theme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    data-theme-option={id}
                    onClick={() => setTheme(id)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2 text-start transition",
                      active
                        ? "border-brand-400/60 bg-white/[0.06]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
                    )}
                  >
                    <span
                      className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-white/10"
                      style={{ backgroundColor: swatch.surface }}
                    >
                      <span
                        className="absolute inset-0"
                        style={{ backgroundImage: `linear-gradient(135deg, ${swatch.from}, ${swatch.to})` }}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-fog-100">
                      {t.settings.themes[id]}
                    </span>
                    {active ? <Check className="size-4 shrink-0 text-brand-300" /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
