# Implementation Plan: Adaptive Interview Questioning

**Branch**: `006-adaptive-questioning` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-adaptive-questioning/spec.md`

## Summary

Once the candidate has accepted consent and records a **valid voice** answer, the backend
transcribes the audio (internally), then asks an AI model accessed through **OpenRouter** to
produce the **next role-grounded interview question** using the provided interviewer prompt, the
selected job's description, and the candidate's answer. The question is appended to the
conversation as an **AIfter Agent** message. The loop repeats after every valid reply, capped at
**6 agent messages total** (3 scripted opening + ≤3 generated follow-ups), with **≥2 generated
follow-ups grounded in the candidate's audio**. Non-speech recordings are rejected (no question;
re-record). Transcripts are stored server-side for auditing and are **never surfaced** to the
candidate. Provider failures are surfaced and retryable and never lose the session. The model call
is isolated behind a provider interface so tests run without network access. Builds on
`005-interview-conversation`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 20 LTS+. Backend-only change (the
frontend only needs small response/UX updates).

**Primary Dependencies**: Existing stack only — Node's built-in `fetch` to call OpenRouter, the
existing Express/MongoDB/React stack. The OpenRouter model is configured via environment variables.
**No new runtime dependency** is added (no vendor SDK).

**Storage**: MongoDB. Candidate audio messages gain a server-only `transcript` field; generated
agent questions gain a `source: 'model'` marker (scripted opening uses `source: 'scripted'`).
Nothing new is exposed publicly.

**Testing**: Jest. Unit tests for the prompt-building, output parsing, speech validity, cap logic,
and error mapping using a **mocked `InterviewerProvider`**. `testcontainers` integration tests
inject a fake provider to exercise the full HTTP + MongoDB flow (valid reply → transcript stored +
question appended; no-speech → `422` and nothing persisted; cap → no further questions; provider
failure → `502` and session intact). Frontend tests mock the API.

**Target Platform**: The existing Node process/serverless backend; outbound HTTPS to OpenRouter.

**Performance Goals**: The generated question appears within 10 s of a valid reply for typical
answers (SC-001); the provider call has a bounded timeout (e.g. 8 s) so the request cannot hang.

**Constraints**: Provider credential server-side only (`OPENROUTER_API_KEY`), never in the browser
or repo; processing only after consent; transcripts never sent to the client; audio confidential;
agent replies capped at 6; response/API changes documented in `contracts/`.

**Scale/Scope**: One provider interface + OpenRouter implementation, one adaptive pipeline in the
conversation service, small API/response change, and minor frontend handling (append question /
re-record prompt / completion). Bounded.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Component-Driven, Clear Interfaces | Provider isolated behind `InterviewerProvider`; prompt-building, parsing, and the adaptive pipeline are separate, single-purpose modules; the frontend change is a small component-level update. | PASS |
| II. Voice-First Candidate Experience | Candidate answers by voice; the model reads the audio; **transcription is server-side only and never surfaced** (FR-003), and only capture state is shown. | PASS |
| III. Role-Grounded Adaptive Questioning | This is exactly this principle: questions are grounded in the job description and the candidate's answer, decoupled from transport/UI, and testable deterministically via the provider interface. | PASS |
| IV. Auditable Sessions & Structured Evaluations | Transcripts are retained server-side against the session (audit); the conversation remains an ordered, immutable record. | PASS |
| V. Test Discipline (NON-NEGOTIABLE) | Deterministic unit tests (mocked provider) + `testcontainers` integration tests (fake provider) for the new pipeline; no live network in tests. | PASS |
| Data Privacy & Security | Audio is sent to the model provider only after consent, with server-side credentials; transcripts are never exposed; audio remains confidential. | PASS |
| Workflow & Quality Gates | Lint + strict type-check + tests required; the conversation API contract is updated; the added complexity (provider abstraction + one-vs-two-call choice) is justified below. | PASS |

**Result**: All gates pass. No violations; the provider abstraction and combined-call choice are
justified in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/006-adaptive-questioning/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── adaptive-api.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.ts                              # (existing) unchanged routing; provider injected via api
│   ├── config.ts                           # MODIFIED: OPENROUTER_API_KEY, OPENROUTER_MODEL, base URL, timeout
│   ├── models/
│   │   ├── interviewMessage.ts             # MODIFIED: transcript + source fields; cap constant
│   │   └── interviewerPrompt.ts            # NEW: interviewer system prompt + JSON output contract
│   ├── providers/
│   │   ├── interviewerProvider.ts          # NEW: InterviewerProvider interface + types/errors
│   │   └── openRouterInterviewerProvider.ts# NEW: OpenRouter implementation (fetch, JSON parse, timeout)
│   ├── repositories/
│   │   └── interviewMessageRepository.ts   # MODIFIED: count agent messages; store transcript
│   ├── services/
│   │   └── conversationService.ts          # MODIFIED: submitVoiceAnswer pipeline (validity, cap, question)
│   └── routes/
│       └── conversation.ts                 # MODIFIED: upload returns { message, question }; 422 NO_SPEECH; 502 provider error
├── api/
│   └── index.ts                            # MODIFIED: construct the OpenRouter provider from config
└── test/
    ├── unit/
    │   ├── interviewerPrompt.test.ts        # NEW: prompt building + response parsing
    │   └── conversationService.adaptive.test.ts # NEW: validity/cap/grounding with a mock provider
    └── integration/
        └── adaptive.route.test.ts           # NEW: fake provider; end-to-end pipeline against MongoDB

frontend/
├── src/
│   ├── services/interviewsApi.ts            # MODIFIED: sendAudioReply returns { message, question }; 422 handling
│   ├── pages/InterviewRoom.tsx              # MODIFIED: append question; re-record prompt; completion state
│   └── components/InterviewChat.tsx         # MODIFIED: show completion when the agent cap is reached
└── test/unit/InterviewRoom.test.tsx         # MODIFIED: question appended; no-speech prompt; completion
```

**Structure Decision**: Web-application layout inherited from `001`–`005`. The OpenRouter call is
isolated in a `providers/` module behind an `InterviewerProvider` interface so the adaptive logic
is deterministic and network-free in tests. The adaptive pipeline lives in `conversationService`
(one place owns ordering/cap/transcript), the route stays thin, and the frontend only renders the
returned turns and handles the no-speech/completion states.

## Complexity Tracking

> Two deliberate choices are justified below.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Provider abstraction (`InterviewerProvider`) with an OpenRouter implementation | Keeps the model call swappable and makes the pipeline fully testable without network/credentials (Principle V); aligns with the constitution's "decoupled from transport, tested deterministically". | Calling OpenRouter directly from the service couples HTTP/vendor details to business logic and forces live network in tests. |
| Combined transcribe+question model call (one OpenRouter request returning `{transcript, no_speech, question}`) | One round trip; the model "reads" the audio and answers in the required order; fewer moving parts and lower latency. | A separate speech-to-text service + a text model is two provider calls/dependencies and more failure modes for the same observable result. |

## Phase 0: Research Output

See [`research.md`](./research.md) — OpenRouter integration, prompt/output contract, speech
validity, single vs. two calls, cap enforcement, error mapping, privacy, and testing.

## Phase 1: Design Output

- [`data-model.md`](./data-model.md) — `InterviewMessage` additions (`transcript`, `source`),
  provider config, the cap, and the adaptive pipeline state.
- [`contracts/adaptive-api.openapi.yaml`](./contracts/adaptive-api.openapi.yaml) — the updated
  "submit voice answer" endpoint (`{ message, question }`, `422 NO_SPEECH`, `502`).
- [`quickstart.md`](./quickstart.md) — configure OpenRouter, run, and verify validity/cap/privacy.

## Constitution Re-Check (post-design)

| Principle | Post-design status |
|-----------|--------------------|
| I. Component-Driven, Clear Interfaces | PASS — provider interface + prompt/parse modules + thin route. |
| II. Voice-First Candidate Experience | PASS — transcript server-side only; capture state only. |
| III. Role-Grounded Adaptive Questioning | PASS — job-grounded, decoupled, deterministically testable. |
| IV. Auditable Sessions | PASS — transcript retained with the session; ordered conversation. |
| V. Test Discipline | PASS — mock provider unit tests + fake provider integration tests. |
| Data Privacy & Security | PASS — consent-gated, server-side credential, confidential audio, no transcript exposure. |
| Workflow & Quality Gates | PASS — contract updated; no new dependencies; complexity justified. |

**Result**: All gates still pass after Phase 1 design.
