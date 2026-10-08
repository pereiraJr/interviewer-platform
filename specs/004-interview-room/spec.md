# Feature Specification: Interview Room

**Feature Branch**: `004-interview-room`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "When a user clicks a job, they enter an Interview Room for that role. this interview room should be a chat like page. Before interview starts user should receive a banner let they know that their audio will be recorded and used for internal porpuses only. after that banner is accepted, interview begin."

## Clarifications

### Session 2026-10-07

- Q: How does the candidate respond during the interview? → A: Not applicable in this feature; candidate responses and capture are out of scope and deferred to the interview-mechanics feature (see FR-011).
- Q: What does "interview begins" cover in this feature? → A: Room + consent gate only; after accepting, the session starts and the room shows the interview as in progress. Interviewer question generation, candidate answers, and audio capture are out of scope for this feature and delivered separately.
- Q: What should happen if the candidate declines the recording consent banner? → A: Return the candidate to the dashboard; no interview starts and no recording occurs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter the Interview Room for a role (Priority: P1)

From the jobs dashboard a candidate selects a job and lands in an Interview Room dedicated to that
role. The room has a conversational, chat-like layout and clearly shows which role the candidate
is interviewing for, so they know they are in the right place and what is about to happen.

**Why this priority**: This is the entry point of the interview experience. Without a clear,
role-specific room, the candidate cannot start an interview, and every downstream behavior
(consent, questioning, recording) depends on it.

**Independent Test**: Select a job from the dashboard and verify the candidate is taken to an
Interview Room that identifies the correct role and renders the chat-like layout.

**Acceptance Scenarios**:

1. **Given** the dashboard shows job cards, **When** the candidate selects a job, **Then** they
   are taken to the Interview Room for that role with the correct role identified.
2. **Given** the candidate is in the Interview Room, **When** the room is displayed, **Then** it
   presents a chat-like conversation layout prepared for the interview.
3. **Given** the candidate opens the room for a role, **When** they view the room, **Then** the
   role's title (and brief context) is visible so the candidate knows which role they selected.

---

### User Story 2 - Recording consent before the interview starts (Priority: P2)

Before any interview activity begins, the candidate is shown a prominent banner explaining that
their audio will be recorded and used for internal purposes only. The candidate must explicitly
accept this notice. The interview does not begin until that acceptance happens.

**Why this priority**: Recording candidate audio without clear, explicit consent is a privacy and
trust failure. Consent is a hard gate the platform must enforce before any recording or
interview activity; it must be reliable even if it is technically a short interaction.

**Independent Test**: Open the Interview Room for the first time and verify the consent banner is
shown before any interview activity, that the interview cannot begin until the candidate accepts,
and that accepting dismisses the banner and starts the interview.

**Acceptance Scenarios**:

1. **Given** a candidate enters the Interview Room for the first time, **When** the room loads,
   **Then** a banner is shown stating that audio will be recorded and used for internal purposes
   only, before any interview activity begins.
2. **Given** the consent banner is shown, **When** the candidate has not accepted it, **Then** the
   interview has not started and no audio is being recorded.
3. **Given** the consent banner is shown, **When** the candidate accepts it, **Then** the banner
   is dismissed and the interview begins.
4. **Given** the consent banner is shown, **When** the candidate declines it, **Then** the
   interview does not begin and no audio is recorded.

---

### User Story 3 - The interview begins after consent (Priority: P3)

Once the candidate accepts the recording notice, the interview session starts: the room shows the
interview for the selected role as in progress and the candidate has officially begun.

**Why this priority**: This is the payoff of the flow. It depends on the room and consent gate and
is lower risk than the consent mechanism itself, so it is the last increment.

**Independent Test**: Accept the consent banner and verify the session transitions to an active /
in-progress state for the role without any additional setup step.

**Acceptance Scenarios**:

1. **Given** the candidate has accepted the consent banner, **When** the interview begins,
   **Then** the room presents the interview as in progress for the selected role.
2. **Given** the interview has begun, **When** the candidate returns to the room later,
   **Then** the session is still active and the consent banner is not shown again.

---

### Edge Cases

- **Direct entry without selecting a job**: If the room is opened without a valid role context,
  the candidate is guided back to the dashboard rather than shown an ambiguous interview.
- **Consent declined**: The interview never begins and no recording occurs; the candidate is
  returned to the dashboard.
- **Returning to an already-consented session**: The consent banner is not shown again for a
  session where consent was already given.
- **Role no longer available**: If the selected role is no longer available, the candidate is
  informed and cannot start the interview for it.
- **Consent banner accessibility**: The notice and its accept/decline actions are reachable and
  operable by keyboard and announced clearly to assistive technologies.
- **Accidental navigation away**: Leaving the room before consent has no interview consequences;
  leaving after the interview has begun must not silently discard the session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Selecting a job from the dashboard MUST take the candidate into an Interview Room
  for that specific role.
- **FR-002**: The Interview Room MUST identify the role the candidate is interviewing for.
- **FR-003**: The Interview Room MUST present a chat-like, conversational layout.
- **FR-004**: Before the interview starts, the room MUST present a banner informing the candidate
  that their audio will be recorded and used for internal purposes only.
- **FR-005**: The consent banner MUST be shown before any interview activity or audio recording
  begins.
- **FR-006**: The candidate MUST explicitly accept the consent banner for the interview to begin.
- **FR-007**: The interview MUST NOT begin and no audio MUST be recorded until consent is accepted.
- **FR-008**: When the candidate accepts, the banner MUST be dismissed and the interview MUST
  begin.
- **FR-009**: When the candidate declines, the interview MUST NOT begin and no audio MUST be
  recorded; the candidate MUST be able to leave the room.
- **FR-010**: The candidate's consent decision MUST be recorded for the session so it is auditable
  and so returning candidates are not asked again once consent is given.
- **FR-011**: This feature MUST NOT require the candidate to produce responses; response modality
  (voice or text) and any audio capture are deferred to the later interview-mechanics feature.
- **FR-012**: On acceptance, the interview MUST begin by transitioning the session to an
  active/in-progress state for the selected role. Interviewer question generation, candidate
  answers, and audio capture are out of scope for this feature and delivered separately.
- **FR-013**: When the candidate declines the consent banner, the system MUST return the candidate
  to the dashboard; the interview MUST NOT start and no audio MUST be recorded.
- **FR-014**: The consent banner text and its actions MUST be clearly legible and operable by
  keyboard and assistive technologies.
- **FR-015**: If the Interview Room is opened without a valid role, the candidate MUST be guided
  back to the dashboard rather than shown an ambiguous interview.

### Key Entities *(include if feature involves data)*

- **Interview Session**: The candidate's interview for a specific role. Key attributes: the role
  it belongs to, the candidate, its status (not started, consent pending, in progress), and the
  conversation it contains.
- **Consent Record**: The candidate's decision about recording. Key attributes: the session it
  applies to, the decision (accepted/declined), when it was made, and the notice that was shown.
- **Message / Turn**: An item in the chat-like conversation (an interviewer prompt or a candidate
  response) belonging to an interview session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate can move from the dashboard to the Interview Room for a role in a single
  selection, and the correct role is shown every time.
- **SC-002**: 100% of first-time entries to an interview show the recording consent banner before
  any interview activity or recording begins.
- **SC-003**: 0% of interviews begin (and 0% of audio is recorded) before the candidate explicitly
  accepts the consent banner.
- **SC-004**: After accepting the consent banner, the interview begins without requiring any
  additional setup step by the candidate.
- **SC-005**: A candidate who declines consent can leave the room and reach the dashboard without
  getting stuck.
- **SC-006**: The consent banner and its actions are usable via keyboard alone.

## Assumptions

- The candidate is already identified/authenticated before reaching the Interview Room (consistent
  with the Jobs Dashboard assumption).
- This feature is entered from the jobs dashboard by selecting a job; the dashboard-to-role
  navigation already exists and is reused rather than redefined.
- "Internal purposes only" means the recording is used within the platform for auditing and
  processing and is not published or shared externally; the exact retention policy is out of scope
  here but the recording is treated as sensitive data.
- The consent banner is shown once per interview session; a candidate who already accepted a given
  session's notice is not asked again for that session.
- The chat-like layout is the interview surface; regardless of response modality, the interview is
  organized as a conversation in the room.
- The interview session, its consent record, and its conversation are persisted so the session can
  be audited and revisited, consistent with the platform's auditable-sessions principle.
- Interviewer question generation, candidate responses, audio capture, and transcription are OUT OF
  SCOPE for this feature; it delivers the room, the recording-consent gate, and the transition to
  an in-progress session. The chat-like layout is prepared for that later content.
