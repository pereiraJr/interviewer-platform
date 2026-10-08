# Feature Specification: Dashboard Styling & Branding

**Feature Branch**: `003-dashboard-styling`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Improve styling of the application, add a black background to the dashboard, a more clear message centralized in the window so the user can properly see when application is loading. Cards should have a decent size so user can easily see in any of resolutions. also add AfterQuery Interviewer Platform H1 in the top of the screen, centralized in a good size so it can be easily seen by the user. Ui should be friendly but not too bloated in colors"

## Clarifications

### Session 2026-10-07

- Q: Should the dark theme apply to the whole application or the dashboard route only? → A: The whole application (all routes), for visual consistency.
- Q: What happens to the existing "Available jobs" heading? → A: Retained as a smaller section heading below the product title; the product name is the single top-level heading.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Branded dark dashboard (Priority: P1)

A candidate opens the jobs dashboard. The screen has a black background and, at the top and
horizontally centered, the product name "AfterQuery Interviewer Platform" is displayed as a
prominent heading. The candidate immediately understands which product they are using and the
page feels intentional and easy on the eyes rather than a bare, unstyled list.

**Why this priority**: The title and dark surface establish the product identity and first
impression. This is the most visible change and the one the user explicitly asked for first;
without it the dashboard looks unfinished.

**Independent Test**: Open the dashboard and verify the background is black across the whole
viewport and the product name appears as a centered, prominent heading at the top, at both
desktop and mobile widths.

**Acceptance Scenarios**:

1. **Given** the candidate opens the dashboard, **When** the page is displayed, **Then** the
   background is black/dark across the entire viewport with no light gaps or bands.
2. **Given** the dashboard is displayed at any supported width, **When** the top of the page is
   viewed, **Then** the heading "AfterQuery Interviewer Platform" is shown, horizontally
   centered, and large enough to be read at a glance.
3. **Given** the heading is displayed on the dark background, **When** text legibility is
   assessed, **Then** the heading and surrounding text have strong contrast against the
   background.

---

### User Story 2 - Clear, centered loading feedback (Priority: P2)

While jobs are being retrieved, the candidate sees a clear message telling them the application
is loading, centered in the window so it is impossible to miss. When loading finishes, the
message is replaced by the job catalogue (or the empty/error state).

**Why this priority**: The current loading feedback is easy to overlook on an unstyled page. A
candidate who does not realize the app is loading may assume it is broken and leave.

**Independent Test**: Open the dashboard and confirm a clear loading message is centered in the
window until jobs appear, and that the message disappears once content is shown.

**Acceptance Scenarios**:

1. **Given** the dashboard is retrieving jobs, **When** the page is displayed, **Then** a message
   clearly stating that jobs are loading is shown centered in the window.
2. **Given** jobs have finished loading, **When** the catalogue is displayed, **Then** the loading
   message is no longer shown.
3. **Given** the loading state is shown at any supported width, **When** the message is displayed,
   **Then** it remains centered and legible on the dark background.

---

### User Story 3 - Comfortable cards and restrained color (Priority: P3)

The candidate browses job cards that are comfortably sized and easy to read and select on any
screen, and the overall color use is friendly but restrained — a dark base with clear text and a
small, consistent accent — rather than a busy, multicolor interface.

**Why this priority**: Card sizing and palette polish determine whether the dashboard is
comfortable to use and whether it looks polished. It builds on the shell and loading work and is
lower risk than the branding changes.

**Independent Test**: View the dashboard across a range of widths and confirm cards remain
comfortable and readable, the layout reflows without horizontal scrolling, and the palette stays
limited to the dark base, neutral text, and a small number of accents.

**Acceptance Scenarios**:

1. **Given** the catalogue is displayed, **When** the candidate scans the cards at desktop width,
   **Then** cards are large and clearly separated so titles and descriptions are easy to read.
2. **Given** the dashboard is displayed on a narrow viewport, **When** the layout reflows,
   **Then** cards remain comfortably sized and fully readable without horizontal scrolling.
3. **Given** the overall interface, **When** its colors are reviewed, **Then** it uses a limited
   palette (dark background, high-contrast text, and a small number of accent colors) with no
   large areas of clashing or overly saturated color.

---

### Edge Cases

- **Loading, empty, and error states on the dark theme**: All states must be legible and
  visually consistent with the dark background — no dark text on dark background, and no state
  reverts to a plain light page.
- **Very small screens**: The centered heading and loading message must not overflow or be
  clipped; text must wrap/scale gracefully.
- **Very wide screens**: Cards must not stretch into unreadable single lines; a sensible maximum
  content width keeps reading comfortable.
- **Very long card text**: Titles and descriptions remain contained within cards and do not break
  the layout (existing behavior preserved).
- **Keyboard focus visibility**: Focused cards and controls must remain clearly visible against
  the dark theme.
- **Color-vision differences**: Contrast and state cues must not rely on color alone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST present a black/dark background that covers the entire viewport
  in every state (loading, empty, error, and data).
- **FR-002**: The dashboard MUST display the heading "AfterQuery Interviewer Platform" at the top
  of the screen as the single top-level heading.
- **FR-003**: The platform heading MUST be horizontally centered and sized prominently enough to
  be read at a glance.
- **FR-004**: While jobs are being retrieved, the dashboard MUST display a message that clearly
  communicates that the application is loading jobs.
- **FR-005**: The loading message MUST be horizontally and vertically centered within the window
  so it is immediately noticeable.
- **FR-006**: The loading message MUST be legible against the dark background.
- **FR-007**: The empty state and the error state MUST be presented clearly and legibly on the
  dark theme, consistent with the loading state.
- **FR-008**: Job cards MUST be sized comfortably enough that their title and brief description
  are easy to read and the card is easy to select at supported resolutions.
- **FR-009**: The card grid MUST continue to show three columns at desktop width and reflow to
  fewer columns on narrower viewports without horizontal scrolling (existing behavior preserved).
- **FR-010**: The interface color palette MUST be restrained: a dark base, high-contrast readable
  text, and no more than a small, consistent set of accent colors.
- **FR-011**: All text (heading, body, cards, states) MUST have strong contrast against its
  background and remain readable on the dark theme.
- **FR-012**: The platform heading and loading/empty/error messaging MUST remain legible and
  correctly positioned across supported viewport widths.
- **FR-013**: Styling changes MUST preserve the dashboard's existing functional behavior,
  including loading/empty/error/data states, keyboard operability, and selecting a card to
  navigate to the correct job.
- **FR-014**: Focus indication for interactive elements MUST remain clearly visible on the dark
  theme.
- **FR-015**: The dashboard MUST retain an "Available jobs" section heading at a lower level than
  the product title when showing the job catalogue, preserving a clear heading hierarchy.

### Key Entities

- No data entities are introduced or changed; this feature is presentation-only and does not
  alter the job catalogue or any stored data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the dashboard, 100% of the viewport shows the dark background in every state
  (no light bands or unstyled regions).
- **SC-002**: The heading "AfterQuery Interviewer Platform" is visible at the top and horizontally
  centered at every supported width from small mobile to large desktop.
- **SC-003**: Every time jobs are being retrieved, a centered loading message is visible for the
  whole duration of the loading period until content appears.
- **SC-004**: Job cards remain comfortable and readable — titles and descriptions visible without
  clipping — at viewport widths from small mobile up to large desktop.
- **SC-005**: Body and heading text meets WCAG AA contrast (at least 4.5:1 for normal text)
  against the dashboard background.
- **SC-006**: The interface uses no more than three accent colors in addition to the dark base
  and neutral text.
- **SC-007**: All existing functional acceptance checks for the dashboard (three-column desktop
  grid, card selection navigation, keyboard operation, empty/error states) continue to pass.

## Assumptions

- The dark/black theme applies to the whole application (all routes) for visual consistency;
  the request focuses on the dashboard, and a dark dashboard paired with a light detail page
  would be jarring.
- "AfterQuery Interviewer Platform" is the product title shown as the single top-level heading;
  the existing "Available jobs" label is retained as a smaller section heading below it.
- Supported viewport range is roughly small mobile (~360px) up to large desktop (~1440px and
  above).
- The interface uses the existing default/system fonts; no new font files or external font
  services are introduced.
- Colors are limited to a dark base, neutral high-contrast text, and a small accent set; no
  large, saturated decorative areas.
- This is a presentation-only change and does not alter data, behavior, accessibility
  expectations, or the three-column responsive grid defined for the dashboard.
