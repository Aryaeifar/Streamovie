import axios from "axios";

export const apiHosts = [
  process.env.NEXT_PUBLIC_STREAMOVIE_API_HOST ?? "https://server-hi-speed-iran.info",
  process.env.NEXT_PUBLIC_STREAMOVIE_HELPER_HOST_1 ?? "https://hostinnegar.com",
  process.env.NEXT_PUBLIC_STREAMOVIE_HELPER_HOST_2 ?? "https://windowsdiba.info",
];

export const apiKey = process.env.NEXT_PUBLIC_STREAMOVIE_API_KEY ?? "";

export async function requestWithFallback<T>(path: string): Promise<T> {
  let lastError: unknown;

  for (const host of apiHosts) {
    try {
      const response = await axios.get<T>(`${host}${path}`, { timeout: 15_000 });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to reach the Streamovie API");
}

export function requireApiKey() {
  if (!apiKey) throw new Error("Missing NEXT_PUBLIC_STREAMOVIE_API_KEY environment variable");
  return apiKey;
}
