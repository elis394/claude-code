# Setup

Eenmalige stappen om de app draaiende te krijgen. Alles hieronder is gratis
en werkt **volledig vanaf je telefoon** (via mobiele browsers naar Supabase
en GitHub) — er is geen eigen server om te onderhouden en geen computer
nodig.

## 1. Supabase-project

Als je dit nog niet deed: ga naar [supabase.com](https://supabase.com), maak
een gratis account + project aan, en noteer onder **Project Settings → API**
de **Project URL** en **anon public key**.

Ga naar **Authentication → Sign In / Providers → Email** en zet
*"Confirm email"* uit, zodat registreren meteen inlogt zonder bevestigingsmail.

## 2. Databaseschema uitrollen

1. Open in het Supabase dashboard (werkt prima in de mobiele browser) de
   **SQL Editor**.
2. Plak de volledige inhoud van [`supabase/schema.sql`](./supabase/schema.sql) en voer uit.
   Dit maakt alle tabellen, de `create_household`/`join_household` functies
   en de Row Level Security-policies aan die ervoor zorgen dat een
   huishouden alleen zijn eigen data ziet.

## 3. De app hosten via GitHub Pages (dagelijks gebruik, geen computer nodig)

Dit bouwt de app als website en publiceert die gratis via GitHub Pages. Je
zet hem daarna op je iPhone-beginscherm ("Zet op beginscherm") zodat hij
aanvoelt als een gewone app — zonder Apple Developer-account.

Eenmalig instellen, in de GitHub-app of mobiele browser op
`github.com/elis394/claude-code`:

1. **Settings → Secrets and variables → Actions → New repository secret**:
   - `EXPO_PUBLIC_SUPABASE_URL` = je Project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = je anon key
2. **Settings → Pages** → onder "Build and deployment" → **Source: GitHub Actions**.
3. Ga naar het tabblad **Actions** → workflow **"Deploy web build to GitHub Pages"** → **Run workflow** (als hij niet al automatisch liep). Wacht tot hij groen is (~2 minuten).
4. Je app staat nu op `https://elis394.github.io/claude-code/`. Open die
   link in Safari op je iPhone → deelknop → **"Zet op beginscherm"**.

Elke keer dat er nieuwe code naar de `main`-branch gepusht wordt, herbouwt
en herpubliceert deze workflow automatisch — jullie hoeven daar zelf niets
voor te doen.

## 4. Edge Function deployen (optioneel: automatisch recept ophalen via een link)

Zonder deze stap werkt de app volledig, maar moet je elk recept handmatig
invullen (de "Ophalen"-knop bij een link toevoegen faalt dan) — geen
blokkerende stap, kun je later doen.

Dit vereist wél een terminal, wat op een iPhone niet gaat. Gratis
alternatief zonder computer: open
[github.com/codespaces](https://github.com/codespaces) in je mobiele
browser, maak een Codespace op deze repo (opent een volledige VS Code +
terminal in de browser), en draai daar:

```bash
npx supabase login
npx supabase link --project-ref uamhwbutmnzculjvacmb
npx supabase functions deploy extract-recipe
```

## 5. Huishouden koppelen

1. Open de app (de GitHub Pages-link) → registreer een account → kies
   **"Nieuw huishouden"** en geef het een naam.
2. Ga naar de **Account**-tab en kopieer de uitnodigingscode.
3. Je partner opent dezelfde link op zijn/haar iPhone → registreert een
   eigen account → kiest **"Huishouden joinen"** en vult de code in.

Jullie zien vanaf nu dezelfde recepten en boodschappenlijst.

## Alternatief: testen via Expo Go (met een computer, of via Codespaces)

Voor wie liever de "echte" native app test tijdens ontwikkeling (in plaats
van de webversie):

```bash
npm install
npx expo start --tunnel   # --tunnel is nodig als je dit in Codespaces draait
```

Scan de QR-code met de [Expo Go](https://expo.dev/go) app, of kopieer de
getoonde `exp://...`-link en plak die in Expo Go via "Enter URL manually"
(handig als je maar één toestel hebt en niet je eigen scherm kan scannen).

## Kanttekeningen

- Automatische import werkt het best bij receptensites met gestructureerde
  data (schema.org/Recipe) en redelijk goed bij YouTube/TikTok/Instagram via
  titel + thumbnail + bijschrift — maar is altijd best-effort. Het
  formulier is na het ophalen altijd volledig bewerkbaar.
- Dit is de MVP: recepten + boodschappenlijst uit geselecteerde recepten. De
  weekkalender (recepten per dag inplannen) staat gepland als vervolgstap.
- De webversie (GitHub Pages) gebruikt dezelfde Supabase-backend als de
  native app — je kan later alsnog een installeerbare app bouwen (bv. via
  EAS Build) zonder dat er iets aan de backend verandert.
