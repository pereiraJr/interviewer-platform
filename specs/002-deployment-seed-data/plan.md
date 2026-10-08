# Implementation Plan: Deployment Seed Data

**Branch**: `002-deployment-seed-data` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-deployment-seed-data/spec.md`

## Summary

Ensure a freshly deployed environment is dashboard-ready by persisting a baseline **job
catalogue** into the environment's MongoDB **on every deployment**. The baseline is a small,
version-controlled sample dataset applied by a **deployment-pipeline step** (`npm run seed`)
that the release process runs unconditionally — there is **no operator trigger, no feature
flag, and no public HTTP endpoint**. Seeding is **idempotent**: it replaces the `jobs`
collection with the baseline so repeated or interrupted runs converge to the same
dashboard-ready state, while never touching candidate/interview/session data. Server-side
credentials only; no new runtime dependencies.

This feature extends the backend delivered in `001-jobs-dashboard` and reuses its model/`Db`
layering, Jest tests, and `testcontainers` integration approach.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 20 LTS+ (dev runtime verified: Node 26).
Backend-only feature.

**Primary Dependencies**: Official `mongodb` Node.js driver 6 (existing, no ODM) and `tsx`
(existing dev dependency) to run the seed CLI. No new runtime dependencies; the Express app is
unchanged by this feature.

**Testing**: Jest, as established by `001-jobs-dashboard`: unit tests with a mocked `Db` for the
seed routine, and a `testcontainers` integration test against a real MongoDB proving end-to-end
"empty database → seeded → visible on the jobs API" plus idempotency across repeated runs.

**Storage**: MongoDB `jobs` collection. Seeding writes only this collection; no new collections
or indexes are required beyond those defined in `001-jobs-dashboard`.

**Target Platform**: Backend deployed as a Vercel serverless function (`backend/api/index.ts`)
plus the deployment pipeline that runs the seed step. Not browser-facing, not callable over HTTP.

**Project Type**: Web application (frontend + backend in one repository); this feature adds
backend deployment/seeding behavior only.

**Performance Goals**: A seed run against the baseline catalogue completes in a few seconds and
does not alter `GET /api/jobs` latency.

**Constraints**: No new third-party tools; seeding runs automatically as part of the deployment
pipeline; no public endpoint or opt-in flag; candidate-owned data is never modified.

**Scale/Scope**: One seed dataset (~6 jobs), one seeding routine, one CLI entrypoint invoked by
the deploy pipeline; small, bounded scope. Interview/session seeding is out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Component-Driven, Clear Interfaces | Seeding is one focused module (`seedData.seedSampleJobs`) invoked by one CLI entrypoint; it reuses the existing `Db` lifecycle and does not embed unrelated logic. Independently testable. | PASS |
| II. Voice-First Candidate Experience | Not applicable (no interview capture/transcription in this feature). | PASS (N/A) |
| III. Role-Grounded Adaptive Questioning | Not applicable (no AI questioning in this feature). | PASS (N/A) |
| IV. Auditable Sessions & Structured Evaluations | Not applicable to sessions; seeding only writes the non-sensitive job catalogue and never touches session data (FR-006). | PASS (N/A) |
| V. Test Discipline (NON-NEGOTIABLE) | Unit tests for the seed routine (idempotent replace, validation, failure) and a `testcontainers` integration test proving empty→seeded→served and repeated-run idempotency. Runs under the existing single `npm test` command. | PASS |
| Data Privacy & Security | Database credentials stay server-side (env vars only, never in the browser or repo). Because there is no public endpoint, the destructive reseed cannot be triggered by external callers. Errors leak no internals. | PASS |
| Workflow & Quality Gates | Lint + strict type-check + tests remain required; no external interface is exposed so no API contract is needed; no unjustified complexity (reuses existing layers, no new dependencies). | PASS |

**Result**: All gates pass. No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-deployment-seed-data/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

> No `contracts/` directory: this feature exposes **no external interface** (no HTTP endpoint, no
> library API). The seed routine is an internal deployment utility.

### Source Code (repository root)

Additions/changes are confined to the existing `backend/` package, the deploy configuration, and
the root scripts.

```text
backend/
├── src/
│   ├── app.ts                    # (existing) unchanged — the seed endpoint is NOT mounted
│   ├── config.ts                 # (existing) env parsing: PORT, MONGO_URL, MONGO_DB, CORS_ORIGIN
│   ├── db/mongo.ts               # (existing) client connect/close lifecycle
│   ├── models/job.ts             # (existing) JobDocument + validation used to validate seed rows
│   ├── seedData.ts               # NEW: version-controlled baseline + seedSampleJobs(db)
│   └── seed.ts                   # NEW: CLI entrypoint (npm run seed) run by the deploy pipeline
├── api/
│   └── index.ts                  # (existing) unchanged — no seed wiring
├── test/
│   ├── unit/
│   │   └── seedData.test.ts      # NEW: idempotent replace, validation, failure propagation
│   └── integration/
│       ├── seed.test.ts          # NEW: empty DB -> seed -> GET /api/jobs returns jobs
│       └── seedIdempotency.test.ts # NEW: repeated/interrupted runs converge, no duplicates
├── vercel.json                   # MODIFIED: deploy build command runs the seed step every deploy
└── package.json                  # (existing) `seed`, `build`, `test` scripts

package.json                      # (existing) root `seed` fan-out script: npm --prefix backend run seed
```

**Structure Decision**: Web-application layout inherited from `001-jobs-dashboard`; this feature
touches the `backend/` package, the Vercel deploy configuration, and the root scripts. Seeding is
kept out of the HTTP layer entirely: `seedData.ts` holds the routine, `seed.ts` is the CLI
entrypoint, and the deployment pipeline invokes it on every deployment via the build command. The
Express app and serverless entrypoint are intentionally untouched so there is no externally
callable seeding surface.

## Complexity Tracking

> No violations. This section is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0: Research Output

See [`research.md`](./research.md) — decisions on trigger (automatic, every deployment), existing
-data semantics (idempotent replace), no public endpoint, dataset versioning/validation, failure
behavior, and testing.

## Phase 1: Design Output

- [`data-model.md`](./data-model.md) — Job + Seed Dataset entities, validation, idempotency rules.
- [`quickstart.md`](./quickstart.md) — how the deploy pipeline seeds, and how to seed locally.
- No contracts: there is no external interface.

## Constitution Re-Check (post-design)

| Principle | Post-design status |
|-----------|--------------------|
| I. Component-Driven, Clear Interfaces | PASS — seeding isolated in `seedData.ts`, invoked by one CLI, no HTTP wiring. |
| V. Test Discipline | PASS — unit + integration tests specified in structure above. |
| Data Privacy & Security | PASS — credentials env-only; no public endpoint reduces attack surface. |
| Workflow & Quality Gates | PASS — no new dependencies; complexity justified as none. |

**Result**: All gates still pass after Phase 1 design.
