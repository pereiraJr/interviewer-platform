# Phase 0 Research: Dashboard Styling & Branding

**Feature**: `003-dashboard-styling` | **Date**: 2026-10-07

Focus: resolve the presentation decisions (theming approach, color/contrast system, header
placement, centered status states, card sizing) while honoring the project constraints: minimal
dependencies, plain CSS, preserved accessibility, and preserved dashboard behavior.

## Decision 1: Theming approach

- **Decision**: Introduce a single global stylesheet (`frontend/src/styles/global.css`) that
  defines the dark base theme and CSS custom properties (color tokens, spacing, radii), and keep
  per-component CSS files for layout. Import the global stylesheet once from `main.tsx`.
- **Rationale**: Matches the existing component-scoped CSS convention from `001-jobs-dashboard`
  and the "minimal dependencies" constraint. The shell (header, background, typography) applies
  app-wide so the dark theme is consistent across routes; components stay responsible for their
  own layout.
- **Alternatives considered**: CSS-in-JS (adds a dependency and runtime), Tailwind/utility
  framework (violates minimal-deps and requires tooling), a UI component library (far heavier
  than needed).

## Decision 2: Color system & contrast

- **Decision**: A near-black base (`#0b0b0c` background, `#000` page), an elevated card surface
  one step lighter (`#15171a`) with a subtle border, neutral high-contrast text (`#f5f5f5`
  headings, `#c9cdd3` body), and a **single** accent reused from the existing brand blue
  (`#1570ef`) for buttons and focus. Tokens are exposed as CSS variables under `:root`.
- **Rationale**: "Friendly but not bloated in colors" maps to one accent plus neutrals. The
  chosen pairings exceed WCAG AA contrast (≥ 4.5:1 for normal text), satisfying FR-011/SC-005 and
  keeping the interface calm. Reusing the existing blue keeps continuity with the prior UI.
- **Alternatives considered**: Pure black everywhere with no elevation (cards lose separation);
  multiple accent colors (violates the restrained-palette requirement); a light theme (rejected
  by the request).

## Decision 3: Branded header placement

- **Decision**: Add a reusable `AppHeader` component that renders the
  `AfterQuery Interviewer Platform` heading as the top-level `<h1>`, horizontally centered, with
  responsive sizing via `clamp()` (e.g., `clamp(1.75rem, 4vw, 3rem)`). Render it once in the
  `App` shell so it persists across the dashboard and any other route. The product title is the
  single top-level heading; the dashboard's existing "Available jobs" label is demoted to a
  second-level section heading so the hierarchy stays clear (FR-015).
- **Rationale**: FR-002/FR-003 require a top, centered, prominent heading. A shell-level
  component avoids duplication and keeps the brand visible in every state (including loading),
  which the plain per-page `<p>` loading state currently hides. `clamp()` keeps it prominent at
  desktop without overflowing mobile.
- **Alternatives considered**: Per-page heading duplication (drift and inconsistency); a fixed
  pixel size (breaks at small/large viewports); placing the title inside the dashboard only
  (would disappear during loading/other routes).

## Decision 4: Centered loading / empty / error states

- **Decision**: Add a reusable `StatusMessage` component that centers its content in the
  available viewport area (flex centering with a minimum block size below the header). Use it for
  the dashboard's `loading`, `empty`, and `error` states; the loading instance uses
  `role="status"` and the error instance uses `role="alert"` with the existing Retry action.
- **Rationale**: FR-004–FR-007 require a clear, centered, legible loading message and consistency
  across states. The current loading state returns a bare paragraph at the top of the page, easy
  to miss. A shared component guarantees consistent centering and styling on the dark theme.
- **Alternatives considered**: Centering each state inline in `JobsDashboard.tsx` (duplication,
  drift); a full-page spinner overlay (heavier than needed and can obscure the header).

## Decision 5: Card sizing & grid

- **Decision**: Give cards a comfortable minimum height and padding, larger title/description
  type, and clear separation (larger grid gap). Constrain the grid to a centered maximum content
  width so cards do not stretch into unreadable lines on very wide screens. Preserve the existing
  responsive breakpoints (3 columns desktop, 2 ≤ 900px, 1 ≤ 600px).
- **Rationale**: FR-008/FR-009/SC-004 require cards that are easy to read/select at any
  resolution while keeping the established three-column desktop grid and reflow behavior. A max
  content width keeps line length comfortable on large monitors.
- **Alternatives considered**: Fixed card dimensions (break fluidly on smaller screens); removing
  the max width (long unreadable lines on ultrawide displays); changing column counts (would
  regress `001` behavior).

## Decision 6: Preventing a light flash on load

- **Decision**: Set the dark background on `html`, `body`, and the app root within the global
  stylesheet, and ensure the root element fills the viewport height.
- **Rationale**: FR-001 requires the black background in every state; setting it at the document
  level prevents a white flash before React mounts and guarantees full-viewport coverage
  (SC-001).
- **Alternatives considered**: Only styling the dashboard container (leaves light gutters and a
  flash); inline styles in `index.html` (duplicates tokens; the global stylesheet loaded by the
  app is sufficient).

## Decision 7: Accessibility

- **Decision**: Maintain WCAG AA contrast for all text, use a clearly visible `:focus-visible`
  outline in the accent color for interactive elements, and ensure states are conveyed with text
  and roles (not color alone).
- **Rationale**: FR-011–FR-014 and SC-005/SC-007 require legibility, focus visibility, and
  preserved keyboard operation; the constitution treats accessibility expectations as a quality
  gate.
- **Alternatives considered**: Relying on default focus rings that can disappear on dark
  backgrounds (rejected); color-only state cues (rejected).

## Decision 8: Testing strategy

- **Decision**: Unit-test the new `AppHeader` (renders the exact heading text as a level-1
  heading) and `StatusMessage` (loading uses `role="status"` and communicates loading; error uses
  `role="alert"` and exposes Retry). Keep/adapt the existing `JobsDashboard`, `JobsGrid`, and
  `JobCard` suites to assert behavior via accessible queries, and verify the existing responsive
  class/behavior tests still pass.
- **Rationale**: Matches Principle V and the existing React Testing Library approach. Visual
  centering/contrast are verified manually via `quickstart.md`; automated tests assert semantics
  and roles that carry the requirements.
- **Alternatives considered**: Snapshot tests of markup/CSS (brittle, low signal); visual
  regression tooling (adds dependencies not justified here).

## Open items

None. All decisions required for planning are resolved.
