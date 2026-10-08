# Feature Specification: Interview Conversation

**Feature Branch**: `005-interview-conversation`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "once user accepts the ConsentBanner, send a hello message so that the agent can introduce himself, called as AIfter Agent; send a message as: 'Lets Get Started: '; after send: 'Could you give a brief intro about yourself? '. User need a button to record their audio, that will show as a replied message in the moment they click on save audio. This audio should be persisted in backend in mongodb, this audio should be formatted in a way that is performant for mongodb to store, and also retrieve."

## Clarifications

### Session 2026-10-07

- Q: After the candidate submits their recorded reply to the opening question, what happens next in this feature? → A: The conversation stops after the scripted opening and the candidate's one recorded reply; follow-up interviewer questioning is out of scope and delivered separately.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The AIfter Agent opens the interview (Priority: P1)

Immediately after the candidate accepts the recording consent, the AI interviewer introduces
itself as **AIfter Agent**, tells the candidate they are getting started, and asks the candidate
to give a brief introduction about themselves. The messages appear in the conversation in order
without the candidate having to do anything to trigger them.

**Why this priority**: This is the moment the interview actually begins. It converts the consent
gate into an active interview and sets up the candidate's first response; without it there is no
interview.

**Independent Test**: Accept the consent banner and verify the conversation automatically shows
the AIfter Agent introduction, a "Lets Get Started:" message, and the question "Could you give a
brief intro about yourself?" in that order.

**Acceptance Scenarios**:

1. **Given** the candidate has just accepted the consent banner, **When** the interview begins,
   **Then** the conversation shows a greeting in which the agent introduces itself as AIfter Agent.
2. **Given** the greeting is shown, **When** the conversation continues, **Then** a message
   reading "Lets Get Started:" is shown.
3. **Given** the "Lets Get Started:" message is shown, **When** the conversation continues,
   **Then** the agent asks "Could you give a brief intro about yourself?".
4. **Given** the interview has not started (consent not accepted), **When** the room is shown,
   **Then** none of these messages is shown.

---

### User Story 2 - Record and send an audio reply (Priority: P2)

In response to the opening question, the candidate records their answer using a record control
and, when they save it, the audio appears in the conversation as a replied message from the
candidate at that moment. The candidate can tell clearly that they are recording and that their
reply was saved.

**Why this priority**: Voice is the core interview modality; capturing the candidate's spoken
answer is the primary value of the interview experience. It depends on the opening (US1).

**Independent Test**: Start recording, stop/save, and verify the audio appears immediately as a
candidate reply message in the conversation.

**Acceptance Scenarios**:

1. **Given** the opening question is shown, **When** the candidate starts recording, **Then** the
   room clearly indicates that recording is in progress.
2. **Given** the candidate is recording, **When** they save the recording, **Then** the audio
   appears as a replied (candidate) message in the conversation immediately.
3. **Given** the candidate has saved an audio reply, **When** they view the conversation,
   **Then** the reply is visually distinguishable from the agent's messages and can be played back.
4. **Given** the microphone permission is denied or capture fails, **When** the candidate tries to
   record, **Then** they are told clearly and their session is not lost.

---

### User Story 3 - Replies are persisted and restored (Priority: P3)

The candidate's audio replies and the conversation are stored on the backend, so the session can
be retrieved, audited, and reloaded later with the audio intact and playable.

**Why this priority**: Auditable, retrievable sessions are a platform requirement; persistence
makes the reply durable and the interview reviewable. It builds on US2.

**Independent Test**: Save an audio reply, reload the interview, and verify the conversation is
restored in order with the audio reply present and playable; retrieving the audio is fast.

**Acceptance Scenarios**:

1. **Given** the candidate has saved an audio reply, **When** they reload the interview, **Then**
   the conversation is restored in order and the audio reply is present.
2. **Given** a persisted audio reply, **When** the candidate plays it, **Then** it plays back
   without re-recording.
3. **Given** the stored conversation, **When** it is retrieved, **Then** the audio is returned
   efficiently enough that playback starts promptly.

---

### Edge Cases

- **Consent not accepted**: No messages are shown and no audio is recorded until consent is
  accepted (the gate from the Interview Room feature).
- **Microphone permission denied**: The candidate is told clearly; the interview is not lost, and
  they can retry.
- **Silent/empty audio or immediate stop**: Saving an empty/tiny recording is handled gracefully
  (clear message instead of a broken reply).
- **Very long recording**: Recording is bounded by a maximum duration/size, with a clear signal
  when the limit is reached.
- **Save/network failure**: If the audio cannot be persisted, the candidate is told the reply was
  not saved and can retry without losing the conversation.
- **Reload mid-interview**: Restoring the conversation preserves order and does not duplicate
  replies.
- **Multiple recordings**: Each saved reply is appended as a separate candidate message.
- **Sensitive data**: Recorded audio is treated as confidential; it is only reachable within the
  session and is never exposed to other candidates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Immediately after the candidate accepts the consent banner, the interview MUST
  automatically begin its conversation.
- **FR-002**: The conversation MUST open with a greeting in which the agent introduces itself as
  "AIfter Agent".
- **FR-003**: Following the greeting, the conversation MUST show a message reading
  "Lets Get Started:".
- **FR-004**: Following that, the agent MUST ask "Could you give a brief intro about yourself?".
- **FR-005**: These opening messages MUST appear in the order above, from the agent, without the
  candidate needing to trigger them.
- **FR-006**: The candidate MUST have a control to start recording their audio and to stop and
  save it.
- **FR-007**: When the candidate saves a recording, it MUST immediately appear in the conversation
  as a replied (candidate) message.
- **FR-008**: The candidate's recorded audio MUST be persisted on the backend as part of the
  session's conversation.
- **FR-009**: Persisted audio MUST be stored and retrieved efficiently (fast to store and fast to
  retrieve for playback); no format that bloats or degrades retrieval is acceptable.
- **FR-010**: On reload, the conversation MUST be restored in order, including the candidate's
  audio replies, which MUST be playable.
- **FR-011**: Agent messages and candidate replies MUST be visually distinguishable.
- **FR-012**: The recording control MUST clearly surface its state (idle, recording, saving,
  error).
- **FR-013**: No interview messages MUST be shown and no audio MUST be recorded before consent is
  accepted.
- **FR-014**: After the candidate submits their recorded reply to the opening question, the
  conversation MUST stop after the scripted opening and that one recorded reply; follow-up
  interviewer questioning is out of scope for this feature and delivered separately.
- **FR-015**: If recording or saving fails, the candidate MUST be informed clearly and the
  session/conversation MUST NOT be lost.
- **FR-016**: Recorded audio MUST be treated as confidential and be retrievable only within its
  own interview session.
- **FR-017**: Recording MUST be bounded by a maximum duration/size with a clear indication when the
  bound is reached.

### Key Entities *(include if feature involves data)*

- **Message / Turn**: An item in the interview conversation belonging to a session. Key
  attributes: its session, its author (agent or candidate), its kind (text or audio), the text
  (for text turns), and, for audio turns, a reference to the stored audio plus its metadata
  (duration, size, format).
- **Audio Recording**: The candidate's recorded answer. Key attributes: the bytes and the metadata
  needed to store and retrieve it efficiently, associated with the message that references it.
- **Interview Session**: The existing session for a role (from the Interview Room feature), which
  now owns an ordered conversation of messages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Within 2 seconds of accepting consent, the candidate sees the AIfter Agent greeting,
  the "Lets Get Started:" message, and the opening question, in that order.
- **SC-002**: A candidate can record and save an audio reply, and the reply appears in the
  conversation within 2 seconds of saving.
- **SC-003**: 100% of saved audio replies survive a reload and remain playable.
- **SC-004**: Retrieving a stored audio reply for playback begins within 1 second for typical
  answer lengths.
- **SC-005**: 0% of interview messages or audio recordings occur before consent is accepted.
- **SC-006**: A candidate whose microphone is unavailable still has a preserved session and a
  clear path to retry.

## Assumptions

- The AI interviewer's name is exactly "AIfter Agent". The greeting wording is a fixed, friendly
  introduction (e.g., introducing itself as AIfter Agent and welcoming the candidate); only the
  identity is mandated here.
- The three opening messages are fixed, scripted text for this feature; role-grounded adaptive
  question generation is not part of this feature.
- Recording uses the candidate's microphone with explicit browser permission, and follows the
  platform's voice principles: a single clear start control and a single clear stop-and-save
  control.
- Transcription is out of scope and MUST NOT be surfaced to the candidate (per the platform
  principles); only audio is captured and stored here.
- Audio is stored server-side; the browser never receives recordings from other sessions, and no
  storage credentials are exposed to the browser.
- A bounded maximum recording length/size applies (standard web interview lengths), and audio is
  stored in a compressed, retrieval-friendly form.
- The candidate can play back their own saved reply; playback is a read-only action and never
  re-records.
- This feature builds on the Interview Room: consent gating and the in-progress session state
  already exist; this feature adds the conversation content and audio capture/persistence.
