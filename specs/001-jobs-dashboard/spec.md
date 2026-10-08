# Feature Specification: Jobs Dashboard

**Feature Branch**: `001-jobs-dashboard`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Create a dashboard, where candidate can see Jobs, with Title and a brief description. Those Jobs should use a Card design with a grid of 3 columns to show cards."

## Clarifications

### Session 2026-10-07

- Q: Where should the dashboard get its jobs from in this feature? → A: A real backend API endpoint that returns jobs.
- Q: What should happen when the candidate activates a job card? → A: Navigate to that job's detail view, from which the interview is started.
- Q: How should the dashboard handle a large number of jobs? → A: Load and display all jobs in a single scrolling grid (no pagination).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse available jobs (Priority: P1)

A candidate arrives at the dashboard and sees all jobs they can apply to. Each job is
presented as a card containing the job title and a brief description, and the cards are
laid out in a three-column grid so the candidate can scan the full catalogue at a glance.

**Why this priority**: This is the entry point of the entire product. Without a clear
catalogue of available jobs, a candidate cannot select a role or start an interview.

**Independent Test**: Load the dashboard with a populated job list and verify that every
job appears exactly once as a card showing its title and brief description, arranged in a
three-column grid at desktop width.

**Acceptance Scenarios**:

1. **Given** the dashboard contains multiple available jobs, **When** the candidate opens
   the dashboard, **Then** each job is shown as a card with its title and brief description.
2. **Given** the dashboard is displayed at desktop width, **When** the cards are rendered,
   **Then** exactly three cards appear per row.
3. **Given** a job has a title and a description longer than the card space, **When** the
   card is displayed, **Then** the text is presented without breaking the grid layout.

---

### User Story 2 - Select a job to continue (Priority: P2)

The candidate chooses one of the jobs on the dashboard to proceed with their application
by activating the corresponding card.

**Why this priority**: Browsing has no value unless the candidate can act on a job and
move into the interview flow.

**Independent Test**: Activate a job card and verify the candidate is navigated to that job's
detail view, with the correct job identified.

**Acceptance Scenarios**:

1. **Given** the dashboard is showing job cards, **When** the candidate activates a card,
   **Then** the system navigates the candidate to that job's detail view, with the correct
   job identified.
2. **Given** a candidate navigates using only a keyboard, **When** they move focus to a card
   and confirm it, **Then** the same selection behaviour occurs as with a pointer.

---

### User Story 3 - Responsive browsing across devices (Priority: P3)

The candidate can browse the job cards on different screen sizes, with the layout adapting
so cards remain readable and usable on narrower viewports.

**Why this priority**: Candidates may browse on laptops, tablets, or phones; a degraded
layout on small screens would block the flow for a subset of users.

**Independent Test**: Reduce the viewport width and verify the grid reflows to fewer columns
while each card remains fully readable and selectable.

**Acceptance Scenarios**:

1. **Given** the dashboard is displayed on a narrow viewport, **When** the layout reflows,
   **Then** the number of columns decreases so cards remain readable without horizontal
   scrolling.
2. **Given** any supported viewport width, **When** the cards are displayed, **Then** every
   card's title and description remain visible and the card remains selectable.

---

### Edge Cases

- **No jobs available**: The dashboard shows a clear empty state instead of an empty grid,
  explaining that no jobs are currently available.
- **Many jobs**: The full catalogue loads at once and the grid grows, with the page
  scrolling vertically without losing alignment or ordering.
- **Missing or empty description**: The card still renders with the title and degrades
  gracefully when no description is provided.
- **Very long title or description**: Text is bounded/truncated so it does not overflow the
  card or break the three-column alignment.
- **Slow or failed job loading**: The candidate sees a loading indicator while jobs load and
  a clear, recoverable error state if loading fails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST present all currently available jobs to the candidate.
- **FR-002**: Each job MUST be displayed as a distinct card.
- **FR-003**: Each job card MUST display the job's title.
- **FR-004**: Each job card MUST display a brief description of the job.
- **FR-005**: The job cards MUST be arranged in a grid that displays three columns at
  desktop width.
- **FR-006**: The grid MUST reflow to fewer columns on narrower viewports so each card
  remains readable without horizontal scrolling.
- **FR-007**: Selecting a job card MUST navigate the candidate to that job's detail view,
  with the correct job identified.
- **FR-008**: Job cards MUST be operable by keyboard and expose their title and description
  to assistive technologies.
- **FR-009**: The dashboard MUST display a loading state while jobs are being retrieved.
- **FR-010**: The dashboard MUST display an empty state when no jobs are available.
- **FR-011**: The dashboard MUST display a recoverable error state when jobs cannot be
  retrieved, allowing the candidate to retry.
- **FR-012**: Card content MUST remain contained within the card regardless of title or
  description length.
- **FR-013**: The dashboard MUST retrieve the job catalogue from the backend API endpoint
  that exposes available jobs; it MUST NOT rely on bundled or hard-coded job data.
- **FR-014**: The dashboard MUST load the full returned job catalogue and display it in a
  single scrolling grid, without pagination controls.

### Key Entities *(include if feature involves data)*

- **Job**: A role a candidate can apply to. Key attributes: a unique identifier, a title,
  and a brief description. A job is the unit rendered as a card and the unit selected by the
  candidate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate can see every available job's title and description on the
  dashboard without opening individual jobs.
- **SC-002**: At desktop width, the dashboard displays exactly three job cards per row.
- **SC-003**: 100% of available jobs are represented by a card showing both title and brief
  description.
- **SC-004**: The card grid remains readable and usable (no horizontal scrolling, titles and
  descriptions visible) at viewport widths from small mobile up to large desktop.
- **SC-005**: A keyboard-only user can reach and select any job card within the dashboard.
- **SC-006**: The dashboard's first set of job cards becomes visible to the candidate within
  2 seconds on a standard broadband connection.

## Assumptions

- The set of available jobs is served by a backend API endpoint; the dashboard consumes it
  read-only and does not create or edit jobs.
- The backend jobs endpoint returns each job's identifier, title, and brief description, and
  is reachable by the candidate without additional per-job authorization.
- The candidate is already identified/authenticated before reaching the dashboard.
- "Brief description" is short marketing/summary copy (typically one to three sentences),
  not a full job specification.
- Selecting a card navigates to a job detail view; the job detail view and the interview
  experience themselves are out of scope for this feature, which only routes to the correct
  job.
- Three columns is the target layout at desktop width; exact breakpoint thresholds follow
  standard responsive design conventions.
- The full job catalogue is loaded and displayed at once in a single scrolling grid; no
  pagination or incremental loading is required.
