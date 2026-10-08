# Quickstart: Interview Room

**Feature**: `004-interview-room` | **Date**: 2026-10-07

How to run and verify the Interview Room and its recording-consent gate. Paths match
[plan.md](./plan.md).

## Prerequisites

- Node.js 20 LTS or newer (npm included)
- MongoDB reachable via the backend config (`MONGO_URL`), with at least one available job
  (`npm --prefix backend run seed`)
- Docker running locally (only for `testcontainers` integration tests)

## Run

```bash
# terminal 1 - API
npm --prefix backend run dev

# terminal 2 - web app
npm --prefix frontend run dev
```

Open the frontend URL (default `http://localhost:5173`).

## Walkthrough (consent gate)

1. On the dashboard, select a job card. You are taken to the Interview Room for that role
   (`/jobs/:id`) and the room shows which role you are interviewing for.
2. Before anything else, the recording consent banner is shown stating that audio will be
   recorded and used for internal purposes only. No interview is in progress yet.
3. Click **Accept**. The banner is dismissed and the room shows the interview as **in progress**.
4. Reload the room for the same role. The banner is **not** shown again (consent already
   recorded) and the session remains in progress.
5. Enter the room for a fresh role and click **Decline**. The interview does not start and you are
   returned to the dashboard.
6. Visit `/jobs/<unknown-id>`. You are guided back to the dashboard instead of seeing an
   ambiguous room.

## API (manual checks)

```bash
# Enter the room for a job (start or resume) -> session with job + consent + notice
curl -sS -X POST "http://localhost:4000/api/jobs/<jobId>/interview"

# Retrieve a session
curl -sS "http://localhost:4000/api/interviews/<sessionId>"

# Accept consent -> status becomes in_progress
curl -sS -X POST "http://localhost:4000/api/interviews/<sessionId>/consent" \
  -H "Content-Type: application/json" -d '{"decision":"accepted"}'

# Decline consent -> status stays not-in-progress
curl -sS -X POST "http://localhost:4000/api/interviews/<sessionId>/consent" \
  -H "Content-Type: application/json" -d '{"decision":"declined"}'

# Invalid decision -> 400
curl -i -X POST "http://localhost:4000/api/interviews/<sessionId>/consent" \
  -H "Content-Type: application/json" -d '{"decision":"maybe"}'
```

## Test

```bash
npm test                     # root: backend + frontend
npm --prefix backend test    # unit + testcontainers integration
npm --prefix frontend test   # React Testing Library
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

1. Selecting a job opens the room for the correct role and it is clearly identified.
2. 100% of first-time room entries show the consent banner before any interview activity.
3. The interview cannot be in progress and no recording occurs until consent is accepted.
4. Accepting dismisses the banner and the room shows the interview in progress.
5. Reloading after acceptance does not show the banner again.
6. Declining returns to the dashboard with no interview started.
7. The banner and its Accept/Decline actions are operable with the keyboard only.
