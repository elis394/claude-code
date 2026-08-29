// Learn more https://docs.expo.dev/router/reference/static-rendering/#root-html

import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  // This is only required for server-side rendering.
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();

  // Matches the EXPO_BASE_URL used in .github/workflows/deploy-web.yml so
  // links resolve correctly under GitHub Pages' /claude-code subpath, and
  // stay correct (empty) for local dev.
  const baseUrl = process.env.EXPO_BASE_URL ?? '';

  return (
    <html lang="nl" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* The app's type scale (see constants/theme.ts) references these
            families via the --font-display CSS variable in global.css —
            without loading them, web silently falls back to the system
            font and the app loses its typographic identity. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Spline+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* "Zet op beginscherm" on iOS: opens without the Safari address bar,
            with its own name/icon/theme color, so it feels like a real app. */}
        <link rel="manifest" href={`${baseUrl}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${baseUrl}/icon.png`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Receptenplanner" />
        <meta name="theme-color" content="#D9552E" />

        {headNodes}

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
