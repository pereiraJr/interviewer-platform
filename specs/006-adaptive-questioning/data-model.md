# Phase 1 Design: Adaptive Interview Questioning

**Feature**: `006-adaptive-questioning` | **Date**: 2026-10-07

## Overview

This feature adds no new user-facing entity; it extends the existing **Interview Message** with a
server-only transcript and a source marker, and introduces non-persisted concepts: the interviewer
**Prompt**, the **Provider Result**, and the **agent-message cap**. The conversation remains owned
by the existing **Interview Session**.

## Extended Entity: Interview Message (`interviewMessages`)

Additions to the document defined in `005-interview-conversation/data-model.md`:

| Field | Type | Required | Rules | Notes |
|-------|------|----------|-------|-------|
| `source` | enum | no | `scripted` \| `model` | Set on agent/text messages: the fixed opening is `scripted`; generated questions are `model`. |
| `transcript` | string | no | Server-only; never exposed | The internal transcription of a candidate audio reply (FR-002/FR-003). |

- The public `MessageView` is **unchanged** except it MAY include `source` for agent messages; it
  MUST NOT include `transcript`.
- The scripted opening messages are created with `source: 'scripted'`; generated questions with
  `source: 'model'`.

## Cap: agent messages

- `MAX_AGENT_MESSAGES = 6` (3 scripted opening + at most 3 generated follow-ups) (FR-009).
- A question is generated only while the count of agent messages for the session is `< 6`.
- When the cap is reached, the interview is complete; no further question is produced.
- Grounding minimum: at least 2 generated agent follow-ups must be grounded in the candidate's
  audio content (FR-014) — enforced via the prompt and verified in review (SC-002).

## Non-persisted: Interviewer Prompt

| Piece | Description |
|-------|-------------|
| System prompt | The user-provided interviewer prompt ("You are a senior interviewer…"). |
| Job description | The selected job's description, injected at `<job description here>`. |
| Conversation context | Prior turns (agent questions + candidate answers/transcripts) so follow-ups build on the session. |
| Output contract | Instruction to return only JSON: `{ no_speech, transcript, question }`. |

## Non-persisted: Provider Result (`ProviderResult`)

| Field | Type | Meaning |
|-------|------|---------|
| `noSpeech` | boolean | True when no intelligible speech was detected → reject (FR-008). |
| `transcript` | string | Internal transcription; empty when `noSpeech`. |
| `question` | string \| undefined | The next interviewer question; empty when `noSpeech` or at cap. |

## Provider Configuration (env, server-side)

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENROUTER_API_KEY` | — (required to enable) | Server-side credential; never exposed (FR-011). |
| `OPENROUTER_MODEL` | an audio-capable default | The model used to transcribe + generate. |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | API base (overridable for testing/proxies). |
| `OPENROUTER_TIMEOUT_MS` | `8000` | Bounds the provider call (FR-010/SC-001). |

## Adaptive pipeline (submit voice answer)

1. Validate consent/`in_progress`, content type, non-empty, size (from `005`).
2. If the agent cap is **not** reached, call the provider with the audio + prompt + context.
   - Provider failure/timeout/malformed output → `502 PROVIDER_ERROR`; nothing persisted (FR-010).
   - `noSpeech` → `422 NO_SPEECH`; nothing persisted (FR-008).
3. Persist the audio recording and the candidate audio message **with the internal transcript**.
4. Append the generated question as an agent message (`source: 'model'`) if one was returned and the
   cap still allows it (FR-005).
5. Return `{ message, question }` to the client.
6. If the agent cap **is** reached, persist the audio reply without a generated question.

**Idempotency/duplicates**: a submission produces at most one candidate message and one question
(FR-013); responses are returned in `sequence` order.

## Validation Rules (mapped to requirements)

| Rule | Source |
|------|--------|
| Valid speech required before a question is generated | FR-001, FR-008 |
| Transcript produced and stored server-side; never exposed | FR-002, FR-003 |
| Question grounded in job description + answer | FR-004, FR-006, FR-014 |
| Question appended as an ordered agent message | FR-005 |
| No processing before consent | FR-007, SC-006 |
| Cap of 6 agent messages | FR-009 |
| Provider failure → clear, retryable error; session intact | FR-010, SC-005 |
| Credential server-side only | FR-011 |
| Audio confidential, session-scoped | FR-012 |
| No duplicate questions per reply | FR-013 |

## Relationships

- **Interview Session → Interview Message**: unchanged (ordered conversation), now with generated
  agent questions and candidate messages carrying hidden transcripts.
- **Interview Message (candidate audio) → Transcript**: 1:1, server-only.
- **Provider Configuration**: non-persisted; injected via `config.ts`.

## Volume / Scale Assumptions

- A handful of adaptive turns per interview (cap 6 agent messages); each model call is one
  request/response with a bounded timeout and a small structured payload.
