"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/hooks/use-i18n";
import { isNavActive, mobileNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = mobileNav(t);

  return (
    <nav
      aria-label={t.nav.menu}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
                active ? "text-white" : "text-fog-400 hover:text-fog-200",
              )}
            >
              {active ? (
                <span className="absolute top-0 h-0.5 w-9 rounded-full bg-gradient-to-r from-brand-400 to-magenta-500" />
              ) : null}
              <Icon className={cn("size-5", active && "text-brand-300")} />
              <span className="max-w-full truncate px-0.5 leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
