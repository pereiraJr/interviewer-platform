---
description: "Task list for Interview Conversation implementation"
---

# Tasks: Interview Conversation

**Input**: Design documents from `/specs/005-interview-conversation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/conversation-api.openapi.yaml, quickstart.md

**Tests**: REQUIRED where applicable (project constitution, Principle V, NON-NEGOTIABLE). Backend unit + `testcontainers` integration tests and frontend React Testing Library tests (with `MediaRecorder` mocked) cover the opening, audio capture/persistence, playback, and reload.

**Organization**: Tasks are grouped by user story. The message/audio models, repositories, and conversation service are foundational (shared by the opening and audio replies).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: backend `backend/src/`, backend tests `backend/test/`; frontend `frontend/src/`, frontend tests `frontend/test/unit/`
- Docs for this feature: `specs/005-interview-conversation/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm tooling and dependencies. No new runtime dependencies are introduced (audio uses built-in raw-body parsing and `MediaRecorder`).

- [X] T001 [P] Verify backend/frontend test, lint, and typecheck tooling and confirm no new dependencies are needed in `backend/package.json` and `frontend/package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The conversation domain, persistence, and service used by the scripted opening and audio replies.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `backend/src/models/interviewMessage.ts`: `author`/`kind` enums, `MAX_DURATION_MS` and `MAX_AUDIO_BYTES` limits, audio content-type allow-list, the scripted-opening constants (greeting introducing **AIfter Agent**, `Lets Get Started:`, `Could you give a brief intro about yourself?`), `InterviewMessageDocument`/`AudioRecordingDocument` types, the `MessageView` projection, and validation helpers.
- [X] T003 [P] Create `backend/src/repositories/interviewMessageRepository.ts`: `listBySessionId(sessionId)`, `nextSequence(sessionId)`, `append(message)`, and idempotent `seedOpeningIfEmpty(sessionId)`.
- [X] T004 [P] Create `backend/src/repositories/audioRecordingRepository.ts`: `store({ sessionId, data, contentType, durationMs })` and `findById(sessionId, recordingId)`.
- [X] T005 Create `backend/src/services/conversationService.ts`: `getConversation(sessionId)`, `seedOpening(sessionId)`, and `addAudioReply(sessionId, bytes, contentType, durationMs)`; validate the session is `in_progress` (else `409`), enforce duration/byte limits (`413`/`400`), persist audio + message, and return the `MessageView`.
- [X] T006 [P] Unit test `backend/test/unit/conversationService.test.ts` with mocked repositories: opening seeds exactly three ordered agent messages idempotently; conversation returns ordered views; audio reply validation (allow-list, limits, empty), gating (`409` when not in progress), and unknown session (`404`).

**Checkpoint**: Conversation domain + service ready — user stories can begin.

---

## Phase 3: User Story 1 - The AIfter Agent opens the interview (Priority: P1) 🎯 MVP

**Goal**: Immediately after consent is accepted, the conversation automatically shows the AIfter Agent greeting, "Lets Get Started:", and the intro question, in order.

**Independent Test**: Accept consent, then `GET /api/interviews/:id/messages` (and the room) shows the three opening messages in order; before consent the conversation is gated.

### Tests for User Story 1 (REQUIRED - Principle V) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [X] T007 [P] [US1] Backend integration test in `backend/test/integration/conversation.route.test.ts` (testcontainers MongoDB): after accepting consent, `GET /api/interviews/:id/messages` returns the three scripted agent messages in order; a session still `consent_pending` has no messages; unknown session → `404`.
- [X] T008 [P] [US1] Frontend unit test in `frontend/test/unit/MessageList.test.tsx`: renders agent text turns in order and distinguishes candidate turns.

### Implementation for User Story 1

- [X] T009 [US1] Create `backend/src/routes/conversation.ts` with `GET /api/interviews/:id/messages`; seed the scripted opening when consent is accepted by calling `conversationService.seedOpening` from the consent handler in `backend/src/routes/interviews.ts`; mount the conversation router in `backend/src/app.ts` and wire `conversationService` in `backend/api/index.ts`.
- [X] T010 [US1] Add `Message`/`AudioMetadata` view types to `frontend/src/types/interview.ts` and a `getConversation(sessionId)` function to `frontend/src/services/interviewsApi.ts`.
- [X] T011 [P] [US1] Create `frontend/src/components/MessageList.tsx` + `frontend/src/components/MessageList.css` (ordered turns, agent vs candidate styling).
- [X] T012 [US1] Update `frontend/src/components/InterviewChat.tsx` to render `MessageList` from props and `frontend/src/pages/InterviewRoom.tsx` to load the conversation once in progress and render it.

**Checkpoint**: MVP — accepting consent starts the scripted conversation.

---

## Phase 4: User Story 2 - Record and send an audio reply (Priority: P2)

**Goal**: The candidate records their answer and, on save, it immediately appears as a candidate audio reply that can be played back.

**Independent Test**: Record, stop-and-save, and verify the audio appears immediately as a candidate reply message with a working play control.

### Tests for User Story 2 (REQUIRED - Principle V) ⚠️

- [X] T013 [US2] Extend `backend/test/integration/conversation.route.test.ts`: `POST /api/interviews/:id/messages` with a binary audio body → `201` candidate message carrying audio metadata; `GET .../messages/:messageId/audio` returns the bytes with the correct `Content-Type`; empty/invalid audio → `400`, unsupported type → `415`, oversize → `413`, not-in-progress → `409`, unknown session → `404`.
- [X] T014 [P] [US2] Frontend unit test in `frontend/test/unit/RecordButton.test.tsx` with a mocked `MediaRecorder`: exposes clear idle/recording/saving/error states and calls the save callback with the recorded blob.

### Implementation for User Story 2

- [X] T015 [US2] Add `POST /api/interviews/:id/messages` (raw binary audio) and `GET /api/interviews/:id/messages/:messageId/audio` to `backend/src/routes/conversation.ts`; add the route-scoped `express.raw` audio parser in `backend/src/app.ts`.
- [X] T016 [P] [US2] Create `frontend/src/hooks/useRecorder.ts`: `MediaRecorder` lifecycle (`idle → recording → saving → idle`, plus `error`), microphone permission handling, and a `stopAndSave` returning the compressed `Blob`.
- [X] T017 [P] [US2] Create `frontend/src/components/RecordButton.tsx` + `frontend/src/components/RecordButton.css` (single start / stop-and-save control surfacing capture state).
- [X] T018 [US2] Add `sendAudioReply(sessionId, blob, durationMs)` and a session-scoped audio URL helper to `frontend/src/services/interviewsApi.ts`, and wire record→save→append into `frontend/src/pages/InterviewRoom.tsx` and `frontend/src/components/InterviewChat.tsx`.

**Checkpoint**: The candidate can record and see their reply immediately.

---

## Phase 5 - User Story 3 - Replies are persisted and restored (Priority: P3)

**Goal**: The conversation and audio survive a reload and the saved reply is playable.

**Independent Test**: Save an audio reply, reload, and verify the conversation is restored in order with the audio reply present and playable.

### Tests for User Story 3 (REQUIRED - Principle V) ⚠️

- [X] T019 [P] [US3] Extend `frontend/test/unit/InterviewRoom.test.tsx`: a restored conversation (including a candidate audio reply) renders in order and exposes a play control for the audio.

### Implementation for User Story 3

- [X] T020 [US3] Add audio playback to `frontend/src/components/MessageList.tsx` (native player pointing at the session-scoped audio endpoint) and ensure restored audio messages render with their player.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, docs, and quality gates.

- [X] T021 [P] Accessibility pass over `frontend/src/components/RecordButton.tsx`, `frontend/src/components/MessageList.tsx`, and the audio player: labelled controls, clear capture-state announcements, visible focus, keyboard operation.
- [X] T022 [P] Update `specs/005-interview-conversation/quickstart.md` if any step no longer matches the implementation.
- [X] T023 Run `npm run lint`, `npm run typecheck`, and `npm test` from the repository root and fix any failures (constitution quality gates).
- [X] T024 Walk `specs/005-interview-conversation/quickstart.md` end-to-end (accept → opening → record → save → play → reload) and correct any mismatches.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational.
  - US1 (P1) is the MVP.
  - US2 (P2) adds recording/audio; depends on US1's conversation rendering.
  - US3 (P3) adds playback/restore; depends on US2's stored audio.
- **Polish (Phase 6)**: Depends on all stories.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No other story dependencies.
- **US2 (P2)**: Depends on US1 (conversation loaded/rendered).
- **US3 (P3)**: Depends on US2 (audio must be stored to restore/play).

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Models before repositories before service before routes.
- Backend endpoints before frontend integration.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Setup: T001 alone.
- Foundational: T003 and T004 are [P] once T002 exists; T006 [P] (separate test file).
- US1: T007 and T008 are [P] (backend vs frontend test); T011 [P].
- US2: T014 [P]; T016 and T017 are [P] (hook vs component).
- US3: T019 [P].
- Polish: T021 and T022 are [P].

---

## Parallel Example: User Story 1

```bash
# Write the US1 tests first (expect failure):
Task: "Backend integration test for the opening in backend/test/integration/conversation.route.test.ts"
Task: "MessageList component test in frontend/test/unit/MessageList.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: accepting consent shows the scripted opening.
5. Deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → conversation domain/service ready.
2. US1 → the AIfter Agent opens the interview (MVP).
3. US2 → the candidate records and sends an audio reply.
4. US3 → replies persist, restore, and play back.
5. Polish → accessibility, docs, quality gates.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] labels map tasks to user stories for traceability.
- Audio is stored as compressed BSON `Binary` in `backend/src/repositories/audioRecordingRepository.ts` (dedicated `audioRecordings` collection); conversation reads return metadata only (see `research.md` Decision 1).
- No new dependencies: uploads use Express's built-in `express.raw`; recording uses the browser `MediaRecorder`.
- Follow-up questioning is out of scope (FR-014); no transcription is surfaced (platform principles).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
