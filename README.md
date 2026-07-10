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

### Sections

- **Dashboard** — overview of what's due across the house
- **Chores** — recurring and one-off tasks, assignable to household members
- **Bills** — due dates, recurrence, autopay and paid status
- **Renovations** — projects with budgets and task checklists
- **Financials** — income/expense tracking with a monthly category breakdown
- **Admin** — renewals, subscriptions, warranties and paperwork deadlines
