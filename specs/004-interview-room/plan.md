# Implementation Plan: Interview Room

**Branch**: `004-interview-room` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-interview-room/spec.md`

## Summary

When a candidate selects a job on the dashboard, they enter an **Interview Room** for that role: a
chat-like page that identifies the role and, before anything else happens, presents a **recording
consent banner** stating that audio will be recorded and used for internal purposes only. The
interview does not begin until the candidate explicitly accepts. Accepting records consent and
transitions the session to **in progress**; declining records the decision and returns the
candidate to the dashboard. The interview session and its consent decision are persisted and
retrievable (auditable). Interviewer question generation, candidate responses, and audio capture
are **out of scope** here and delivered by a later feature; the room ships with an empty chat-like
conversation surface ready for that content.

This builds on the existing React (TS) frontend and Express (TS) + MongoDB backend from
`001-jobs-dashboard`, reusing the route → service → repository layering, Jest tests, and
`testcontainers` integration approach.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 20 LTS+; same language front and back.

**Primary Dependencies**: Existing stack only — Express for HTTP, official `mongodb` driver (no
ODM), React 18 + React Router on the frontend, plain CSS. No new runtime dependencies.

**Storage**: MongoDB, new `interviewSessions` collection (the `jobs` collection is read for role
context). Sessions store status and the consent record.

**Testing**: Jest everywhere (existing setup). Backend: unit tests for the service/validation and
`testcontainers`-backed integration tests for the new HTTP endpoints against real MongoDB.
Frontend: React Testing Library for the room, the consent banner (accept/decline), and role
rendering.

**Target Platform**: Web application — evergreen browsers (frontend) and the existing Node
process/serverless function (backend).

**Project Type**: Web application (frontend + backend in one repository).

**Performance Goals**: The room, its role context, and the consent banner render within the
dashboard's existing "content visible quickly" expectation (≈2 s on standard broadband).

**Constraints**: Consent is a hard gate — the interview MUST NOT be in progress (and no recording
of any kind) until the candidate accepts. No audio capture, transcription, question generation,
or answers in this feature. Reuse existing error envelope, CORS, and validation patterns. Candidate
identity is implicit for now (no auth in the codebase yet), documented as an assumption.

**Scale/Scope**: One new page (Interview Room) + consent banner + empty chat surface; a small set
of interview session endpoints; one new collection. Bounded.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Component-Driven, Clear Interfaces | `InterviewRoom` page composes `ConsentBanner` + `InterviewChat`; backend splits route → service → repository with shared types. Each independently testable. | PASS |
| II. Voice-First Candidate Experience | The feature enforces the consent gate that precedes all recording; capture is out of scope here, and no transcription is surfaced. No conflict. | PASS |
| III. Role-Grounded Adaptive Questioning | Not applicable in this slice (no question generation). No conflict. | PASS (N/A) |
| IV. Auditable Sessions & Structured Evaluations | Each interview is persisted as a session retrievable by id, preserving the job↔session relationship and the consent record. Evaluation schema is out of scope. | PASS |
| V. Test Discipline (NON-NEGOTIABLE) | Unit tests for session/consent logic; `testcontainers` integration tests for the session endpoints; RTL tests for the room and banner accept/decline. Single `npm test` runs both packages. | PASS |
| Data Privacy & Security | Consent is required and recorded before any recording; the recording is treated as sensitive; no secrets in the browser; inputs (job/session ids, consent decision) are validated/bounded; errors never leak internals. | PASS |
| Workflow & Quality Gates | Lint + strict type-check + tests required; API contract documented in `contracts/`; no unjustified complexity. | PASS |

**Result**: All gates pass. No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-interview-room/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── interviews-api.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.ts                          # MODIFIED: mount the interviews router
│   ├── config.ts                       # (existing) env parsing
│   ├── db/mongo.ts                     # (existing) client lifecycle
│   ├── models/
│   │   ├── job.ts                      # (existing)
│   │   └── interviewSession.ts         # NEW: session + consent types, validation, projection
│   ├── repositories/
│   │   ├── jobRepository.ts            # MODIFIED: add findAvailableJobById(jobId)
│   │   └── interviewSessionRepository.ts # NEW: create/find/update session + consent
│   ├── services/
│   │   └── interviewService.ts         # NEW: start-or-resume session, record consent
│   └── routes/
│       ├── jobs.ts                     # (existing)
│       └── interviews.ts               # NEW: interview session endpoints
├── api/
│   └── index.ts                        # MODIFIED: wire interviewService into the app
└── test/
    ├── unit/
    │   └── interviewService.test.ts    # NEW
    └── integration/
        └── interviews.route.test.ts    # NEW (testcontainers)

frontend/
├── src/
│   ├── App.tsx                         # MODIFIED: /jobs/:id renders InterviewRoom
│   ├── components/
│   │   ├── ConsentBanner.tsx/.css      # NEW: recording notice with Accept/Decline
│   │   ├── InterviewChat.tsx/.css      # NEW: chat-like conversation surface (empty for now)
│   │   └── ... (existing JobCard/JobsGrid/AppHeader/StatusMessage)
│   ├── pages/
│   │   ├── InterviewRoom.tsx/.css      # NEW: loads session, shows role, gates on consent
│   │   └── JobDetail.tsx               # REMOVED/REPLACED by InterviewRoom
│   ├── services/
│   │   └── interviewsApi.ts            # NEW: typed client for the interview endpoints
│   └── types/
│       └── interview.ts                # NEW: shared session/consent view types
└── test/unit/
    ├── InterviewRoom.test.tsx          # NEW
    └── ConsentBanner.test.tsx          # NEW
```

**Structure Decision**: Web-application layout inherited from `001-jobs-dashboard`. The backend
follows the established route → service → repository split so consent/session logic is testable
without HTTP or a database. The frontend composes small components (`ConsentBanner`,
`InterviewChat`) into the `InterviewRoom` page, preserving the component-driven principle. The
existing `/jobs/:id` route now renders the Interview Room, reusing the dashboard's card-selection
navigation (FR-001) rather than adding a parallel path.

## Complexity Tracking

> No violations. This section is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0: Research Output

See [`research.md`](./research.md) — decisions on session persistence & identity, the API shape,
navigation, consent notice versioning/handling, role-context retrieval, gating, and testing.

## Phase 1: Design Output

- [`data-model.md`](./data-model.md) — InterviewSession, embedded ConsentRecord, and the
  (deferred) Message/Turn, with validation and state transitions.
- [`contracts/interviews-api.openapi.yaml`](./contracts/interviews-api.openapi.yaml) — the
  interview session endpoints.
- [`quickstart.md`](./quickstart.md) — local run + step-by-step verification of the consent gate.

## Constitution Re-Check (post-design)

| Principle | Post-design status |
|-----------|--------------------|
| I. Component-Driven, Clear Interfaces | PASS — page composed of `ConsentBanner` + `InterviewChat`; backend layered. |
| II. Voice-First Candidate Experience | PASS — consent gate enforced before any recording; capture deferred, no client transcription. |
| IV. Auditable Sessions | PASS — session + consent persisted and retrievable by id. |
| V. Test Discipline | PASS — unit + integration + component tests specified. |
| Data Privacy & Security | PASS — consent recorded, inputs validated, no secrets in browser. |
| Workflow & Quality Gates | PASS — contract documented; no new dependencies; complexity none. |

**Result**: All gates still pass after Phase 1 design.
