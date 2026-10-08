---
description: "Task list for Adaptive Interview Questioning implementation"
---

# Tasks: Adaptive Interview Questioning

**Input**: Design documents from `/specs/006-adaptive-questioning/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/adaptive-api.openapi.yaml, quickstart.md

**Tests**: REQUIRED where applicable (project constitution, Principle V, NON-NEGOTIABLE). The provider is isolated behind an `InterviewerProvider` interface so unit tests use a mock provider and integration tests inject a fake provider — **no live OpenRouter calls in tests**.

**Organization**: Tasks are grouped by user story. Config, the prompt module, the provider interface/implementation, and message/repository changes are foundational (shared by all stories).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: backend `backend/src/`, backend tests `backend/test/`; frontend `frontend/src/`, frontend tests `frontend/test/unit/`
- Docs for this feature: `specs/006-adaptive-questioning/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm tooling. No new runtime dependencies (Node's built-in `fetch` calls OpenRouter).

- [ ] T001 [P] Verify backend/frontend test, lint, and typecheck tooling and confirm no new dependencies are needed in `backend/package.json` and `frontend/package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Provider plumbing, prompt building, and message/repository extensions used by the adaptive pipeline.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Update `backend/src/config.ts` to read OpenRouter settings: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL` (default `https://openrouter.ai/api/v1`), and `OPENROUTER_TIMEOUT_MS` (default `8000`).
- [ ] T003 Create `backend/src/models/interviewerPrompt.ts`: build the interviewer system prompt from the user-provided prompt with the job description injected at `<job description here>`, include prior conversation context, and specify the strict JSON output contract `{ no_speech, transcript, question }`; expose pure `buildPrompt(...)` and `parseProviderOutput(raw)` helpers.
- [ ] T004 Create `backend/src/providers/interviewerProvider.ts`: the `InterviewerProvider` interface (`generateNextQuestion(input)`), the `ProviderResult` type (`noSpeech`, `transcript`, `question?`), the input type (audio bytes, content type, system prompt), and a `ProviderError` class.
- [ ] T005 Create `backend/src/providers/openRouterInterviewerProvider.ts`: implement `InterviewerProvider` using `fetch` against OpenRouter chat completions (audio as base64 `input_audio`), a bounded timeout, strict JSON parsing via `parseProviderOutput`, and mapping of network/non-2xx/timeout/malformed responses to `ProviderError`.
- [ ] T006 Update `backend/src/models/interviewMessage.ts`: add `source: 'scripted' | 'model'` for agent messages and an optional server-only `transcript` for candidate audio messages; add `MAX_AGENT_MESSAGES = 6`; ensure `toMessageView` includes `source` but **never** `transcript`.
- [ ] T007 Update `backend/src/repositories/interviewMessageRepository.ts`: add `countByAuthor(sessionId, author)`, accept `transcript`/`source` in `append`, and set `source: 'scripted'` when seeding the opening.
- [ ] T008 [P] Unit test `backend/test/unit/interviewerPrompt.test.ts`: the built prompt includes the job description and the JSON output contract; `parseProviderOutput` accepts valid JSON and throws for malformed/empty output.

**Checkpoint**: Provider + prompt + message/repository support ready — user stories can begin.

---

## Phase 3: User Story 1 - A role-grounded follow-up after the reply (Priority: P1) 🎯 MVP

**Goal**: After a valid voice reply, the system transcribes it internally, generates a role-grounded follow-up, and appends it as an AIfter Agent message.

**Independent Test**: Submit a valid voice reply via the API and verify a new AIfter Agent question (source `model`) appears in order, and that the transcript is stored but never returned.

### Tests for User Story 1 (REQUIRED - Principle V) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [ ] T009 [P] [US1] Unit test `backend/test/unit/conversationService.adaptive.test.ts` with a mock `InterviewerProvider`: a valid reply stores the transcript on the candidate message and appends an agent question with `source: 'model'`; the returned/public view contains no transcript; the agent-message cap is respected.
- [ ] T010 [P] [US1] Integration test `backend/test/integration/adaptive.route.test.ts` (testcontainers MongoDB + a fake provider): `POST /api/interviews/:id/messages` with valid audio → `201 { message, question }`; the question is appended in order; `GET .../messages` never includes the transcript.

### Implementation for User Story 1

- [ ] T011 [US1] Implement `submitVoiceAnswer(sessionId, input)` in `backend/src/services/conversationService.ts`: enforce consent/limits, call the provider, persist the audio + candidate message with the internal transcript, and append the generated question (agent, `source: 'model'`) when below the cap; return `{ message, question }`.
- [ ] T012 [US1] Update `backend/src/routes/conversation.ts` so the upload handler invokes `submitVoiceAnswer` and returns `{ message, question }`.
- [ ] T013 [US1] Wire the OpenRouter provider in `backend/api/index.ts`: construct it from config and inject it into the `conversationService`.
- [ ] T014 [US1] Update `frontend/src/services/interviewsApi.ts` so `sendAudioReply` returns `{ message, question }`, and update `frontend/src/pages/InterviewRoom.tsx` to append both the candidate message and the generated question.

**Checkpoint**: MVP — a valid answer yields a role-grounded follow-up question.

---

## Phase 4: User Story 2 - Only valid speech triggers a question (Priority: P2)

**Goal**: Silent/no-speech recordings generate no question; the candidate is prompted to re-record and nothing is persisted.

**Independent Test**: Submit silent audio and verify `422 NO_SPEECH`, no stored message/audio, and a re-record prompt in the UI.

### Tests for User Story 2 (REQUIRED - Principle V) ⚠️

- [ ] T015 [US2] Extend `backend/test/unit/conversationService.adaptive.test.ts`: when the provider reports `noSpeech`, no message/audio is persisted and a `422` is raised.
- [ ] T016 [US2] Extend `backend/test/integration/adaptive.route.test.ts`: silent audio → `422 NO_SPEECH` with nothing persisted (conversation unchanged).

### Implementation for User Story 2

- [ ] T017 [US2] Implement the no-speech rejection branch in `backend/src/services/conversationService.ts`: on `noSpeech`, throw `HttpError(422, 'NO_SPEECH', ...)` before any persistence.
- [ ] T018 [US2] Handle `422` on the frontend: surface the re-record message from `frontend/src/services/interviewsApi.ts` through `frontend/src/pages/InterviewRoom.tsx` and `frontend/src/components/InterviewChat.tsx` (no reply appended).

**Checkpoint**: Silent recordings never produce a question; the candidate can re-record.

---

## Phase 5 - User Story 3 - The interview keeps working when the model does (Priority: P3)

**Goal**: Provider failures/timeouts are surfaced clearly and retryable, and never lose the session.

**Independent Test**: Simulate a provider failure on a valid reply and verify a `502`, a clear retry, an intact conversation, and no persisted turn.

### Tests for User Story 3 (REQUIRED - Principle V) ⚠️

- [ ] T019 [P] [US3] Extend `backend/test/unit/conversationService.adaptive.test.ts`: a `ProviderError` from the provider surfaces as a `502` and persists nothing.
- [ ] T020 [P] [US3] Extend `backend/test/integration/adaptive.route.test.ts`: a failing provider → `502 PROVIDER_ERROR`, conversation intact, and a subsequent successful submit works.

### Implementation for User Story 3

- [ ] T021 [US3] Map provider failures to a retryable `502 PROVIDER_ERROR` in `backend/src/providers/openRouterInterviewerProvider.ts` and `backend/src/services/conversationService.ts`, and surface a clear retry state in `frontend/src/pages/InterviewRoom.tsx`.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Completion UX, docs, and quality gates.

- [ ] T022 [P] Show an interview-complete state when the agent cap (6) is reached in `frontend/src/components/InterviewChat.tsx` and `frontend/src/pages/InterviewRoom.tsx` (stop offering recording).
- [ ] T023 [P] Update `specs/006-adaptive-questioning/quickstart.md` if any step no longer matches the implementation.
- [ ] T024 Run `npm run lint`, `npm run typecheck`, and `npm test` from the repository root and fix any failures (constitution quality gates).
- [ ] T025 Walk `specs/006-adaptive-questioning/quickstart.md` end-to-end (valid reply → question; silent → re-record; cap; provider failure) and correct any mismatches.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational.
  - US1 (P1) is the MVP (valid reply → question).
  - US2 (P2) adds the no-speech branch to the same pipeline.
  - US3 (P3) adds provider-failure handling to the same pipeline.
- **Polish (Phase 6)**: Depends on all stories.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No other story dependencies.
- **US2 (P2)**: Depends on US1 (the pipeline must exist).
- **US3 (P3)**: Depends on US1 (the pipeline must exist); independent of US2.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Prompt/provider/model/repository before the pipeline before the route.
- Backend before frontend wiring.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Setup: T001; Foundational: T002 and T008 are [P] (different files).
- US1: T009 and T010 are [P] (different test files).
- US3: T019 and T020 are [P] (different test files).
- Polish: T022 and T023 are [P].

---

## Parallel Example: User Story 1

```bash
# Write the US1 tests first (expect failure):
Task: "Unit test conversationService.adaptive in backend/test/unit/conversationService.adaptive.test.ts"
Task: "Integration test adaptive pipeline in backend/test/integration/adaptive.route.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories).
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: a valid voice reply yields a role-grounded follow-up.
5. Deploy/demo if ready.

### Incremental Delivery

1. Setup + Foundational → provider/prompt/message plumbing ready.
2. US1 → role-grounded follow-up after a valid reply (MVP).
3. US2 → silent recordings are rejected with a re-record prompt.
4. US3 → provider failures are surfaced and retryable.
5. Polish → completion UX, docs, quality gates.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] labels map tasks to user stories for traceability.
- On no-speech rejection, nothing is persisted (the reply is not stored).
- Transcript is stored server-side only and never exposed (`research.md` Decision 8).
- No new dependencies: OpenRouter is called with Node's built-in `fetch`; tests use a mock/fake provider (never the network).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
