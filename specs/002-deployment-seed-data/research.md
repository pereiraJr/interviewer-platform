# Phase 0 Research: Deployment Seed Data

**Feature**: `002-deployment-seed-data` | **Date**: 2026-10-07

Focus: resolve the two functional clarifications (existing-data handling, trigger) and the
Technical Context decisions (protection, dataset versioning/validation, failure semantics,
testing). Guiding constraints from the project: **minimal third-party tools**, server-side
secrets only, and the existing `001-jobs-dashboard` layering/testing conventions.

## Decision 1: Seeding trigger in the deployment lifecycle

- **Decision**: Seeding runs **automatically on every deployment** as a step of the deployment
  pipeline. The pipeline invokes the `npm run seed` CLI against the environment's database; there
  is no operator trigger and no opt-in flag.
- **Rationale**: The product requirement is that a freshly deployed environment always presents a
  populated dashboard. The deploy target is serverless with no interactive operator, so the seed
  step must be part of the release process itself. Replacing the seed-owned catalogue on every
  deploy guarantees the dashboard is never empty and keeps demo data deterministic. Because the
  step is part of the pipeline, it also runs on rollbacks/upgrades without a separate runbook.
- **Alternatives considered**: Operator-invoked seeding via a protected endpoint (rejected by the
  product owner: requires an extra manual step and conditional enablement); seeding on application
  startup (rejected: on serverless this would reseed on every cold start, not once per
  deployment); a per-environment opt-in flag (rejected: the requirement is unconditional seeding).

## Decision 2: Existing-data semantics (idempotency strategy)

- **Decision**: **Replace the `jobs` collection with the baseline** on each run: delete all
  documents in `jobs`, then insert the baseline with fresh `createdAt`/`updatedAt`. Never touch
  any other collection. This makes the run idempotent (N runs = 1 run; no duplicates) and gives
  the dashboard a deterministic catalogue.
- **Rationale**: In this slice the job catalogue is **seed-owned** — there is no job
  creation/editing feature, so nothing user-generated lives in `jobs`. A full replace is the
  simplest design that satisfies FR-001/FR-004/FR-005 and the "interrupted run converges on
  re-run" edge case (a re-run clears any partial insert and rewrites the baseline).
- **Alternatives considered**: Insert only when `jobs` is empty (rejected: updated baselines
  would never reach an already-seeded environment); upsert by stable identifiers (rejected for
  now: requires adding stable keys/managed-job semantics that the product does not yet have;
  revisit if the catalogue becomes operator-managed).

## Decision 3: No public endpoint / attack-surface control

- **Decision**: Seeding is **not exposed as an HTTP endpoint**. It is performed only by the
  deployment pipeline via the `npm run seed` CLI, which reads `MONGO_URL`/`MONGO_DB` from the
  server-side environment. The Express app and serverless entrypoint are not modified.
- **Rationale**: An endpoint that replaces the jobs catalogue on every call would be a
  destructive surface accessible to anyone who can reach it. Removing the endpoint entirely
  (FR-013) eliminates that risk without losing the requirement, since the trigger is now the
  deploy pipeline. It also keeps the feature out of the browser-facing contract.
- **Alternatives considered**: Token-protected endpoint (rejected by the product owner: it is a
  conditional trigger); unauthenticated endpoint (rejected: unacceptable destructive surface).

## Decision 4: Where the baseline dataset lives

- **Decision**: The baseline is a **version-controlled TypeScript module**
  (`backend/src/seedData.ts`) exported as `sampleJobs` and applied by
  `seedSampleJobs(db): Promise<number>`. The dataset includes at least one `status: "closed"`
  entry to demonstrate that the dashboard's availability filter still applies to seeded data.
- **Rationale**: Co-locating the dataset with the app means every deployment ships a known,
  reviewable baseline (FR-007) and the routine is unit-testable without filesystem access. The
  include-a-closed-job detail ties seeding to `001`'s availability semantics.
- **Alternatives considered**: A JSON/CSV fixture (fine, but splits types from validation and
  needs extra parsing); an external CMS/database (far out of scope for a sample catalogue).

## Decision 5: Validation of seed rows

- **Decision**: Every baseline job is validated **before** any write using the existing model
  rules (`isValidTitle`, description bounding to 500 chars, `status ∈ {available, closed}`). If
  any row is invalid, seeding aborts with an error and writes nothing.
- **Rationale**: The constitution requires externally supplied/data-bound inputs to be bounded
  and validated, and invalid data to "fail loudly rather than be stored silently." Validating
  first prevents a partially written, invalid catalogue.
- **Alternatives considered**: Trust the in-repo data (rejected: a typo could render an invalid
  card); validate after insert (rejected: leaves invalid data behind).

## Decision 6: Failure semantics & recovery

- **Decision**: A seed run is a two-step replace (`deleteMany` then `insertMany`). On failure,
  the CLI exits non-zero and prints a clear message, which fails the deployment step so the
  release surfaces the problem. A subsequent successful run converges the collection to the
  baseline. Seeding does **not** use a multi-document transaction.
- **Rationale**: MongoDB single-node deployments (including `testcontainers` and typical managed
  single instances) do not support multi-document transactions without a replica set; adding
  one would increase complexity without user-visible benefit for a reset-style operation whose
  documented recovery is "run it again." This satisfies the spec's interrupted-run edge case.
- **Alternatives considered**: Multi-document transaction (rejected: replica-set requirement and
  complexity); write-to-temp-then-rename (rejected: over-engineered for a seed utility).

## Decision 7: Reporting / observability

- **Decision**: `seedSampleJobs` returns the number of records written; the CLI logs
  `[seed] inserted <n> jobs into <db>` (part of the deployment output). On the empty-dataset case
  it reports `0` rather than an error.
- **Rationale**: FR-010/SC-004 require an operator to confirm the outcome without inspecting the
  database; a count in the deploy log is the minimum useful signal. Reuses the existing console
  idiom.
- **Alternatives considered**: Structured JSON logging/metrics (deferred: no logging framework in
  the project; console output is proportionate).

## Decision 8: Testing strategy

- **Decision**: **Unit** tests with a mocked `Db` prove: idempotent replace (delete then insert),
  validation abort, and error propagation. **`testcontainers` integration** tests prove the full
  path: seed an empty database → `GET /api/jobs` returns the seeded available jobs; repeat the
  seed → still no duplicates; a partial/interrupted run recovers on the next run.
- **Rationale**: Matches Principle V and the established `001` approach (real MongoDB via
  `testcontainers`, HTTP via the app, single `npm test`).
- **Alternatives considered**: `mongodb-memory-server` (rejected: not a real container; project
  standard is `testcontainers`); testing only the routine without the jobs endpoint (rejected:
  the integration test proves the seeded data is actually served to the dashboard).

## Open items

None. All NEEDS CLARIFICATION items from the spec and Technical Context are resolved.
