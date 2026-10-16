"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Locale; label: string; short: string }[] = [
  { value: "en", label: "English", short: "EN" },
  { value: "fa", label: "فارسی", short: "فا" },
];

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn("inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-0.5", className)}
    >
      <Languages className="ms-2 hidden size-3.5 text-fog-400 sm:block" />
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLocale(option.value)}
          aria-pressed={locale === option.value}
          aria-label={option.label}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold transition",
            locale === option.value ? "bg-white/90 text-ink-950" : "text-fog-300 hover:text-white",
          )}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}
