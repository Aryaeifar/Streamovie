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

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local development server. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint. |

## React Native Android app

The React Native app is in `mobile/` and uses the maintained React Native TV distribution so one app can support Android phones and Android TV. It includes catalog browsing, search, saved titles, title details, seasons, episodes, and source links, with remote focus states and a TV launcher banner.

Install the Java 17 JDK recommended by React Native, then open `mobile/android/` in Android Studio and let Gradle sync. From a terminal, run `pnpm install` in `mobile/`; use `pnpm android` to run on a connected phone or emulator. To create a standalone release APK, run `pnpm build:android` from `mobile/`. The APK is written to `mobile/android/app/build/outputs/apk/release/app-release.apk`. The mobile build reads `NEXT_PUBLIC_STREAMOVIE_API_KEY` from the project root `.env`; the key is embedded in the APK and should be treated as public. Keep server-only credentials such as `OMDB_API_KEY` out of mobile builds.

On first launch, enter the catalog API key. The app keeps it in local app storage and sends it with catalog requests. Because the app calls the catalog API directly, the key can be extracted from a device by a determined user; use a server-side proxy for a production secret.

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
