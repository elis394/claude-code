# Verify: Flora Food (Expo/React Native web)

## Boot it

The app throws at import (`src/lib/supabase.ts`) if Supabase env vars are
missing — a placeholder URL/key is enough to render UI (no real network
call happens until an actual auth/query action fires):

```bash
cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://verify-placeholder.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=verify-placeholder-anon-key
EOF
npx expo start --web --port 8081   # backgrounded; wait for "Web Bundled" in the log
```

`.env` is gitignored — delete it when done (`rm .env`), don't commit it.
Kill the server after: `pkill -f "expo start --web"`.

## Drive it

Headless Chromium via the globally-installed Playwright (not a project
dep — import from the absolute path):

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
```

- Root `/` redirects to `/login` when there's no session (`useAppGate` +
  `Stack.Protected` in `src/app/_layout.tsx`). Gated routes
  (`/recipes`, `/household-setup`, any `(tabs)` screen) redirect to
  `/login` too when hit directly with no session — good smoke test for
  the auth gate without needing real credentials.
- Use `page.getByPlaceholder('E-mailadres' | 'Wachtwoord')` and
  `page.getByText('Inloggen' | 'Registreren', { exact: true })` to drive
  the login/register forms.
- **Gotcha**: clicking the login↔register `Link` client-side leaves a
  second (initially hidden, briefly both-visible) copy of the target
  screen's `TextInput`s in the DOM for one paint — `getByPlaceholder(...)`
  count flickers 1→2→1. Direct `page.goto()` per screen doesn't have
  this; only in-app `Link` navigation does. Use `.first()` or add a
  short wait if you must interact right after a Link click.
- No real Supabase project reachable here → submitting a form does fire
  a genuine network request that fails (`ERR_TUNNEL_CONNECTION_FAILED`
  in the browser console) — that's expected and actually confirms the
  request path is real; it exercises the error-handling branch
  (`showAlert(...)`, `setLoading(false)`) without needing a live backend.
- The `recipes`/`shopping-list`/`account` screens and the
  `extract-recipe` edge function need a real, deployed Supabase project
  + schema — can't be exercised in this sandbox (no live network to a
  real project). That's a real verification gap, not a skip-worthy one.
