---
description: "Task list for Deployment Seed Data implementation"
---

# Tasks: Deployment Seed Data

**Input**: Design documents from `/specs/002-deployment-seed-data/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: REQUIRED where applicable (project constitution, Principle V, NON-NEGOTIABLE). Unit tests cover the seed routine; a `testcontainers` integration test covers the real MongoDB boundary, the jobs API, and idempotency.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. The shared seeding routine is a foundational prerequisite for the CLI and the deploy step.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: backend lives at `backend/src/`, tests at `backend/test/`
- Documentation for this feature lives at `specs/002-deployment-seed-data/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the commands and tooling the feature relies on are in place. No new runtime dependencies are introduced.

- [X] T001 [P] Verify/add the `seed` npm script in `backend/package.json` (`tsx src/seed.ts`) and the root fan-out `seed` script in `package.json` (`npm --prefix backend run seed`).
- [X] T002 [P] Verify `backend/jest.config.js` and `backend/tsconfig.json` include `src/`, `api/`, and `test/` paths, and confirm no new dependencies are needed (`mongodb`, `tsx`, `jest`, `testcontainers` already present).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared, idempotent seeding routine used by the CLI and the deployment step. No user story can be completed without it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Define the `NewJob` type (`Omit<JobDocument, '_id' | 'createdAt' | 'updatedAt'>`) and the version-controlled `sampleJobs` baseline in `backend/src/seedData.ts`; include at least one `status: 'available'` job and at least one `status: 'closed'` job.
- [X] T004 Implement `seedSampleJobs(db: Db): Promise<number>` in `backend/src/seedData.ts`: validate every baseline row with the rules in `backend/src/models/job.ts` (title non-empty ≤ 200, description ≤ 500, status enum) BEFORE any write; then `deleteMany({})` on the `jobs` collection; then `insertMany` the baseline with run-time `createdAt`/`updatedAt`; return the number of documents inserted.
- [X] T005 [P] Unit tests for the seed routine in `backend/test/unit/seedData.test.ts` using a mocked `Db`: valid baseline replaces (delete then insert) and returns the count; an invalid row aborts before `deleteMany`/`insertMany`; an empty dataset inserts 0 without error.

**Checkpoint**: The seeding routine is implemented and unit-tested — user stories can now begin.

---

## Phase 3: User Story 1 - Dashboard is populated after deployment (Priority: P1) 🎯 MVP

**Goal**: Every deployment applies the baseline job catalogue so the candidate dashboard is populated with no manual data entry and no operator trigger.

**Independent Test**: Point the seed step at an empty database, run it, then call `GET /api/jobs` and confirm the seeded available jobs are returned.

### Tests for User Story 1 (REQUIRED - Principle V) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [X] T006 [P] [US1] Integration test in `backend/test/integration/seed.test.ts` (testcontainers MongoDB): start with an empty `jobs` collection, run `seedSampleJobs`, then assert `GET /api/jobs` returns exactly the seeded `available` jobs (the `closed` job is excluded); also assert `POST /api/seed` returns `404` (no public endpoint).

### Implementation for User Story 1

- [X] T007 [US1] Implement the CLI entrypoint in `backend/src/seed.ts`: load config via `backend/src/config.ts`, connect via `backend/src/db/mongo.ts`, run `seedSampleJobs`, log `[seed] inserted <n> jobs into <db>`, close the connection, and exit non-zero with a clear message on failure.
- [X] T008 [US1] Wire the seed step into the deployment pipeline by changing the build command in `backend/vercel.json` to run `npm run build && npm run seed`, so every deployment seeds the environment's database. Do not add any HTTP route (`backend/src/app.ts` and `backend/api/index.ts` remain unchanged).

**Checkpoint**: MVP — deploying an empty environment populates the dashboard automatically.

---

## Phase 4: User Story 2 - Re-deployments are safe and repeatable (Priority: P2)

**Goal**: Running the deployment seed step repeatedly (or after an interrupted run) always converges to the same baseline catalogue with no duplicates.

**Independent Test**: Run seeding against the same database twice and assert the resulting catalogue is identical to a single run and contains no duplicate jobs.

### Tests for User Story 2 (REQUIRED - Principle V) ⚠️

- [X] T009 [P] [US2] Integration test in `backend/test/integration/seedIdempotency.test.ts` (testcontainers MongoDB): seed twice and assert the document set is unchanged (same titles/statuses, no duplicates, same count); simulate a partial run and assert the next run recovers.

### Implementation for User Story 2

- [X] T010 [US2] Harden `seedSampleJobs` in `backend/src/seedData.ts` so repeated or interrupted runs converge: guarantee full-dataset validation precedes any mutation, perform a clear-then-rewrite (delete all `jobs`, then insert the baseline), and document the idempotency/recovery guarantee in a comment. (Builds on T004.)

**Checkpoint**: Repeated deployments never duplicate or corrupt the catalogue.

---

## Phase 5: User Story 3 - Operator can confirm seeding outcome (Priority: P3)

**Goal**: After a deployment, the operator can determine from the deployment output whether seeding succeeded or failed and how many records were affected.

**Independent Test**: Run the seed step and inspect the deploy log to see success plus a record count, or a clear failure.

### Tests for User Story 3 (REQUIRED - Principle V) ⚠️

- [X] T011 [P] [US3] Unit test in `backend/test/unit/seedData.test.ts`: `seedSampleJobs` reports `0` for an empty dataset and the dataset length otherwise, so the deployment log count is trustworthy.

### Implementation for User Story 3

- [X] T012 [US3] Finalize outcome reporting in `backend/src/seed.ts`: print the inserted count on success (including `0`) and a clear, non-sensitive error message with a non-zero exit code on failure, so the deploy step fails loudly.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, security hygiene, and quality gates.

- [X] T013 [P] Update `specs/002-deployment-seed-data/quickstart.md` so the documented seed step, env vars, and deployment runbook match the implementation (no endpoint, no token).
- [X] T014 [P] Security hygiene: confirm Mongo credentials are read only from server-side env vars, ensure no secrets are committed (check `.gitignore` covers `.env`), and confirm no HTTP route can trigger seeding.
- [X] T015 Run `npm run lint`, `npm run typecheck`, and `npm test` from the repository root and fix any failures (constitution quality gates).
- [X] T016 Validate `specs/002-deployment-seed-data/quickstart.md` end-to-end: seed an empty database, confirm `GET /api/jobs` returns jobs and the dashboard is populated, then seed a second time and confirm no duplicates.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion.
  - US1 (P1) is the MVP and should be completed first.
  - US2 (P2) hardens the same routine (`seedData.ts`) — sequence after US1's foundational routine.
  - US3 (P3) finalizes the CLI reporting created in US1.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **US2 (P2)**: Can start after Foundational; its implementation refines the routine and its test uses it.
- **US3 (P3)**: Can start after Foundational; refines the CLI entrypoint.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- The routine (T004) precedes CLI/deploy wiring.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Setup: T001 and T002 can run in parallel.
- Foundational: T005 is [P] (separate test file) once T003/T004 exist.
- US1: T006 (integration test) can be written alongside T007/T008.
- US2/US3: T009 and T011 are [P] (separate files).
- Polish: T013 and T014 are [P].

---

## Parallel Example: User Story 1

```bash
# Write the US1 integration test first (expect failure):
Task: "Integration test seed -> GET /api/jobs in backend/test/integration/seed.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Seed an empty DB and confirm `GET /api/jobs` (and the dashboard) show jobs.
5. Deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → seeding routine ready.
2. US1 → every deployment makes the environment dashboard-ready (MVP).
3. US2 → repeated deployments stay safe (idempotent).
4. US3 → operators get clear outcome reporting in the deploy log.
5. Polish → docs, security hygiene, and all quality gates green.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] labels map tasks to user stories for traceability.
- There is **no** public seeding endpoint and **no** seed token; seeding runs only from the deployment pipeline (see `research.md` Decision 3).
- The seed routine (`backend/src/seedData.ts`) and CLI (`backend/src/seed.ts`) are the durable implementation; the deploy wiring lives in `backend/vercel.json`.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
