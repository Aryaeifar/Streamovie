import type { Metadata } from "next";
import { LiveTvView } from "@/components/live-tv/live-tv-view";
import en from "@/i18n/dictionaries/en";

export const metadata: Metadata = {
  title: en.liveTv.title,
  description: en.liveTv.subtitle,
};

export default function LiveTvPage() {
  return <LiveTvView />;
}
