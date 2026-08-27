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

## Aan de slag

Zie [`SETUP.md`](./SETUP.md) voor de volledige (eenmalige, gratis) setup:
een Supabase-project aanmaken, het schema uitrollen, en de app starten via
Expo Go.

```bash
npm install
npx expo start
```

## Techniek

- **App**: Expo + React Native + TypeScript, file-based routing via `expo-router`.
- **Backend**: [Supabase](https://supabase.com) (Postgres, auth, Row Level Security, Edge Functions) — gratis tier, geen eigen server.
- **Data**: `@tanstack/react-query` + de Supabase JS-client.

Belangrijkste mappen:
- `src/app` — schermen (file-based routing)
- `src/lib` — Supabase-client, auth, React Query hooks
- `supabase/schema.sql` — databaseschema + Row Level Security
- `supabase/functions/extract-recipe` — Edge Function die recepten uit een link haalt
