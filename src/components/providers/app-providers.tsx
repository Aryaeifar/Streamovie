"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { PreferencesHydrator } from "@/components/providers/preferences-hydrator";
import { SettingsLauncher } from "@/components/layout/settings-launcher";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesHydrator />
      <SettingsLauncher />
      {children}
    </QueryClientProvider>
  );
}
