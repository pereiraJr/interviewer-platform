# Implementation Plan: Interview Conversation

**Branch**: `005-interview-conversation` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-interview-conversation/spec.md`

## Summary

Once the candidate accepts the recording consent, the interview conversation begins
automatically: the **AIfter Agent** greets the candidate, sends **"Lets Get Started:"**, and asks
**"Could you give a brief intro about yourself?"**. The candidate records their answer through a
dedicated record control; saving it posts the audio to the backend and immediately renders it as a
replied message in the conversation, where it can be played back. The conversation and the audio
are persisted and restored on reload. Audio is stored **compressed, as binary in a dedicated
MongoDB collection** (not base64, not inline in the session document) so storage and retrieval stay
fast; the conversation history endpoint returns audio metadata only and audio bytes are fetched
separately/lazily. Follow-up questioning is out of scope (FR-014).

This builds directly on `004-interview-room` (consent gate, session lifecycle) and the existing
React + TypeScript frontend and Express + MongoDB backend, reusing their layering and tests. No new
runtime dependencies: audio upload uses Express's built-in raw body parser and the browser's
`MediaRecorder`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 20 LTS+; same language front and back.

**Primary Dependencies**: Existing stack only — Express 5 (including built-in `express.raw` for
binary uploads), official `mongodb` driver (no ODM/GridFS wrapper), React 18 + React Router, plain
CSS, browser `MediaRecorder`/Web Audio. No new runtime dependencies.

**Storage**: MongoDB. Two new collections: `interviewMessages` (ordered conversation turns,
indexed by `sessionId` + `sequence`) and `audioRecordings` (one document per recording holding the
**BSON `Binary` audio bytes** plus metadata: `contentType`, `byteLength`, `durationMs`). The
existing `interviewSessions` remains the owner of the conversation.

**Testing**: Jest everywhere. Backend unit tests for message/recording validation and the
conversation service; `testcontainers` integration tests for the conversation + audio endpoints
against real MongoDB. Frontend React Testing Library tests for the message list, the record
control (with a mocked `MediaRecorder`), and the updated `InterviewRoom`.

**Target Platform**: Web application — evergreen browsers with `MediaRecorder` (Chrome/Firefox/
Safari) and the existing Node process/serverless function.

**Performance Goals**: Conversation history returns in well under 1 s (text + audio metadata only);
retrieving a stored audio reply for playback begins within 1 s for typical answers (SC-004); the
greeting appears within 2 s of consent (SC-001); a saved reply appears within 2 s (SC-002).

**Constraints**: Bounded recording (max duration and byte size, enforced server-side); compressed
audio only (no base64/inline bloat); audio treated as confidential and session-scoped; no
transcription surfaced; messages only after consent (server-side gate); reuse the existing uniform
error envelope, validation, and CORS.

**Scale/Scope**: One scripted opening (3 agent messages) + one candidate audio reply per session;
two new collections, a small conversation API, and a record control. Bounded.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Component-Driven, Clear Interfaces | Conversation content split into `InterviewChat` + `MessageList` + `RecordButton`; backend split into message/audio repositories, a conversation service, and a router. Independently testable. | PASS |
| II. Voice-First Candidate Experience | A single, unambiguous record control; only capture state (idle/recording/saving/error) is surfaced; transcription is not run or shown. No conflict. | PASS |
| III. Role-Grounded Adaptive Questioning | Not applicable in this slice (fixed scripted opening only; follow-up questioning deferred). No conflict. | PASS (N/A) |
| IV. Auditable Sessions & Structured Evaluations | Messages and audio are persisted against the session and retrievable in order; the conversation is the immutable record. Evaluation schema is out of scope. | PASS |
| V. Test Discipline (NON-NEGOTIABLE) | Unit tests for validation/service; `testcontainers` integration tests for the conversation/audio endpoints; RTL tests for the message list and record control. Single `npm test` runs both packages. | PASS |
| Data Privacy & Security | Audio is confidential and reachable only via its own session-scoped route; uploads are validated and size/duration-bounded; no credentials in the browser; errors never leak internals. | PASS |
| Workflow & Quality Gates | Lint + strict type-check + tests required; conversation/audio contract documented in `contracts/`; complexity (dedicated binary collection vs GridFS) justified. | PASS |

**Result**: All gates pass. No violations; the `audioRecordings` design choice is justified in
Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/005-interview-conversation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── conversation-api.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.ts                              # MODIFIED: mount conversation router; raw-body audio route
│   ├── config.ts                           # MODIFIED: audio limits (max duration/bytes)
│   ├── models/
│   │   ├── interviewSession.ts             # (existing)
│   │   └── interviewMessage.ts             # NEW: message/kind/author enums, limits, scripted opening, validation
│   ├── repositories/
│   │   ├── interviewSessionRepository.ts   # (existing)
│   │   ├── interviewMessageRepository.ts   # NEW: append + list by session (ordered)
│   │   └── audioRecordingRepository.ts     # NEW: store/find BSON binary audio + metadata
│   ├── services/
│   │   ├── interviewService.ts             # MODIFIED: on accept, seed the scripted opening messages
│   │   └── conversationService.ts          # NEW: getConversation, addAudioReply (validate + persist)
│   └── routes/
│       ├── interviews.ts                   # (existing)
│       └── conversation.ts                 # NEW: list messages, post audio reply, stream audio
├── api/
│   └── index.ts                            # MODIFIED: wire conversationService
└── test/
    ├── unit/
    │   └── conversationService.test.ts     # NEW
    └── integration/
        └── conversation.route.test.ts      # NEW (testcontainers)

frontend/
├── src/
│   ├── components/
│   │   ├── InterviewChat.tsx/.css          # MODIFIED: compose MessageList + RecordButton
│   │   ├── MessageList.tsx/.css            # NEW: ordered agent/candidate turns; audio player
│   │   └── RecordButton.tsx/.css           # NEW: start/stop/save control + states
│   ├── hooks/
│   │   └── useRecorder.ts                  # NEW: MediaRecorder lifecycle (idle/recording/saving/error)
│   ├── pages/
│   │   └── InterviewRoom.tsx               # MODIFIED: load conversation, record + send reply
│   ├── services/
│   │   └── interviewsApi.ts                # MODIFIED: getConversation, sendAudioReply, audioUrl
│   └── types/
│       └── interview.ts                    # MODIFIED: Message + AudioMetadata view types
└── test/unit/
    ├── MessageList.test.tsx                # NEW
    ├── RecordButton.test.tsx               # NEW (mocked MediaRecorder)
    └── InterviewRoom.test.tsx              # MODIFIED
```

**Structure Decision**: Web-application layout inherited from `001`–`004`. Audio is kept out of the
session document and out of the message documents: a dedicated `audioRecordings` collection holds
the bytes, and `interviewMessages` holds ordered, small turn documents that reference audio by id.
This keeps conversation reads small and audio reads a single indexed fetch (see Complexity
Tracking). The frontend isolates the imperative `MediaRecorder` lifecycle in a `useRecorder` hook
so components stay declarative and testable.

## Complexity Tracking

> One deliberate design choice beyond the absolute simplest approach is justified below.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Dedicated `audioRecordings` collection (binary in its own doc) instead of embedding audio in the message document | Keeps conversation-history reads small/fast and makes audio retrieval a single indexed fetch; avoids loading audio bytes when listing the conversation. | Embedding bytes in each message inflates the conversation payload and every history read; base64 strings are ~33% larger and slow to (de)serialize; GridFS adds chunk bookkeeping/streaming complexity that is unnecessary for size-bounded interview answers (< 16 MB). |

## Phase 0: Research Output

See [`research.md`](./research.md) — decisions on audio storage format, upload transport, message
persistence/order, server-owned scripted opening, gating, limits, retrieval, and testing.

## Phase 1: Design Output

- [`data-model.md`](./data-model.md) — `InterviewMessage`, `AudioRecording`, and the session's
  conversation, with validation/limits and ordering.
- [`contracts/conversation-api.openapi.yaml`](./contracts/conversation-api.openapi.yaml) — list
  messages, post an audio reply, and stream audio.
- [`quickstart.md`](./quickstart.md) — run + verify the opening, recording, playback, and reload.

## Constitution Re-Check (post-design)

| Principle | Post-design status |
|-----------|--------------------|
| I. Component-Driven, Clear Interfaces | PASS — message list, record button, and `useRecorder` are single-purpose and testable. |
| II. Voice-First Candidate Experience | PASS — one record control, capture-state only, no transcription surfaced. |
| IV. Auditable Sessions | PASS — messages + audio persisted against the session and retrievable in order. |
| V. Test Discipline | PASS — unit + integration + component tests specified. |
| Data Privacy & Security | PASS — session-scoped audio, bounded/validated uploads, no secrets in browser. |
| Workflow & Quality Gates | PASS — contract documented; no new dependencies; complexity justified above. |

**Result**: All gates still pass after Phase 1 design.
