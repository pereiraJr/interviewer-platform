---
description: "Task list for Jobs Dashboard implementation"
---

# Tasks: Jobs Dashboard

**Input**: Design documents from `/specs/001-jobs-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: REQUIRED where applicable per the project constitution (Principle V, NON-NEGOTIABLE). Unit tests cover component/pure logic; integration tests use `testcontainers` against a real MongoDB. Test tasks are written first and MUST fail before the matching implementation task begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` and `frontend/` at repository root, each an independent npm package
- **Backend tests**: `backend/test/unit/`, `backend/test/integration/`
- **Frontend tests**: `frontend/test/unit/`
- Root `package.json` only holds fan-out scripts (`test`, `lint`, `typecheck`, `seed`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create root `package.json` with fan-out scripts (`test`, `lint`, `typecheck`, `seed`) that delegate to `backend/` and `frontend/`
- [X] T002 [P] Initialize backend package and tooling: `backend/package.json`, `backend/tsconfig.json` (strict), `backend/jest.config.ts`, `backend/.eslintrc.cjs`
- [X] T003 [P] Initialize frontend package and tooling: `frontend/package.json`, `frontend/tsconfig.json` (strict), `frontend/jest.config.ts`, `frontend/vite.config.ts`, `frontend/.eslintrc.cjs`
- [X] T004 [P] Create backend source skeleton per plan: `backend/src/{app.ts,server.ts,config.ts}`, `backend/src/{db,models,repositories,services,routes,middleware}/`, `backend/test/{unit,integration}/`
- [X] T005 [P] Create frontend source skeleton per plan: `frontend/src/{App.tsx,main.tsx}`, `frontend/src/{components,pages,services,types}/`, `frontend/test/unit/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Implement backend configuration loader in `backend/src/config.ts` (parse/validate `PORT`, `MONGO_URL`, `MONGO_DB`, `CORS_ORIGIN`)
- [X] T007 [P] Implement MongoDB client lifecycle (connect, `getDb`, close) in `backend/src/db/mongo.ts`
- [X] T008 [P] Define `Job` domain type, document→`JobSummary` mapping, and field validation in `backend/src/models/job.ts`
- [X] T009 Implement `jobRepository.findAvailableJobs()` using the driver and mapping in `backend/src/repositories/jobRepository.ts` (depends on T007, T008)
- [X] T010 Implement `jobService.listAvailableJobs()` in `backend/src/services/jobService.ts` (depends on T009)
- [X] T011 [P] Implement uniform JSON error-handling middleware (`{ error: { code, message } }`) in `backend/src/middleware/errorHandler.ts`
- [X] T012 Implement Express app factory (CORS restricted to `CORS_ORIGIN`, JSON parsing, route mounting, error handler) in `backend/src/app.ts` (depends on T011)
- [X] T013 Implement server entrypoint and graceful shutdown in `backend/src/server.ts` (depends on T006, T012)
- [X] T014 Implement testcontainers MongoDB harness for integration tests in `backend/test/integration/mongoContainer.ts` (depends on T007)
- [X] T015 [P] Define frontend `Job` view type in `frontend/src/types/job.ts`
- [X] T016 Implement typed jobs API client calling `GET /api/jobs` in `frontend/src/services/jobsApi.ts` (depends on T015)
- [X] T017 Implement React app shell and router with the `/` route in `frontend/src/App.tsx` and `frontend/src/main.tsx` (depends on T015)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Browse available jobs (Priority: P1) 🎯 MVP

**Goal**: Candidate sees every available job as a card (title + brief description) in a three-column grid, with loading, empty, and error states.

**Independent Test**: Seed jobs, load the dashboard, and confirm every job appears once as a card with title and brief description in a three-column grid; confirm the empty state when no jobs exist.

### Tests for User Story 1 (REQUIRED where applicable - Principle V) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T018 [P] [US1] Unit tests for `Job` mapping/validation (required title, `description ?? ""`, length bounds) in `backend/test/unit/job.model.test.ts`
- [X] T019 [P] [US1] Unit tests for `jobService.listAvailableJobs` with a mocked repository in `backend/test/unit/jobService.test.ts`
- [X] T020 [P] [US1] Contract/integration test for `GET /api/jobs` response shape (`{ jobs: JobSummary[] }`) using testcontainers in `backend/test/integration/jobs.route.test.ts`
- [X] T021 [P] [US1] Unit tests for `JobCard` rendering title and description, including empty description, in `frontend/test/unit/JobCard.test.tsx`
- [X] T022 [P] [US1] Unit tests for `JobsGrid` rendering N cards and the grid container in `frontend/test/unit/JobsGrid.test.tsx`
- [X] T023 [P] [US1] Unit tests for `JobsDashboard` loading/success/empty/error states in `frontend/test/unit/JobsDashboard.test.tsx`

### Implementation for User Story 1

- [X] T024 [US1] Implement `GET /api/jobs` route handler in `backend/src/routes/jobs.ts` (depends on T010, T012)
- [X] T025 [P] [US1] Implement `JobCard` component (title + brief description) in `frontend/src/components/JobCard.tsx` and `frontend/src/components/JobCard.css`
- [X] T026 [P] [US1] Implement `JobsGrid` component (three-column CSS Grid) in `frontend/src/components/JobsGrid.tsx` and `frontend/src/components/JobsGrid.css`
- [X] T027 [US1] Implement `JobsDashboard` page orchestrating fetch plus loading/empty/error states in `frontend/src/pages/JobsDashboard.tsx` and `frontend/src/pages/JobsDashboard.css` (depends on T016, T025, T026)
- [X] T028 [US1] Implement backend job seed script in `backend/src/seed.ts` (depends on T007, T008)
- [X] T029 [US1] Add backend `seed` npm script and sample jobs for local verification in `backend/package.json` (depends on T028)

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Select a job to continue (Priority: P2)

**Goal**: Activating a job card navigates the candidate to that job's detail view (`/jobs/:id`).

**Independent Test**: Activate a card (mouse and keyboard) and confirm navigation to `/jobs/:id` for the correct job.

### Tests for User Story 2 (REQUIRED where applicable - Principle V) ⚠️

- [X] T030 [P] [US2] Unit tests for `JobCard` activation semantics (click and Enter/Space trigger selection) in `frontend/test/unit/JobCard.activation.test.tsx`
- [X] T031 [P] [US2] Unit tests for `JobsDashboard` navigating to `/jobs/:id` on selection in `frontend/test/unit/JobsDashboard.navigation.test.tsx`

### Implementation for User Story 2

- [X] T032 [US2] Add placeholder job detail page and `/jobs/:id` route in `frontend/src/pages/JobDetail.tsx` and `frontend/src/App.tsx` (depends on T017)
- [X] T033 [US2] Make `JobCard` an accessible interactive element (link/button semantics, focus, Enter/Space) that emits selection in `frontend/src/components/JobCard.tsx` (depends on T025)
- [X] T034 [US2] Handle selection in `JobsDashboard` and navigate to the job detail route in `frontend/src/pages/JobsDashboard.tsx` (depends on T027, T032, T033)

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Responsive browsing across devices (Priority: P3)

**Goal**: The grid reflows (3 → 2 → 1 columns) so cards stay readable and selectable on narrower viewports.

**Independent Test**: Reduce viewport width and confirm the grid reflows with no horizontal scrolling and cards remain fully readable.

### Tests for User Story 3 (REQUIRED where applicable - Principle V) ⚠️

- [X] T035 [P] [US3] Unit test asserting the grid exposes its responsive layout contract (columns/class) in `frontend/test/unit/JobsGrid.responsive.test.tsx`

### Implementation for User Story 3

- [X] T036 [US3] Add responsive media queries (3 → 2 → 1 columns) to `frontend/src/components/JobsGrid.css` (depends on T026)
- [X] T037 [US3] Add card content containment/truncation styles to `frontend/src/components/JobCard.css` (depends on T025)
- [X] T038 [US3] Validate no horizontal scrolling and readability across breakpoints per `specs/001-jobs-dashboard/quickstart.md` (depends on T036, T037)

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T039 [P] Configure backend ESLint + strict typecheck and resolve issues across `backend/`
- [X] T040 [P] Configure frontend ESLint + strict typecheck and resolve issues across `frontend/`
- [X] T041 [P] Accessibility pass (roles, labels, focus order) on `frontend/src/components/JobCard.tsx`, `frontend/src/components/JobsGrid.tsx`, and `frontend/src/pages/JobsDashboard.tsx`
- [X] T042 Integration test for the error envelope (`500`) in `backend/test/integration/errorHandling.test.ts`
- [X] T043 Ensure `npm test`/`npm run lint`/`npm run typecheck` fan out and pass via root `package.json`, `backend/package.json`, and `frontend/package.json`
- [X] T044 Validate `quickstart.md` end-to-end and update any drifted commands in `specs/001-jobs-dashboard/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational - no dependency on other stories
- **User Story 2 (P2)**: Starts after Foundational - extends `JobCard`/`JobsDashboard` from US1 but remains independently testable
- **User Story 3 (P3)**: Starts after Foundational - refines `JobsGrid`/`JobCard` styles from US1 but remains independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/repositories before services; services before endpoints
- Components before page orchestration
- Story complete before moving to the next priority

### Parallel Opportunities

- All `[P]` Setup tasks (T002–T005) can run in parallel
- All `[P]` Foundational tasks (T007, T008, T011, T015) can run in parallel within their dependency limits
- All `[P]` US1 test tasks (T018–T023) can run in parallel; `[P]` component tasks T025/T026 can run in parallel
- `[P]` US2 tests (T030, T031) run in parallel; `[P]` US3 test (T035) is independent
- `[P]` Polish tasks T039, T040, T041 run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together:
Task: "Unit tests for Job mapping/validation in backend/test/unit/job.model.test.ts"
Task: "Integration test for GET /api/jobs in backend/test/integration/jobs.route.test.ts"
Task: "Unit tests for JobCard in frontend/test/unit/JobCard.test.tsx"
Task: "Unit tests for JobsGrid in frontend/test/unit/JobsGrid.test.tsx"
Task: "Unit tests for JobsDashboard states in frontend/test/unit/JobsDashboard.test.tsx"

# Launch the independent components together:
Task: "Implement JobCard in frontend/src/components/JobCard.tsx"
Task: "Implement JobsGrid in frontend/src/components/JobsGrid.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Seed jobs and verify the dashboard independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → test independently → demo (MVP)
3. Add User Story 2 → test independently → demo
4. Add User Story 3 → test independently → demo

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories integrate independently

---

## Notes

- `[P]` tasks = different files, no dependencies
- `[Story]` label maps a task to its user story for traceability
- Every user story is independently completable and testable
- Verify tests fail before implementing (Principle V)
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
