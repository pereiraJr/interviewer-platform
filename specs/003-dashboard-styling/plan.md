# Implementation Plan: Dashboard Styling & Branding

**Branch**: `003-dashboard-styling` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-dashboard-styling/spec.md`

## Summary

Restyle the candidate-facing frontend into a branded, dark-themed experience. Deliver a global
dark (black) base theme, a centered and prominently sized `AfterQuery Interviewer Platform`
heading as the single top-level heading of the app, a clearly centered loading message (and
consistent empty/error states) on the dashboard, and comfortably sized job cards that stay
readable from small mobile to large desktop. The existing "Available jobs" label is retained as a
smaller section heading below the product title. The palette stays restrained — a dark base,
neutral high-contrast text, and a single accent — meeting WCAG AA contrast. This is a
presentation-only change delivered with the existing React + TypeScript + plain-CSS stack;
existing behavior, accessibility, and the responsive three-column grid are preserved. No new
dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) with React 18 on Vite. Frontend-only feature.

**Primary Dependencies**: React 18, React Router (existing). Styling uses plain CSS with
component-scoped stylesheets — consistent with `001-jobs-dashboard` and the "minimal
dependencies" constraint. No CSS framework or component library is added.

**Testing**: Jest with `@testing-library/react` + `@testing-library/jest-dom` (existing
frontend setup), using behavior- and accessibility-oriented queries. Existing component suites
must continue to pass.

**Storage**: N/A — presentation-only; no data or persistence changes.

**Target Platform**: Modern evergreen browsers (frontend). Responsive from roughly 360px to
1440px+ viewports.

**Project Type**: Web application (frontend half of the repository).

**Performance Goals**: No measurable regression; the dark theme is plain CSS, so first render
stays within the existing 2 s budget (dashboard SC-006 from `001`).

**Constraints**: No new dependencies; plain CSS only; preserve the existing loading/empty/error
states, keyboard operability, and three-column responsive grid; meet WCAG AA contrast (≥ 4.5:1
for normal text) on the dark theme.

**Scale/Scope**: A global stylesheet, one app header component, one centered status-message
component, and restyles of the dashboard, grid, and card (~4 CSS files + 2 small components).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Component-Driven, Clear Interfaces | The shell is factored into a reusable `AppHeader` and a reusable `StatusMessage` (loading/empty/error), each with a single responsibility and independently testable; presentational CSS stays scoped to components. | PASS |
| II. Voice-First Candidate Experience | Not applicable (no recording/transcription in this feature). | PASS (N/A) |
| III. Role-Grounded Adaptive Questioning | Not applicable (no AI questioning in this feature). | PASS (N/A) |
| IV. Auditable Sessions & Structured Evaluations | Not applicable (no session data touched). | PASS (N/A) |
| V. Test Discipline (NON-NEGOTIABLE) | New components (`AppHeader`, `StatusMessage`) get unit tests; existing `JobsDashboard`/`JobsGrid`/`JobCard` suites must continue to pass; tests assert the heading, centered status messaging, and preserved behavior via accessible queries. | PASS |
| Data Privacy & Security | No data, secrets, or network changes; purely visual. | PASS (N/A) |
| Workflow & Quality Gates | Lint + strict type-check + tests remain required; no external interface so no contract; no unjustified complexity (reuses existing components and CSS approach). | PASS |

**Result**: All gates pass. No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-dashboard-styling/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

> No `contracts/` directory: this feature exposes no external interface (presentation-only).

### Source Code (repository root)

```text
frontend/
├── index.html                        # (existing) page background must not flash light
├── src/
│   ├── main.tsx                      # MODIFIED: import the global stylesheet
│   ├── App.tsx                       # MODIFIED: render the app shell (AppHeader + routed page)
│   ├── styles/
│   │   └── global.css                # NEW: dark base theme, typography, box-sizing, focus styles
│   ├── components/
│   │   ├── AppHeader.tsx             # NEW: centered "AfterQuery Interviewer Platform" H1
│   │   ├── AppHeader.css             # NEW
│   │   ├── StatusMessage.tsx         # NEW: centered loading/empty/error message surface
│   │   ├── StatusMessage.css         # NEW
│   │   ├── JobCard.tsx               # (existing) unchanged structure
│   │   ├── JobCard.css               # MODIFIED: dark card surface, comfortable sizing, contrast
│   │   ├── JobsGrid.tsx              # (existing) unchanged
│   │   └── JobsGrid.css              # MODIFIED: spacing, max content width, preserved breakpoints
│   └── pages/
│       ├── JobsDashboard.tsx         # MODIFIED: shell + StatusMessage states; keep "Available jobs" section heading
│       ├── JobsDashboard.css         # MODIFIED: dark layout, centered states, section-heading styles
│       └── JobDetail.tsx             # MODIFIED: dark-theme consistency for the detail route
├── jest.config.js                    # (existing) CSS mocked via styleMock
└── test/
    └── unit/
        ├── AppHeader.test.tsx        # NEW: heading text/semantics
        ├── StatusMessage.test.tsx     # NEW: centered loading/empty/error messaging
        └── JobsDashboard.test.tsx    # (existing) updated/kept for loading/empty/error/data states
```

**Structure Decision**: Web-application layout inherited from `001-jobs-dashboard`; this feature
touches the `frontend/` package only. The app shell is introduced in `App.tsx` so the branded
header and dark base persist across routes, while the dashboard keeps owning its data states and
delegates their visual presentation to a reusable `StatusMessage` component. Styling remains
plain, component-scoped CSS with one global stylesheet for the theme base — no new tooling or
dependencies.

## Complexity Tracking

> No violations. This section is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0: Research Output

See [`research.md`](./research.md) — decisions on the theming approach, color/contrast strategy,
header placement, centered status states, card sizing, and preserving accessibility/behavior.

## Phase 1: Design Output

- [`data-model.md`](./data-model.md) — no entities; documents the presentation-only nature and
  the UI component/state contract.
- [`quickstart.md`](./quickstart.md) — how to run and visually verify the styled dashboard.
- No contracts: no external interface.

## Constitution Re-Check (post-design)

| Principle | Post-design status |
|-----------|--------------------|
| I. Component-Driven, Clear Interfaces | PASS — `AppHeader` and `StatusMessage` are single-purpose, reusable, independently testable. |
| V. Test Discipline | PASS — unit tests for new components; existing component suites preserved. |
| Workflow & Quality Gates | PASS — no new dependencies; plain CSS; complexity justified as none. |
| Accessibility (constitution Data Privacy & Security / quality gates) | PASS — WCAG AA contrast, visible focus, state not conveyed by color alone. |

**Result**: All gates still pass after Phase 1 design.
