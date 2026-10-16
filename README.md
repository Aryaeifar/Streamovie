# Streamovie

**A modern, bilingual movie and series discovery experience.**

Streamovie is a web app for exploring a movie and series catalog, viewing title details, searching, and saving titles to a personal bookmark list. It connects to the Streamovie catalog API for media data and source links.

> **Project status:** The web app is under active development. Native releases for macOS, iOS, Android, and other desktop platforms are planned; they are not available yet.

## Features

- Browse featured titles, movies, and series from the live catalog API.
- Search the catalog and view title details, metadata, seasons, episodes, and source links when provided by the API.
- Save and remove bookmarks; the list is stored locally in the browser.
- Switch between English and Persian, with right-to-left support for Persian.
- Use the responsive interface on desktop and mobile browsers.
- Retry catalog requests when a service or network error occurs.

Catalog contents and available links depend on the configured API and may change over time.

## Technology

- [Next.js](https://nextjs.org/) 15 and [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query/latest) for server data and caching
- [Zustand](https://zustand.docs.pmnd.rs/) for client-side state
- [Axios](https://axios-http.com/) for API requests

## Getting started

### Requirements

- Node.js 20 or newer
- pnpm
- A Streamovie catalog API key

### Install and run

```bash
git clone <your-repository-url>
cd Streamovie
pnpm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_STREAMOVIE_API_KEY` in `.env.local` to an API key issued for your use. Then start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_STREAMOVIE_API_KEY` | Yes | Key used by the browser to request catalog data. |
| `NEXT_PUBLIC_STREAMOVIE_API_HOST` | No | Primary API host override. Defaults to `https://server-hi-speed-iran.info`. |
| `NEXT_PUBLIC_STREAMOVIE_HELPER_HOST_1` | No | First fallback API host. Defaults to `https://hostinnegar.com`. |
| `NEXT_PUBLIC_STREAMOVIE_HELPER_HOST_2` | No | Second fallback API host. Defaults to `https://windowsdiba.info`. |

The app tries the configured hosts in order. Because variables prefixed with `NEXT_PUBLIC_` are included in the browser bundle, the API key is visible to users of a deployed site. Use a key intended for client-side use, restrict it where the API provider allows, and rotate it if it is exposed. Never commit a real key or put a private server credential in a `NEXT_PUBLIC_` variable.

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local development server. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint. |

## Project layout

```text
src/
├── app/           # Next.js routes and global styles
├── components/    # Layout, media, and reusable UI components
├── hooks/         # Data and interface hooks
├── i18n/          # English and Persian dictionaries
├── lib/           # API client, media helpers, and query keys
└── stores/        # Local UI, bookmark, and selected-media state
```

## Roadmap

- Continue improving the web experience and accessibility.
- Prepare app releases for macOS, iOS, and Android.
- Explore packaging for additional desktop platforms.

These are plans; no release dates or platform downloads are available yet.

## Acknowledgments

Streamovie was inspired in part by [CCloud-GUI](https://github.com/code3-dev/CCloud-GUI). Thank you to **Hossein Pira (`code3-dev`)** for creating and sharing the project as a reference for a Persian-focused media app. Streamovie is an independent project and is not affiliated with CCloud-GUI or its publisher.

## Content and source links

Streamovie displays catalog information and source links returned by its configured third-party API. The app does not claim ownership of third-party media or guarantee the availability, accuracy, or rights status of external content or links. Users are responsible for following applicable laws and the terms of the services they access.

## Contributing

Contributions, bug reports, and suggestions are welcome. Please open an issue to discuss a substantial change before submitting a pull request. Include a clear description of the change and any relevant screenshots or reproduction steps.

## License

No license has been specified for this repository yet. Until a license is added, all rights are reserved by the project owner; public availability on GitHub does not by itself grant permission to reuse or redistribute the code.
