import type { Metadata } from "next";
import { CountriesView } from "@/components/countries/countries-view";
import en from "@/i18n/dictionaries/en";

export const metadata: Metadata = {
  title: en.countries.title,
  description: en.countries.subtitle,
};

export default function CountriesPage() {
  return <CountriesView />;
}
