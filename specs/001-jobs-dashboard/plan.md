# Implementation Plan: Jobs Dashboard

**Branch**: `001-jobs-dashboard` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-jobs-dashboard/spec.md`

## Summary

Deliver a candidate-facing **Jobs Dashboard**: a React (TypeScript) page that fetches the
job catalogue from an Express (TypeScript) REST API backed by MongoDB and renders each job
as a card (title + brief description) in a responsive three-column grid. Activating a card
navigates to that job's detail view (the detail view itself is out of scope). The feature
is the first vertical slice of the AfterQuery Interviewer Platform, so the backend is built
as a small layered service and the frontend as composable components. Both sides use Jest:
unit tests for components and pure logic, and `testcontainers`-backed integration tests for
the API + MongoDB boundary.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 20 LTS+ (verified dev runtime:
Node 26). Same language for backend and frontend.

**Primary Dependencies**:

- Backend: Express (current stable major) for HTTP; the official `mongodb` Node.js driver
  (no ODM); TypeScript toolchain.
- Frontend: React 18+ with TypeScript; React Router for navigation to the job detail view.
- No UI component library; styling uses plain CSS (CSS Grid).

**Testing**: Jest for all unit and integration tests; `@testing-library/react` +
`@testing-library/jest-dom` for React component unit tests (React best practice);
`testcontainers` to run a real MongoDB container for repository/API integration tests.

**Storage**: MongoDB (`jobs` collection), accessed through the official driver inside a
repository layer. The list endpoint returns only currently available jobs.

**Target Platform**: Web application — modern evergreen browsers (frontend) and a Node.js
process (backend). Not intended for offline use.

**Project Type**: Web application (frontend + backend in a single repository).

**Performance Goals**: Dashboard shows the first job cards within 2 s on standard broadband
(SC-006); `GET /api/jobs` responds in under 200 ms p95 for catalogues up to ~500 jobs.

**Constraints**: Minimal third-party dependencies (see `research.md` for each one justified
against an alternative); no pagination (FR-014); candidate is already authenticated
(Assumptions); voice/interview/transcription concerns are out of scope for this slice.

**Scale/Scope**: Small catalogue (hundreds of jobs) displayed on a single scrolling page; one
backend route (`/api/jobs`); one dashboard page composed of roughly three components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Component-Driven, Clear Interfaces | UI split into `JobsDashboard` page + `JobsGrid` + `JobCard`; API split into route → service → repository; shared types in one place; components independently testable. | PASS |
| II. Voice-First Candidate Experience | Not applicable to this slice (no recording/transcription). No conflict. | PASS (N/A) |
| III. Role-Grounded Adaptive Questioning | Not applicable to this slice (no AI questioning). No conflict. | PASS (N/A) |
| IV. Auditable Sessions & Structured Evaluations | Not applicable to this slice (no interview sessions). No conflict. | PASS (N/A) |
| V. Test Discipline (NON-NEGOTIABLE) | Unit tests for `JobCard`/`JobsGrid`/`JobsDashboard` states and for service/repository mapping; integration tests with `testcontainers` against real MongoDB for repository + `GET /api/jobs`. Single `npm test` command runs both packages. | PASS |
| Data Privacy & Security | Job data is non-sensitive; no secrets in the browser (only a base API URL); all inputs validated/bounded; CORS restricted to the frontend origin; error responses never leak internals. | PASS |
| Workflow & Quality Gates | Lint + strict type-check + tests required; API contract documented in `contracts/`; no unjustified complexity. | PASS |

**Result**: All gates pass. No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-jobs-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── jobs-api.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.ts                    # Express app factory (no listen) - testable
│   ├── server.ts                 # process entrypoint (listen)
│   ├── config.ts                 # env parsing/validation (PORT, MONGO_URL, CORS_ORIGIN)
│   ├── db/
│   │   └── mongo.ts              # client connect/close lifecycle
│   ├── models/
│   │   └── job.ts                # Job domain type + document mapping/validation
│   ├── repositories/
│   │   └── jobRepository.ts      # findAvailableJobs(): Job[]
│   ├── services/
│   │   └── jobService.ts         # listAvailableJobs() orchestration
│   ├── routes/
│   │   └── jobs.ts               # GET /api/jobs
│   └── middleware/
│       └── errorHandler.ts       # uniform JSON error envelope
├── test/
│   ├── unit/                     # service/model mapping tests (no DB)
│   └── integration/              # testcontainers MongoDB + HTTP route tests
├── jest.config.ts
├── tsconfig.json
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── JobCard.tsx           # title + brief description, accessible, activates
│   │   └── JobsGrid.tsx          # responsive 3-column CSS grid
│   ├── pages/
│   │   └── JobsDashboard.tsx     # loading/empty/error/data orchestration
│   ├── services/
│   │   └── jobsApi.ts            # fetch client + typed response
│   ├── types/
│   │   └── job.ts                # shared Job view type
│   ├── App.tsx                   # routes: / and /jobs/:id
│   └── main.tsx                  # React entrypoint
├── test/
│   └── unit/                     # React Testing Library component tests
├── jest.config.ts
├── tsconfig.json
└── package.json

package.json                      # root scripts: single `npm test` / `npm run lint`
```

**Structure Decision**: Web-application layout (backend + frontend). The two packages keep
their dependency sets isolated, which supports the "minimal dependencies" constraint: the
backend carries no React/UI packages and the frontend carries no Express/Mongo packages. A
root `package.json` holds only npm scripts that fan out to both packages so the constitution's
"tests runnable with a single documented command" gate is met without adding a monorepo tool.
The backend follows a route → service → repository layering so HTTP, business logic, and
storage can be tested independently.

## Complexity Tracking

> No violations. This section is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
