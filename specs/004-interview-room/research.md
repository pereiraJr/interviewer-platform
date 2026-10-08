# Phase 0 Research: Interview Room

**Feature**: `004-interview-room` | **Date**: 2026-10-07

Focus: resolve persistence, API, navigation, consent, and testing decisions for the Interview
Room, while honoring the project constraints (minimal dependencies, consent-before-recording,
auditable sessions, existing layering/testing conventions).

## Decision 1: Session persistence & identity

- **Decision**: Persist one **Interview Session** document per interview in a new MongoDB
  `interviewSessions` collection, keyed by a server-generated id, referencing the `jobId` it
  belongs to. Because the codebase has no authentication yet, "start or resume" is scoped to the
  job: opening the room for a job returns the existing non-declined session for that job or
  creates a new one. A `candidateId` field is reserved but left unset for now.
- **Rationale**: FR-010 requires the consent decision to be persisted and auditable, and
  Principle IV requires sessions to be retrievable by id with their job relationship preserved.
  Job-scoped resume satisfies the "don't ask again once consent is given" edge case without
  inventing an auth system.
- **Alternatives considered**: In-memory/browser-only consent (rejected: not auditable);
  per-candidate sessions (deferred until auth exists); a full user model (out of scope).

## Decision 2: API shape

- **Decision**: Add a small REST surface reusing the existing JSON envelope conventions:
  - `POST /api/jobs/:jobId/interview` — start or resume the session for that role; returns the
    session (including role context and consent state). `404` if the job is unknown/unavailable.
  - `GET /api/interviews/:id` — retrieve a session (resume/refresh); `404` if unknown.
  - `POST /api/interviews/:id/consent` — record the consent decision
    (`{ "decision": "accepted" | "declined" }`); returns the updated session. `400` on an invalid
    decision, `404` if unknown.
- **Rationale**: Keeps the dashboard→room navigation simple (one call to enter the room) and makes
  consent its own explicit, auditable action. Matches the `{ data }` / `{ error }` styles already
  used by the jobs API.
- **Alternatives considered**: A single generic sessions endpoint (less clear); embedding consent
  in the session create call (loses the explicit acceptance step); GraphQL (overkill).

## Decision 3: Navigation & route

- **Decision**: The existing `/jobs/:id` route (currently the placeholder `JobDetail`) renders the
  new `InterviewRoom`. Selecting a card on the dashboard (which already navigates to `/jobs/:id`)
  therefore lands the candidate in the room, satisfying FR-001 without a new path.
- **Rationale**: Reuses existing, tested navigation (the dashboard's `handleSelect`) and keeps one
  canonical route per role. Avoids dead links and parallel navigation logic.
- **Alternatives considered**: A new `/jobs/:id/interview` route (extra redirect/indirection for
  no benefit); reusing the detail page and embedding the room (less clear separation).

## Decision 4: Consent notice content & versioning

- **Decision**: The recording notice is a fixed, versioned constant (text + `version`) owned by
  the backend and returned with the session, so the exact notice a candidate saw can be stored in
  the consent record. The text states audio will be recorded and used for internal purposes only.
- **Rationale**: Principle IV (auditability) requires knowing what the candidate consented to;
  versioning the notice makes the consent record meaningful if the wording ever changes.
- **Alternatives considered**: Frontend-only hard-coded notice (cannot be versioned/audited at the
  server); storing free-form text per consent (denormalized and drift-prone).

## Decision 5: Consent handling & gating

- **Decision**: A session starts in a pre-consent state. `accepted` sets status `in_progress` and
  stores `{ decision: 'accepted', decidedAt, noticeVersion }`; `declined` stores
  `{ decision: 'declined', decidedAt, noticeVersion }` and leaves the session not-in-progress. The
  interview is only `in_progress` after an `accepted` consent. No capture exists in this feature,
  and the gating is enforced server-side (session status) and reflected in the UI.
- **Rationale**: FR-006–FR-009/FR-012 require an explicit gate and an auditable decision.
  Server-side status is the authoritative gate; the UI mirrors it. Recording (later) will read the
  same status.
- **Alternatives considered**: Client-only gating (rejected: not trustworthy/auditable); treating
  decline as a deleted session (loses audit trail).

## Decision 6: Role context retrieval

- **Decision**: Add `findAvailableJobById(jobId)` to the existing job repository and include the
  job summary (id, title, description) in the session API response, so the room can show which
  role it is for without a second request.
- **Rationale**: FR-002 requires the room to identify the role; embedding it in the enter-room
  response keeps the room's startup to a single call and validates the role exists/is available
  (edge case "role no longer available").
- **Alternatives considered**: Reusing the list endpoint and filtering client-side (wasteful and
  racy); a separate `GET /api/jobs/:id` (extra round trip for the same data).

## Decision 7: Chat-like surface with deferred content

- **Decision**: Ship an `InterviewChat` component that renders the conversation layout (list of
  turns + composer area placeholder) but is empty in this feature (no messages, no input). The
  Message/Turn entity is modeled but not written.
- **Rationale**: FR-003 requires a chat-like layout; FR-011/FR-012 keep responses/capture out of
  scope. An empty, styled conversation surface satisfies the layout requirement without pretending
  to implement messaging.
- **Alternatives considered**: Rendering a static fake transcript (misleading); omitting the chat
  surface entirely (fails FR-003).

## Decision 8: Error handling & validation

- **Decision**: Validate `jobId`/`id` as strings and the consent `decision` against the allowed
  enum, rejecting bad input with `400`; unknown job/session returns `404`. All errors use the
  existing uniform `{ error: { code, message } }` envelope via the shared error handler.
- **Rationale**: Constitution requires bounding/validating externally supplied identifiers and
  never leaking internals; reuse of the existing envelope keeps the contract consistent.
- **Alternatives considered**: Ad-hoc error shapes (inconsistent); unvalidated ids (injection/
  confusion risk).

## Decision 9: Accessibility of the consent gate

- **Decision**: The banner is a labelled region with an accessible name, the notice text is
  programmatically associated with the Accept/Decline controls, both controls are real buttons with
  visible focus, and the room announces state changes (e.g., via an appropriate live region/role)
  so screen-reader users perceive the gate and its outcome.
- **Rationale**: FR-014/SC-006 require keyboard and assistive-tech operability; the constitution
  treats accessibility as a quality gate.
- **Alternatives considered**: A dismissible toast or auto-advancing consent (rejected: cannot
  reliably capture explicit consent and is not accessible).

## Decision 10: Testing strategy

- **Decision**: Backend unit tests cover the service (start-or-resume, accept→in_progress,
  decline→not in progress, invalid decision, unknown job). `testcontainers` integration tests
  exercise the real endpoints end-to-end (enter room → banner state → accept → in_progress;
  decline → not in progress/back to dashboard semantics; unknown ids → 404/400). Frontend RTL tests
  cover `ConsentBanner` (accept/decline callbacks, roles) and `InterviewRoom` (shows role, shows
  banner pre-consent, hides it and shows in-progress after accept, redirects to dashboard on
  decline, guides back on invalid role).
- **Rationale**: Matches Principle V and the established `001`/`004` conventions (real MongoDB via
  `testcontainers`, HTTP via the app, RTL for components, single `npm test`).
- **Alternatives considered**: `mongodb-memory-server` (rejected: project standard is
  `testcontainers`); shallow component snapshots (low signal).

## Open items

None. All spec clarifications are resolved and no Technical Context unknowns remain.
