import { CountryView } from "@/components/countries/country-view";

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: countryId } = await params;
  return <CountryView countryId={Number(countryId)} />;
}
