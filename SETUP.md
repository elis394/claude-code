# Setup

Eenmalige stappen om de app draaiende te krijgen. Alles hieronder is gratis
(Supabase free tier + Expo Go), en er is geen eigen server om te
onderhouden.

## 1. Supabase-project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak (gratis) een account + nieuw project aan.
2. Wacht tot het project klaar is, ga dan naar **Project Settings → API** en noteer:
   - **Project URL**
   - **anon public key**
3. Ga naar **Authentication → Providers** en zorg dat "Email" ingeschakeld staat (standaard aan). Voor de MVP kun je onder **Authentication → Settings** *"Confirm email"* uitschakelen, zodat registreren meteen inlogt zonder bevestigingsmail — handig voor een klein huishouden-project.

## 2. Databaseschema uitrollen

1. Open in het Supabase dashboard **SQL Editor**.
2. Plak de volledige inhoud van [`supabase/schema.sql`](./supabase/schema.sql) en voer uit.
   Dit maakt alle tabellen, de `create_household`/`join_household` functies en de Row Level Security-policies aan die ervoor zorgen dat een huishouden alleen zijn eigen data ziet.

## 3. Edge Function deployen (automatisch recept ophalen via een link)

Vereist de [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`, of `npx supabase`).

```bash
npx supabase login
npx supabase link --project-ref <jouw-project-ref>   # te vinden in de project-URL
npx supabase functions deploy extract-recipe
```

Zonder deze stap werkt de rest van de app gewoon, maar dan moet elk recept
handmatig ingevuld worden (de "Ophalen"-knop bij een link toevoegen faalt dan).

## 4. Env-variabelen instellen

```bash
cp .env.example .env
```

Vul in `.env` de **Project URL** en **anon key** van stap 1 in.

## 5. App starten

```bash
npm install
npx expo start
```

Scan de QR-code met de [Expo Go](https://expo.dev/go) app op je telefoon (Android: camera of Expo Go zelf; iOS: via de Camera-app). Doe dit op beide telefoons — jullie werken in dezelfde app tegen hetzelfde Supabase-project.

## 6. Huishouden koppelen

1. Registreer een account op de eerste telefoon → kies **"Nieuw huishouden"** en geef het een naam.
2. Ga naar de **Account**-tab en kopieer de uitnodigingscode.
3. Registreer op de tweede telefoon een eigen account → kies **"Huishouden joinen"** en vul de code in.

Jullie zien vanaf nu dezelfde recepten en boodschappenlijst.

## Kanttekeningen

- Automatische import werkt het best bij receptensites met gestructureerde
  data (schema.org/Recipe) en redelijk goed bij YouTube/TikTok/Instagram via
  titel + thumbnail + bijschrift — maar is altijd best-effort. Het
  formulier is na het ophalen altijd volledig bewerkbaar.
- Dit is de MVP: recepten + boodschappenlijst uit geselecteerde recepten. De
  weekkalender (recepten per dag inplannen) staat gepland als vervolgstap,
  zie het "Fase 2"-gedeelte in de planningsnotities.
