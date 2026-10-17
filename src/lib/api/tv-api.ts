import axios from "axios";

const COUNTRIES_URL =
  "https://raw.githubusercontent.com/famelack/famelack-data/main/tv/raw/countries_metadata.json";
const COUNTRY_CHANNELS_URL =
  "https://raw.githubusercontent.com/famelack/famelack-data/main/tv/raw/countries";

export type TVCountryMetadata = {
  country: string;
  hasChannels: boolean;
};

export type TVCountry = TVCountryMetadata & { code: string };

export type TVChannel = {
  nanoid?: string;
  name: string;
  sources?: {
    streams?: string[];
    youtube?: string[];
  };
  languages?: string[];
  // Keep support for the previous TV Garden feed shape during the transition.
  iptv_urls?: string[];
  youtube_urls?: string[];
  language?: string;
  country?: string;
  isGeoBlocked?: boolean;
  logo?: string;
  logo_url?: string;
  [key: string]: unknown;
};

export const tvApi = {
  async fetchCountries(): Promise<TVCountry[]> {
    const { data } = await axios.get<Record<string, TVCountryMetadata>>(COUNTRIES_URL, { timeout: 15_000 });
    return Object.entries(data)
      .filter(([, country]) => country?.hasChannels && Boolean(country.country))
      .map(([code, country]) => ({ code: code.toUpperCase(), ...country }))
      .sort((left, right) => left.country.localeCompare(right.country));
  },

  async fetchChannels(countryCode: string): Promise<TVChannel[]> {
    const code = countryCode.toLowerCase();
    if (!/^[a-z]{2,3}$/.test(code)) throw new Error("Invalid country code");
    const { data } = await axios.get<TVChannel[]>(`${COUNTRY_CHANNELS_URL}/${code}.json`, { timeout: 15_000 });
    return Array.isArray(data) ? data.filter((channel) => channel && channel.name) : [];
  },
};
