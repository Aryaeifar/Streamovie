import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { defaultLocale } from "@/i18n/config";
import { getDirection } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Streamovie — Movies & Series",
    template: "%s · Streamovie",
  },
  description: "Browse and discover movies and series — posters, ratings, seasons and downloads.",
  applicationName: "Streamovie",
};

export const viewport: Viewport = {
  themeColor: "#06060b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={defaultLocale} dir={getDirection(defaultLocale)} suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
