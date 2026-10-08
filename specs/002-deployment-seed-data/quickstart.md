# Quickstart: Deployment Seed Data

**Feature**: `002-deployment-seed-data` | **Date**: 2026-10-07

How the baseline job catalogue is persisted so the dashboard has data on landing. Seeding runs
**automatically on every deployment** as a step of the deployment pipeline, and it is **not**
exposed as an HTTP endpoint. Paths and commands match [plan.md](./plan.md).

## Prerequisites

- Node.js 20 LTS or newer (npm included)
- Access to the target environment's MongoDB connection settings (`MONGO_URL`, optional `MONGO_DB`)
- Docker running locally (only required by `testcontainers` for integration tests)

## Configure

Backend environment (server-side only; no browser exposure, no seed token):

| Variable | Required for | Example | Purpose |
|----------|--------------|---------|---------|
| `MONGO_URL` | seed step + API | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB` | optional | `afterquery` | Database name |
| `CORS_ORIGIN` | API | `http://localhost:5173` | Allowed frontend origin |

## How every deployment seeds

The deployment pipeline runs the seed step after the build, invoking:

```bash
npm --prefix backend run seed
```

`backend/vercel.json` wires this into the Vercel build command
(`npm run build && npm run seed`) so it executes on every deployment against the environment's
database. Expected output: `[seed] inserted 6 jobs into afterquery`. The step exits non-zero on
failure, failing the deployment rather than shipping an empty dashboard.

There is no HTTP endpoint to call and no operator trigger; the step is unconditional.

## Seed locally

```bash
# from the repository root
npm run seed

# or directly
npm --prefix backend run seed
```

## Verify

Start the API and request the catalogue:

```bash
npm --prefix backend run dev
curl -sS "http://localhost:4000/api/jobs"
```

Then open the dashboard and confirm job cards are shown (not the empty state).

Idempotency check — run the seed step twice and confirm the catalogue is unchanged:

```bash
npm --prefix backend run seed
npm --prefix backend run seed
# GET /api/jobs returns the same jobs; no duplicates
```

## Test

```bash
npm test                     # root: backend + frontend
npm --prefix backend test    # unit + testcontainers integration
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

1. Against an empty database, the deployment seed step makes `GET /api/jobs` return the baseline
   available jobs (the closed sample job is not returned).
2. The dashboard shows job cards immediately after a successful deployment, with no manual step.
3. Running the seed step twice yields the same jobs, with no duplicates.
4. There is no public HTTP endpoint that can trigger seeding.
5. If the database is unreachable, the seed step reports a clear failure (non-zero exit) and the
   existing data is not left corrupted beyond a re-runnable state.
