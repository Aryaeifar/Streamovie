# Streamovie Mobile

React Native app for Android phones and Android TV, built with the `react-native-tvos` distribution.

## Run on Android

Requirements: Node 20 or newer, pnpm, Android Studio, Android SDK Platform 36, Android SDK Build-Tools 36.0.0, and JDK 17.

1. In Android Studio, open `mobile/android/` and allow Gradle sync.
2. In a terminal, from this `mobile/` folder, run `pnpm install` once and `pnpm android` to launch on a connected phone or emulator.
3. To build a standalone release APK, run `pnpm build:android`. The APK appears at `android/app/build/outputs/apk/release/app-release.apk`.

The same app build declares phone and Android TV launchers. Use an Android TV virtual device to check remote navigation and the large-screen layout.

The mobile app reads `NEXT_PUBLIC_STREAMOVIE_API_KEY` from the project root `.env` when you run `pnpm start`, `pnpm android`, or `pnpm build:android`. Run `pnpm sync-env` after changing `.env` before building directly from Android Studio. The catalog key is included in the APK, just as a `NEXT_PUBLIC_` key is included in the web client; do not put server-only secrets such as `OMDB_API_KEY` in the mobile app.
