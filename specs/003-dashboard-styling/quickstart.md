# Quickstart: Dashboard Styling & Branding

**Feature**: `003-dashboard-styling` | **Date**: 2026-10-07

How to run and visually verify the restyled dashboard. Paths match [plan.md](./plan.md).

## Prerequisites

- Node.js 20 LTS or newer (npm included)
- Frontend dependencies installed: `npm --prefix frontend install`
- Optionally the backend running with seeded data so the grid has cards:
  `npm --prefix backend run dev` (and `npm --prefix backend run seed`)

## Run

```bash
# terminal 1 - API (optional, for real data)
npm --prefix backend run dev

# terminal 2 - web app
npm --prefix frontend run dev
```

Open the frontend URL (default `http://localhost:5173`).

## Visual verification checklist

Open DevTools responsive mode and check each viewport range (e.g. 360px, 768px, 1024px, 1440px+).

1. **Black background (FR-001 / SC-001)**: the entire viewport is dark in every state — loading,
   empty, error, and with data. No white flash on load and no light gaps or bands.
2. **Branded header (FR-002/FR-003 / SC-002)**: `AfterQuery Interviewer Platform` appears at the
   top, horizontally centered, and is large/legible at both mobile and desktop widths. It remains
   visible while the dashboard is loading.
3. **Centered loading (FR-004–FR-006 / SC-003)**: throttle the network (DevTools → Slow 3G) or
   point the frontend at a stopped API and reload. A clear loading message is centered in the
   window for the duration of the load.
4. **Empty state (FR-007)**: with an empty catalogue, a centered, legible "no jobs" message is
   shown on the dark theme.
5. **Error state (FR-007 / FR-014)**: stop the API and reload to see a centered error message
   with a visible, keyboard-focusable **Retry** action.
6. **Card comfort (FR-008 / SC-004)**: with data, cards are generously sized; titles and
   descriptions are easy to read and cards are easy to select. No clipped or overflowing text.
7. **Responsive grid (FR-009 / SC-007)**: three columns at desktop width, two around 768px, one at
   mobile width, with no horizontal scrolling.
8. **Restrained palette & contrast (FR-010/FR-011 / SC-005/SC-006)**: the UI uses a dark base,
   neutral text, and a single accent. Text is high-contrast (spot-check with a contrast tool;
   target ≥ 4.5:1).
9. **Keyboard & focus (FR-013/FR-014)**: Tab through the header, cards, and Retry button; focus is
   clearly visible on the dark background; activating a card still navigates to the correct job.

## Test

```bash
npm --prefix frontend test
```

> Existing dashboard/grid/card suites must continue to pass; new `AppHeader` and `StatusMessage`
> suites cover the heading and centered status messaging.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
```

All three MUST pass (constitution Development Workflow & Quality Gates).
