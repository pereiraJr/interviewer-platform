# Quickstart: Jobs Dashboard

**Feature**: `001-jobs-dashboard` | **Date**: 2026-10-07

This quickstart describes the expected developer workflow once implementation lands. Paths
and commands match the structure in [plan.md](./plan.md).

## Prerequisites

- Node.js 20 LTS or newer (npm included)
- Docker running locally (required by `testcontainers` for integration tests)

## Install

From the repository root:

```bash
npm --prefix backend install
npm --prefix frontend install
```

## Configure

Backend environment (create `backend/.env` or export in the shell):

| Variable | Example | Purpose |
|----------|---------|---------|
| `PORT` | `4000` | HTTP port for the API |
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB` | `afterquery` | Database name |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

No secrets belong in the frontend. The API base URL defaults to `http://localhost:4000`;
deployments may override it by setting `window.__API_BASE_URL__` before the app boots.

## Run locally

```bash
# terminal 1 - API
npm --prefix backend run dev

# terminal 2 - web app
npm --prefix frontend run dev
```

Open the frontend URL and confirm the dashboard renders job cards in a three-column grid.

## Seed sample jobs (optional, for manual testing)

```bash
npm --prefix backend run seed
```

## Test

Single command from the repository root (runs both packages):

```bash
npm test
```

Or per package:

```bash
npm --prefix backend test     # unit + testcontainers integration
npm --prefix frontend test    # React Testing Library component tests
```

> Integration tests require Docker because MongoDB is started via `testcontainers`.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
```

All three MUST pass (constitution Development Workflow & Quality Gates).

## Manual verification checklist

1. With no jobs in the database, the dashboard shows the empty state (not a blank grid).
2. With jobs present, exactly three cards render per row at desktop width.
3. Each card shows a title and a brief description.
4. Resizing the window reflows the grid to fewer columns without horizontal scrolling.
5. Activating a card (mouse or keyboard) navigates to `/jobs/:id` for the correct job.
6. Stopping the API and reloading shows the recoverable error state.
