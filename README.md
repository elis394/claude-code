# claude-code

## Homebase — household management tool

A local-first web app for tracking chores, bills, renovation plans,
household financials, and admin/paperwork. Lives in
[`household-manager/`](./household-manager).

All data is stored in the browser (`localStorage`) — there's no backend or
account system. Use the export/import buttons in the sidebar to back up or
move your data between devices.

### Running it

```bash
cd household-manager
npm install
npm run dev
```

### Using it on your phone

The app is a PWA (installable, works offline) and deploys to GitHub Pages
via [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

One-time setup: in the repo's **Settings → Pages**, set **Source** to
**GitHub Actions**. After that, every push to `main` that touches
`household-manager/` publishes to `https://elis394.github.io/claude-code/`.
Open that URL on your phone and use "Add to Home Screen" to install it.

Because data is stored per-browser, your phone and computer keep separate
data — use the sidebar's Export/Import to move it between devices.

### Sections

- **Dashboard** — overview of what's due across the house
- **Chores** — recurring and one-off tasks, assignable to household members
- **Bills** — due dates, recurrence, autopay and paid status
- **Renovations** — projects with budgets and task checklists
- **Financials** — income/expense tracking with a monthly category breakdown
- **Admin** — renewals, subscriptions, warranties and paperwork deadlines
