---
description: "Task list for Dashboard Styling & Branding implementation"
---

# Tasks: Dashboard Styling & Branding

**Input**: Design documents from `/specs/003-dashboard-styling/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: REQUIRED where applicable (project constitution, Principle V, NON-NEGOTIABLE). Component, heading, and state behavior are covered with React Testing Library; visual centering/contrast are verified manually via `quickstart.md` (CSS is mocked in Jest).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. The global dark-theme stylesheet is a foundational prerequisite shared by all stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: frontend lives at `frontend/src/`, tests at `frontend/test/unit/`
- Documentation for this feature lives at `specs/003-dashboard-styling/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the frontend tooling the styling relies on. No new dependencies are introduced.

- [X] T001 [P] Verify the frontend dev/test setup (Vite, Jest + React Testing Library, CSS mocked via `frontend/test/styleMock.js`) and confirm no new dependencies are needed in `frontend/package.json` and `frontend/jest.config.js`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The global dark-theme base that every screen and state depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `frontend/src/styles/global.css` defining the dark theme base: CSS custom-property tokens (near-black `--color-bg`, black page background, elevated `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`, single `--color-accent`, and a small spacing/radius scale); document-level (`html`, `body`, `#root`) full-height dark background; base typography; and a visible `:focus-visible` outline. Import it once in `frontend/src/main.tsx`.

**Checkpoint**: The app has a full-viewport dark base with tokens — user stories can now begin.

---

## Phase 3: User Story 1 - Branded dark dashboard (Priority: P1) 🎯 MVP

**Goal**: Every screen has the dark background and a centered, prominent `AfterQuery Interviewer Platform` top-level heading, with the dashboard's "Available jobs" retained as a smaller section heading.

**Independent Test**: Load the app and verify the background is dark across the viewport and the product name appears as a centered, level-1 heading; on the dashboard, "Available jobs" appears as a lower-level heading.

### Tests for User Story 1 (REQUIRED - Principle V) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [X] T003 [P] [US1] Unit test `AppHeader` in `frontend/test/unit/AppHeader.test.tsx`: renders exactly `AfterQuery Interviewer Platform` as a level-1 heading (`getByRole('heading', { level: 1 })`).
- [X] T004 [P] [US1] Unit test the heading hierarchy in `frontend/test/unit/JobsDashboard.test.tsx`: with jobs loaded, an `Available jobs` section heading is present at a lower level than a level-1 heading; loading/empty/error/data states still render.

### Implementation for User Story 1

- [X] T005 [US1] Create `frontend/src/components/AppHeader.tsx` and `frontend/src/components/AppHeader.css`: a centered `<h1>` "AfterQuery Interviewer Platform" with responsive `clamp()` sizing and comfortable vertical spacing on the dark theme.
- [X] T006 [US1] Render the app shell in `frontend/src/App.tsx`: place `<AppHeader />` above the routed pages so it persists across all routes.
- [X] T007 [US1] Update `frontend/src/pages/JobsDashboard.tsx` to render "Available jobs" as a lower-level section heading (e.g., `<h2>`) in the data state, keeping the existing text so current tests continue to pass; style it in `frontend/src/pages/JobsDashboard.css`.

**Checkpoint**: MVP — the app is branded, dark, and correctly headed.

---

## Phase 4: User Story 2 - Clear, centered loading feedback (Priority: P2)

**Goal**: While jobs load, a clear message centered in the window is shown; empty and error states are consistent and legible on the dark theme.

**Independent Test**: Throttle the network and confirm a centered loading message is visible until content appears; empty and error states are centered and legible.

### Tests for User Story 2 (REQUIRED - Principle V) ⚠️

- [X] T008 [P] [US2] Unit test `StatusMessage` in `frontend/test/unit/StatusMessage.test.tsx`: the loading variant exposes `role="status"` with a message communicating that jobs are loading; the error variant exposes `role="alert"`; the empty variant renders its message.

### Implementation for User Story 2

- [X] T009 [US2] Create `frontend/src/components/StatusMessage.tsx` and `frontend/src/components/StatusMessage.css`: a reusable centered message surface (flex centering with a minimum block size below the header) supporting loading/empty/error variants with appropriate roles; error variant can host the Retry action.
- [X] T010 [US2] Update `frontend/src/pages/JobsDashboard.tsx` so the loading, empty, and error states render through `StatusMessage` (keep `role="status"`/`role="alert"` and the existing Retry button and empty-state text).
- [X] T011 [US2] Update `frontend/src/pages/JobsDashboard.css` so the centered states sit correctly on the dark theme with the header above them.

**Checkpoint**: Loading, empty, and error states are clear, centered, and legible.

---

## Phase 5: User Story 3 - Comfortable cards and restrained color (Priority: P3)

**Goal**: Job cards are comfortably sized and readable across resolutions, the layout stays centered with a sensible max width, and the palette remains restrained.

**Independent Test**: View the dashboard across widths; cards are comfortable/readable, the grid reflows 3→2→1 without horizontal scrolling, and colors stay within the dark base + neutral text + one accent.

### Tests for User Story 3 (REQUIRED - Principle V) ⚠️

- [X] T012 [P] [US3] Verify/update the responsive and interaction suites — `frontend/test/unit/JobsGrid.responsive.test.tsx`, `frontend/test/unit/JobCard.test.tsx`, and `frontend/test/unit/JobsDashboard.navigation.test.tsx` — to confirm three/fewer-column behavior, card rendering, and card-selection navigation are preserved.

### Implementation for User Story 3

- [X] T013 [US3] Restyle `frontend/src/components/JobCard.css`: dark elevated surface with subtle border, comfortable minimum height and padding, larger readable title/description sizes, accent action button, and visible focus.
- [X] T014 [US3] Restyle `frontend/src/components/JobsGrid.css`: larger gap, centered maximum content width, and the existing responsive breakpoints preserved (3 columns desktop, 2 ≤ 900px, 1 ≤ 600px).
- [X] T015 [US3] Apply dark-theme consistency to `frontend/src/pages/JobDetail.tsx` (and a small stylesheet if needed) so the detail route does not render a light page.

**Checkpoint**: Cards and palette are comfortable, readable, and consistent across resolutions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility/contrast verification, quality gates, and documentation alignment.

- [X] T016 [P] Audit the palette and contrast across `frontend/src/styles/global.css` and component CSS: no more than three accent colors in addition to the dark base and neutral text (SC-006), and text meets WCAG AA ≥ 4.5:1 (SC-005); adjust token values if needed.
- [X] T017 Run `npm run lint`, `npm run typecheck`, and `npm test` from the repository root and fix any failures (constitution quality gates).
- [X] T018 Walk the `specs/003-dashboard-styling/quickstart.md` visual checklist across viewport ranges (360px, 768px, 1024px, 1440px+) and update the quickstart if any step no longer matches the implementation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion.
  - US1 (P1) is the MVP and should be completed first.
  - US2 (P2) wraps the dashboard states and depends on US1's shell/heading context.
  - US3 (P3) restyles cards/grid and is independent of US2, though it shares `JobsDashboard.css`.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **US2 (P2)**: Can start after Foundational; touches `JobsDashboard.tsx`/`.css` (also touched by US1) — sequence after US1.
- **US3 (P3)**: Can start after Foundational; separate card/grid CSS files, but `JobDetail.tsx` and shared layout touch US1's shell — sequence after US1.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Components before wiring them into pages.
- Core implementation before styling polish.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Setup: T001 alone.
- US1: T003 and T004 are [P] (different test files); T005 (component) can proceed alongside them.
- US2: T008 is [P] (separate test file).
- US3: T012 [P]; T013 and T014 are [P] (different CSS files).
- Polish: T016 [P].

---

## Parallel Example: User Story 1

```bash
# Write the US1 tests first (expect failure):
Task: "Unit test AppHeader in frontend/test/unit/AppHeader.test.tsx"
Task: "Heading hierarchy test in frontend/test/unit/JobsDashboard.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: dark background + branded heading visible on the dashboard.
5. Deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → dark base and tokens ready.
2. US1 → branded, dark, correctly headed app (MVP).
3. US2 → clear centered loading/empty/error feedback.
4. US3 → comfortable cards and restrained palette.
5. Polish → contrast audit, quality gates, quickstart validation.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] labels map tasks to user stories for traceability.
- CSS is mocked in Jest (`frontend/test/styleMock.js`), so tests assert semantics/roles/behavior; visual centering and color are verified via the quickstart.
- Preserve existing accessible roles (`role="status"` for loading, `role="alert"` for error) and the existing empty/error text so current tests keep passing.
- No new dependencies; styling uses plain, component-scoped CSS plus one global stylesheet.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
