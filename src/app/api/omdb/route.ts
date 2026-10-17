import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OMDB_API_KEY is not configured. Add it to .env.local and restart the app." }, { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const title = params.get("title")?.trim();
  const imdbId = params.get("imdbId")?.trim();
  const season = params.get("season")?.trim();
  if (!title && !imdbId) return NextResponse.json({ error: "A title or IMDb ID is required." }, { status: 400 });
  if (season && (!/^\d+$/.test(season) || Number(season) < 0 || Number(season) > 100)) {
    return NextResponse.json({ error: "Season must be a valid non-negative number." }, { status: 400 });
  }

  const upstream = new URL("https://www.omdbapi.com/");
  upstream.searchParams.set("apikey", apiKey);
  upstream.searchParams.set("type", "series");
  upstream.searchParams.set("plot", "full");
  upstream.searchParams.set("r", "json");
  if (imdbId) upstream.searchParams.set("i", imdbId);
  else upstream.searchParams.set("t", title!);
  if (season) upstream.searchParams.set("Season", season);
  const year = params.get("year");
  if (year && /^\d{4}$/.test(year)) upstream.searchParams.set("y", year);

  try {
    const response = await fetch(upstream, { next: { revalidate: 86_400 } });
    if (!response.ok) return NextResponse.json({ error: `OMDb returned ${response.status}.` }, { status: response.status });
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return NextResponse.json({ error: "OMDb is temporarily unavailable." }, { status: 502 });
  }
}
