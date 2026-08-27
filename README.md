# Receptenplanner

Een mobiele app (Expo/React Native) om recepten bij te houden — van
receptenwebsites, YouTube, TikTok of Instagram — en er samen met je
huishouden een boodschappenlijst uit te genereren.

**MVP-functies:**
- Recepten toevoegen via een link (titel/ingrediënten/stappen/afbeelding
  waar mogelijk automatisch ingevuld) of volledig handmatig.
- Boodschappenlijst genereren op basis van zelf geselecteerde recepten,
  met samengevoegde hoeveelheden per ingrediënt.
- Gedeeld huishouden: jij en je partner loggen elk apart in en zien
  dezelfde recepten en lijst.

Een weekkalender om recepten per dag in te plannen staat gepland als
vervolgstap.

De app draait ook als website (dezelfde Supabase-backend), gehost gratis
via GitHub Pages op **https://elis394.github.io/claude-code/** — open die
link in Safari op je iPhone en kies "Zet op beginscherm" om hem als app te
gebruiken, zonder computer of Apple Developer-account.

## Aan de slag

Zie [`SETUP.md`](./SETUP.md) voor de volledige (eenmalige, gratis) setup:
een Supabase-project aanmaken, het schema uitrollen, en de GitHub
Pages-versie of de native app opzetten — alles kan vanaf je telefoon.

```bash
npm install
npx expo start        # native app, met Expo Go
npx expo export --platform web   # statische webversie (wat GitHub Pages host)
```

## Techniek

- **App**: Expo + React Native + TypeScript, file-based routing via `expo-router` (web-output: client-side "single" mode, geen SSR — nodig omdat de Supabase-auth-client alleen in de browser initialiseert).
- **Backend**: [Supabase](https://supabase.com) (Postgres, auth, Row Level Security, Edge Functions) — gratis tier, geen eigen server.
- **Data**: `@tanstack/react-query` + de Supabase JS-client.
- **Hosting (web)**: GitHub Pages, automatisch gebouwd en gepubliceerd via `.github/workflows/deploy-web.yml`.

Belangrijkste mappen:
- `src/app` — schermen (file-based routing)
- `src/lib` — Supabase-client, auth, React Query hooks, `alert.ts` (cross-platform alert/confirm, want react-native-web's `Alert` doet niets)
- `supabase/schema.sql` — databaseschema + Row Level Security
- `supabase/functions/extract-recipe` — Edge Function die recepten uit een link haalt
- `.github/workflows/deploy-web.yml` — bouwt en publiceert de webversie naar GitHub Pages
