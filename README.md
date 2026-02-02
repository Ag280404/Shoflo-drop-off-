# Drop-off Detective

Full-stack demo app for Shopflo-style checkout analytics + AI RCA copilot.

## Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Then open `http://localhost:3000`.

## Features

- Dashboard with KPIs, trends, and anomaly detection.
- Root cause cards with evidence, recommended fixes, and exportable experiment plans.
- Segment explorer with charts, tables, and drill-down modal.
- Session explorer with event timeline drill-down.
- Deterministic mock LLM and optional OpenAI support via `OPENAI_API_KEY`.

## Demo flow

1. Click **Seed Demo Data** on the dashboard.
2. Explore dashboards, root cause cards, segments, and session timelines.
3. Export experiment plans as JSON from root cause cards.
