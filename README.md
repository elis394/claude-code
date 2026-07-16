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

The app is a PWA (installable, works offline) and is hosted on Netlify,
configured by [`netlify.toml`](./netlify.toml). Netlify builds directly from
this (private) repo and serves it at a public URL — connect the repo once in
the Netlify dashboard and every push redeploys automatically.

On your phone, open the Netlify URL and use "Add to Home Screen" to install it.

Because data is stored per-browser, your phone and computer keep separate
data — use the sidebar's Export/Import to move it between devices.

### App lock

Since the app is at a public URL, the sidebar has an "Enable app lock" option
that gates the whole app behind a 4–8 digit PIN. It's a UI access gate, not
encryption — the data underneath isn't scrambled, so it protects against
someone glancing at your unlocked phone or opening the app icon, not a
compromised device. The app re-locks automatically after being backgrounded
for ~30 seconds. There's no PIN recovery (nothing is stored anywhere but your
browser) — forgetting it means using "Forgot PIN? Reset all data" on the lock
screen, which wipes the browser's data and starts fresh.

### Uploading files

The sidebar's "Upload item" button lets you pick any file (a photo of a
receipt, a bill PDF, a warranty document, anything) and asks which section it
belongs to — Bill, Chore, Renovation project, Transaction, or Admin item. It
then opens that section's normal add form, pre-filled with the filename, with
the file attached. Files are stored in the browser's IndexedDB (not
`localStorage`, which can't hold binary data at any real size) and are
included in Export/Import backups so they survive moving data between
devices.

### Sections

- **Dashboard** — overview of what's due across the house
- **Chores** — recurring and one-off tasks, assignable to household members
- **Bills** — due dates, recurrence, autopay and paid status
- **Renovations** — projects with budgets and task checklists
- **Financials** — income/expense tracking with a monthly category breakdown
- **Admin** — renewals, subscriptions, warranties and paperwork deadlines
