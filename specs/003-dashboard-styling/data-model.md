# Phase 1 Design: Dashboard Styling & Branding

**Feature**: `003-dashboard-styling` | **Date**: 2026-10-07

## Overview

This feature is **presentation-only**. It introduces no persisted entities, no API changes, and
no new data. The "design model" is therefore the set of visual tokens and the UI
component/state contract that the styling must honor.

## Data model

- **No new or changed entities.** The `Job` entity and its public projection are unchanged (see
  `specs/001-jobs-dashboard/data-model.md`). No storage, schema, or API surface changes.

## Design tokens (single source of truth)

Tokens live in `frontend/src/styles/global.css` as CSS custom properties under `:root`.

| Token | Purpose | Value (intent) |
|-------|---------|----------------|
| `--color-bg` | Page/base background | Near-black `#0b0b0c` |
| `--color-bg-page` | HTML/body background | Black `#000` |
| `--color-surface` | Card/elevated surface | `#15171a` |
| `--color-border` | Subtle card/border line | `#2a2d33` |
| `--color-text` | Primary text | `#f5f5f5` |
| `--color-text-muted` | Secondary/body text | `#c9cdd3` |
| `--color-accent` | Single accent (buttons, focus) | `#1570ef` |
| `--space-*`, `--radius-*` | Spacing/radius scale | small set of values |

**Palette constraint**: one accent color plus neutral text on a dark base (SC-006). Contrast must
meet WCAG AA (≥ 4.5:1 for normal text) (SC-005).

## UI component & state contract

| Surface | Responsibility | Key requirements |
|---------|----------------|------------------|
| `AppHeader` (`<h1>`) | Brand title at top of the shell | Text exactly `AfterQuery Interviewer Platform`; horizontally centered; responsive prominent size; persists across routes/states; single top-level heading |
| Dashboard section heading (`<h2>`) | "Available jobs" label | Lower level than the product title; shown with the catalogue (FR-015) |
| Dashboard `loading` state | Feedback while jobs load | Centered in the window; clearly communicates loading; `role="status"`; legible on dark |
| Dashboard `empty` state | No jobs available | Centered/legible on dark; consistent with loading |
| Dashboard `error` state | Jobs failed to load | Centered/legible on dark; `role="alert"`; exposes the existing Retry action |
| Dashboard `data` state | Grid of cards | Centered content column; dark cards; preserved 3/2/1 responsive columns |
| `JobCard` | Single job | Comfortable min height/padding; readable title + description; visible focus; accent action button |
| `JobDetail` (route) | Detail placeholder | Dark-theme consistent (no light page) |

## Presentation state transitions (unchanged behavior)

`loading → success | error`; `success` renders either the empty state (`jobs.length === 0`) or the
grid. This feature only changes how each state looks, not when each state occurs.

## Validation rules (mapped to requirements)

| Rule | Source |
|------|--------|
| Background covers the full viewport in every state | FR-001, SC-001 |
| Product heading present, centered, prominent at all supported widths | FR-002, FR-003, SC-002 |
| Loading message centered and clearly communicates loading | FR-004–FR-006, SC-003 |
| Empty/error states legible and consistent on dark | FR-007 |
| Cards comfortable/readable across resolutions | FR-008, SC-004 |
| Three-column desktop grid and reflow preserved | FR-009, SC-007 |
| Restricted palette and AA contrast | FR-010, FR-011, SC-005, SC-006 |
| Focus visible; behavior/keyboard preserved | FR-013, FR-014, SC-007 |

## Volume / scale assumptions

- Viewports roughly 360px–1440px+. A small, fixed set of CSS tokens scales across all of them;
  no per-resolution assets.
