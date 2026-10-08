# Feature Specification: Adaptive Interview Questioning

**Feature Branch**: `006-adaptive-questioning`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "once user sends out the first voice message, and its detected a voice, so its a valid audio. integrate with a model from openrouter, where it can be parsed, and read by them. Use the following prompt to give context to this ai model: 'You are a senior interviewer for a Tech company, you are interviewing. This candidate is replying by voice. Take in consideration the job description below, and ask questions that correlate to the following: <job description here> Transcribe audio first and then, ask questions based on their answer and from job description attached above.'"

## Clarifications

### Session 2026-10-07

- Q: After the candidate's first valid voice reply, how far does adaptive questioning go in this feature? → A: It continues after every valid reply, capped at 6 agent messages in total (the 3 scripted opening messages plus at most 3 generated follow-ups); at least 2 of the generated agent replies must be grounded in the candidate's audio content.
- Q: When a recorded reply is not valid speech (silence/no speech detected), what should happen? → A: Reject the recording, generate no question, and prompt the candidate to record again without losing the session.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A role-grounded follow-up after the reply (Priority: P1)

After the candidate records their first valid voice answer, the AIfter Agent "listens" to it,
understands the answer, and asks a relevant follow-up question that is grounded in both the
candidate's answer and the selected job's description. The candidate sees the new question in the
conversation as the next turn from the agent.

**Why this priority**: This is the core differentiator of the product — a dynamic, role-grounded
interview rather than a fixed script. It turns the recorded answer into a real conversation.

**Independent Test**: Provide a valid voice reply to the opening question and verify a relevant
new AIfter Agent question appears in the conversation after it, referencing the role.

**Acceptance Scenarios**:

1. **Given** the opening question has been asked and the candidate records a valid voice reply,
   **When** the reply is submitted, **Then** the system transcribes it internally and generates a
   new interviewer question grounded in the job description and the candidate's answer.
2. **Given** the generated question, **When** it is shown, **Then** it appears as an AIfter Agent
   message immediately after the candidate's reply and in order.
3. **Given** the generated question, **When** it is reviewed, **Then** it relates to the selected
   role and does not invent job requirements absent from the description.

---

### User Story 2 - Only valid speech triggers a question (Priority: P2)

The system only generates a follow-up when the recording actually contains the candidate's voice
(valid speech). Silent, empty, or unintelligible recordings are handled clearly so the candidate is
not left waiting for a question that will not come.

**Why this priority**: Sending empty/silent audio to an AI model wastes processing, produces
nonsense questions, and breaks the interview's credibility. Valid-speech detection protects the
experience.

**Independent Test**: Submit a silent/empty recording and verify no question is generated and the
candidate is clearly told to record again.

**Acceptance Scenarios**:

1. **Given** the candidate saves a recording with no detectable speech, **When** it is processed,
   **Then** no follow-up question is generated.
2. **Given** a recording with no detectable speech, **When** the candidate is informed, **Then**
   they are prompted to record again without losing the session.
3. **Given** the candidate saves a valid voice recording, **When** it is processed, **Then** a
   follow-up question is generated.

---

### User Story 3 - The interview keeps working when the model does (Priority: P3)

If the AI model provider is slow, unavailable, or returns an error, the candidate does not lose
their session; they get a clear state and can retry, and the session can continue where it left off.

**Why this priority**: External model calls fail. The interview must degrade gracefully rather than
silently hanging or discarding the candidate's work.

**Independent Test**: Simulate a provider failure when a valid reply is submitted and verify the
candidate sees a clear error and can retry without losing the conversation.

**Acceptance Scenarios**:

1. **Given** a valid voice reply and the model provider fails, **When** processing ends, **Then**
   the candidate is told the follow-up could not be generated and can retry.
2. **Given** a provider failure, **When** the candidate retries, **Then** the interview continues
   and the candidate's previous reply is still present.

---

### Edge Cases

- **Silent or empty recording**: No speech detected → no question; candidate prompted to re-record.
- **Unintelligible or very short speech**: Treated as invalid; candidate prompted to re-record.
- **Provider timeout/slow response**: The candidate sees a clear pending/failure state; no infinite
  spinner; retry is possible.
- **Provider error/rate limit**: Surfaced clearly; retry allowed without losing the session.
- **Repeated failures**: The candidate can still leave the room; the session is preserved.
- **Very long answer**: Long transcripts are handled within model limits; the question still
  relates to the answer.
- **Transcript confidentiality**: The transcript is never shown to the candidate; it is retained
  server-side for auditing only.
- **No consent**: No processing happens before the candidate accepts the recording consent.
- **Concurrent double-submit**: A duplicate submission does not produce two duplicate questions.
- **Agent-message cap reached**: Once the interview has 6 agent messages (3 opening + 3
  follow-ups), no further questions are generated; the conversation simply stops growing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST determine whether a candidate's saved audio reply contains valid
  speech before generating a question for it.
- **FR-002**: When a valid voice reply is submitted, the system MUST transcribe the audio
  server-side.
- **FR-003**: The transcript MUST NOT be surfaced to the candidate; it is retained server-side only
  for auditing and downstream processing.
- **FR-004**: Using the transcript, the selected job's description, and the interviewer context
  prompt, the system MUST generate the next interviewer question.
- **FR-005**: The generated question MUST be appended to the conversation as an AIfter Agent
  message, shown to the candidate after their reply and in order.
- **FR-006**: The generated question MUST be grounded in the job description and the candidate's
  answer; it MUST NOT invent job requirements absent from the description.
- **FR-007**: The system MUST NOT transcribe or send audio for processing before the candidate has
  accepted the recording consent.
- **FR-008**: When a reply is not valid speech (silence/no detectable speech), the system MUST
  reject it, generate no question, and prompt the candidate to record again without losing the
  session.
- **FR-009**: The interview MUST continue generating a follow-up question after each valid voice
  reply, up to a maximum of 6 agent messages in total (the 3 scripted opening messages plus at
  most 3 generated follow-ups).
- **FR-010**: If the model provider fails, times out, or errors, the candidate MUST NOT lose the
  session; the failure MUST be surfaced clearly and MUST be retryable.
- **FR-011**: The model provider credential MUST be stored server-side only and MUST NOT be
  exposed to the browser or committed to the repository.
- **FR-012**: The candidate's audio sent for processing MUST be treated as confidential and used
  only to conduct/audit the interview.
- **FR-013**: The system MUST NOT generate duplicate questions for the same candidate reply.
- **FR-014**: At least 2 of the generated agent follow-ups MUST be grounded in the candidate's
  audio content (their transcribed answer), as opposed to relying solely on the job description.

### Key Entities *(include if feature involves data)*

- **Interview Message**: An existing conversation turn. Agent questions generated by the model are
  agent/text messages; the candidate's audio remains an audio message with a hidden transcript.
- **Transcription**: The server-side text of a candidate's audio reply. Key attributes: the message
  it belongs to, the transcript text, and when it was produced. Never exposed to the candidate.
- **Model Context / Prompt**: The interviewer system prompt (provided) plus the injected job
  description and the candidate's answer, used to generate the next question.
- **Provider Configuration**: The selected model and server-side credential used to transcribe and
  generate questions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a valid voice reply, a new role-grounded AIfter Agent question appears in the
  conversation within 10 seconds for typical answers.
- **SC-002**: 100% of generated questions are related to the job description and/or the candidate's
  answer (no off-topic or invented-requirement questions in review).
- **SC-003**: 0% of candidate transcripts are displayed to the candidate.
- **SC-004**: 100% of silent/no-speech recordings produce no follow-up question and a clear
  re-record prompt.
- **SC-005**: A model provider failure never loses the candidate's session; the candidate can retry
  and continue.
- **SC-006**: No audio is transcribed or sent to the model before the candidate accepts consent.

## Assumptions

- The transcript is used internally to generate the question and for auditing; consistent with the
  platform's principles, it is never shown to the candidate during the interview.
- The existing recording-consent notice ("recorded and used for internal purposes only") covers
  automated processing of the audio by the platform and its model provider; any wording change to
  make AI processing explicit is out of scope here but noted as a follow-up.
- The interviewer context prompt provided by the user is the system prompt, with the selected job's
  description injected in place of the `<job description here>` placeholder.
- Whether transcription and question generation are one combined model call or two sequential calls
  is a planning decision; the user's intent ("transcribe audio first, then ask") is satisfied either
  way as long as the resulting question reflects the candidate's answer.
- The model is accessed through OpenRouter; specific model choice and fallback behavior are
  planning decisions.
- The adaptive interview is capped at 6 agent messages in total (the 3 scripted opening messages
  plus at most 3 generated follow-ups), with at least 2 generated follow-ups grounded in the
  candidate's audio content.
- Candidate identity remains implicit (no auth yet); the feature operates within the existing
  interview session.
- Valid-speech determination may be performed by the platform and/or the model provider; the
  observable behavior is that silence/no-speech produces no question.
