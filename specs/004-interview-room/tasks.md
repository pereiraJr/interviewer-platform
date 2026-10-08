---
description: "Task list for Interview Room implementation"
---

# Tasks: Interview Room

**Input**: Design documents from `/specs/004-interview-room/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/interviews-api.openapi.yaml, quickstart.md

**Tests**: REQUIRED where applicable (project constitution, Principle V, NON-NEGOTIABLE). Backend unit + `testcontainers` integration tests and frontend React Testing Library tests cover the room, the session endpoints, and the consent gate.

**Organization**: Tasks are grouped by user story. The interview-session model/repository/service are foundational (shared by entering the room and recording consent).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: backend `backend/src/`, backend tests `backend/test/`; frontend `frontend/src/`, frontend tests `frontend/test/unit/`
- Docs for this feature: `specs/004-interview-room/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm tooling and dependencies. No new runtime dependencies are introduced.

- [X] T001 [P] Verify backend/frontend test, lint, and typecheck tooling (Jest, ts-jest, RTL, `testcontainers`) and confirm no new dependencies are needed in `backend/package.json` and `frontend/package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The interview-session domain and persistence used by both entering the room and recording consent.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `backend/src/models/interviewSession.ts`: status enum (`consent_pending`, `in_progress`, `declined`), consent decision enum (`accepted`, `declined`), `InterviewSessionDocument`, the `InterviewSessionView` projection, the versioned recording-notice constant, and validation helpers (decision/status validity, notice version).
- [X] T003 [P] Add `findAvailableJobById(jobId: string)` to `backend/src/repositories/jobRepository.ts`, returning the `JobSummary` (with stringified id) or `null` for unknown/unavailable jobs.
- [X] T004 Create `backend/src/repositories/interviewSessionRepository.ts`: `findResumableByJobId(jobId)`, `create(jobId)`, `findById(id)`, and `recordConsent(id, decision)` (sets status and embedded consent record).
- [X] T005 Create `backend/src/services/interviewService.ts` exposing `startOrResume(jobId)`, `getById(id)`, and `recordConsent(id, decision)`; validate inputs, throw `HttpError(404)` for unknown job/session and `HttpError(400)` for an invalid decision, and build the `InterviewSessionView` (join job context + notice).
- [X] T006 [P] Unit test `backend/test/unit/interviewService.test.ts` with mocked repositories: start-or-resume returns a pre-consent session with role context; `accepted` → `in_progress`; `declined` → not in progress; invalid decision → 400; unknown job/session → 404.

**Checkpoint**: Session domain + service ready — user stories can begin.

---

## Phase 3: User Story 1 - Enter the Interview Room for a role (Priority: P1) 🎯 MVP

**Goal**: Selecting a job opens a chat-like Interview Room that identifies the correct role.

**Independent Test**: Select a job and verify the room opens for that role, shows a chat-like layout, and derives the role from the session endpoint (unknown role guides back to the dashboard).

### Tests for User Story 1 (REQUIRED - Principle V) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [X] T007 [P] [US1] Backend integration test in `backend/test/integration/interviews.route.test.ts` (testcontainers MongoDB): `POST /api/jobs/:jobId/interview` creates a `consent_pending` session with the role context; a second call resumes the same session; unknown/unavailable `jobId` → `404`.
- [X] T008 [P] [US1] Frontend unit test in `frontend/test/unit/InterviewRoom.test.tsx`: the room renders the role title/description from the session and a chat-like conversation region.

### Implementation for User Story 1

- [X] T009 [US1] Create `backend/src/routes/interviews.ts` with `POST /api/jobs/:jobId/interview` and `GET /api/interviews/:id`; mount the router in `backend/src/app.ts` and wire `interviewService` in `backend/api/index.ts` (using the existing Mongo connection + job repository).
- [X] T010 [US1] Create `frontend/src/types/interview.ts` and `frontend/src/services/interviewsApi.ts` (typed client: `startOrResumeInterview(jobId)`, `getInterviewSession(id)`).
- [X] T011 [P] [US1] Create `frontend/src/components/InterviewChat.tsx` + `frontend/src/components/InterviewChat.css`: the chat-like conversation surface (empty state for now, ready for later turns).
- [X] T012 [US1] Create `frontend/src/pages/InterviewRoom.tsx` + `frontend/src/pages/InterviewRoom.css`: load the session for the route's `:id`, display the role, render `InterviewChat`, and redirect to the dashboard when the role is invalid (FR-015).
- [X] T013 [US1] Update `frontend/src/App.tsx` so `/jobs/:id` renders `InterviewRoom`, and remove the obsolete `frontend/src/pages/JobDetail.tsx` (+ `JobDetail.css`).

**Checkpoint**: MVP — selecting a job opens the correct Interview Room.

---

## Phase 4: User Story 2 - Recording consent before the interview starts (Priority: P2)

**Goal**: Before anything else, the room shows a recording-consent banner; the interview cannot begin until the candidate accepts, and declining returns to the dashboard.

**Independent Test**: First entry shows the banner; the session is not `in_progress` before acceptance; accepting dismisses the banner and starts the interview; declining returns to the dashboard.

### Tests for User Story 2 (REQUIRED - Principle V) ⚠️

- [X] T014 [US2] Extend `backend/test/integration/interviews.route.test.ts` with consent cases: `POST /api/interviews/:id/consent` with `accepted` → `in_progress` and a consent record; `declined` → not in progress; invalid decision → `400`; unknown session → `404`.
- [X] T015 [P] [US2] Frontend unit test in `frontend/test/unit/ConsentBanner.test.tsx`: renders a notice stating audio is recorded and used for internal purposes only, exposes accessible Accept/Decline controls, and fires the correct callbacks via keyboard.

### Implementation for User Story 2

- [X] T016 [US2] Add `POST /api/interviews/:id/consent` to `backend/src/routes/interviews.ts`: validate the body `{ decision }`, call `interviewService.recordConsent`, and return the updated session (errors via the existing envelope).
- [X] T017 [P] [US2] Create `frontend/src/components/ConsentBanner.tsx` + `frontend/src/components/ConsentBanner.css`: an accessible, labelled banner with the recording notice and Accept/Decline buttons.
- [X] T018 [US2] Extend `frontend/src/services/interviewsApi.ts` with `recordConsent(id, decision)`.
- [X] T019 [US2] Integrate the gate in `frontend/src/pages/InterviewRoom.tsx`: show `ConsentBanner` while status is `consent_pending`; on Accept call the API and show the in-progress room; on Decline call the API and navigate to the dashboard.

**Checkpoint**: Consent is enforced end-to-end; accepting starts the interview, declining exits.

---

## Phase 5: User Story 3 - The interview begins after consent (Priority: P3)

**Goal**: After acceptance the room shows the interview as in progress; returning to an already-consented session does not re-show the banner.

**Independent Test**: Accept the banner and verify the room shows an in-progress interview with the active chat surface; reload and confirm the banner is not shown again.

### Tests for User Story 3 (REQUIRED - Principle V) ⚠️

- [X] T020 [P] [US3] Extend `frontend/test/unit/InterviewRoom.test.tsx`: pre-consent shows the banner and no in-progress state; after accepting, the banner is gone and the interview shows in progress; a session already `in_progress` never shows the banner.

### Implementation for User Story 3

- [X] T021 [US3] Render the in-progress state in `frontend/src/pages/InterviewRoom.tsx` and make `frontend/src/components/InterviewChat.tsx` present the active conversation surface once the interview has begun (still empty, no capture).

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, docs, and quality gates.

- [X] T022 [P] Accessibility pass over `frontend/src/components/ConsentBanner.tsx` and `frontend/src/pages/InterviewRoom.tsx`: labelled region, associated notice text, visible focus, full keyboard operation, and an appropriate live region for state changes (FR-014/SC-006).
- [X] T023 [P] Update `specs/004-interview-room/quickstart.md` if any step no longer matches the implementation.
- [X] T024 Run `npm run lint`, `npm run typecheck`, and `npm test` from the repository root and fix any failures (constitution quality gates).
- [X] T025 Walk `specs/004-interview-room/quickstart.md` end-to-end (enter room, accept, reload, decline, unknown role) and correct any mismatches.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational.
  - US1 (P1) is the MVP.
  - US2 (P2) adds the consent endpoint + banner; depends on US1's route/page.
  - US3 (P3) refines the post-consent state in the same page; depends on US2.
- **Polish (Phase 6)**: Depends on all stories.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No other story dependencies.
- **US2 (P2)**: Depends on US1 (route handler + `InterviewRoom` page exist).
- **US3 (P3)**: Depends on US2 (the accept path must exist).

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Model before repository before service before routes.
- Backend endpoints before frontend integration.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Setup: T001 alone.
- Foundational: T003 and T006 are [P] (repo method / test file) once T002 exists.
- US1: T007 and T008 are [P] (backend integration vs frontend component test); T011 [P].
- US2: T015 and T017 are [P] (test file / banner component).
- US3: T020 [P].
- Polish: T022 and T023 are [P].

---

## Parallel Example: User Story 1

```bash
# Write the US1 tests first (expect failure):
Task: "Backend integration test for enter-room in backend/test/integration/interviews.route.test.ts"
Task: "InterviewRoom component test in frontend/test/unit/InterviewRoom.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: selecting a job opens the correct room.
5. Deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → session domain/service ready.
2. US1 → selecting a job opens the Interview Room (MVP).
3. US2 → the recording-consent gate is enforced; decline returns to dashboard.
4. US3 → accepted sessions show in progress and never re-prompt.
5. Polish → accessibility, docs, quality gates.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] labels map tasks to user stories for traceability.
- Consent is the authoritative server-side gate (session `status`); the UI mirrors it. No audio capture, messages, questioning, or transcription exist in this feature.
- Candidate identity is implicit (no auth yet); sessions resume per job (see `research.md` Decision 1).
- Reuse the existing uniform error envelope and card-selection navigation.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
