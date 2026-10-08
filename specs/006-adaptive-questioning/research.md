# Phase 0 Research: Adaptive Interview Questioning

**Feature**: `006-adaptive-questioning` | **Date**: 2026-10-07

Focus: resolve the OpenRouter integration, prompt/output contract, speech validity, cap, error
handling, privacy, and testing — honoring the project constraints (minimal dependencies,
transcription never surfaced, consent-gated processing, deterministic tests).

## Decision 1: One combined model call vs. transcribe-then-ask

- **Decision**: Use a **single OpenRouter chat completion** that receives the candidate's audio
  plus the interviewer prompt and returns structured JSON `{ "no_speech": boolean, "transcript":
  string, "question": string }`. The server stores the transcript internally and appends the
  question.
- **Rationale**: The user's intent is "transcribe audio first, then ask"; a single model that
  reads audio and returns both satisfies that in one round trip, with fewer moving parts, lower
  latency, and one failure mode. The observable order (transcript produced, then question) is
  preserved server-side.
- **Alternatives considered**: A separate speech-to-text call followed by a text-model call (two
  provider dependencies and failure modes; extra latency/credentials); client-side transcription
  (rejected: transcription must not run on the client, Principle II).

## Decision 2: OpenRouter integration & configuration

- **Decision**: Call OpenRouter's chat completions endpoint over HTTPS with the server-side
  `OPENROUTER_API_KEY`; select the model via `OPENROUTER_MODEL`. A configurable base URL
  (`OPENROUTER_BASE_URL`, default the public API) and a request timeout (default 8 s) are read
  from config. The audio is sent as a base64 `input_audio` content part with its media type.
- **Rationale**: OpenRouter is explicitly requested; a configurable model lets the deployment pick
  an audio-capable model without code changes, and no vendor SDK keeps dependencies minimal.
- **Alternatives considered**: A vendor SDK (new dependency); hardcoding a model (inflexible);
  local Whisper (heavy runtime dependency, out of scope).

## Decision 3: Output contract & parsing

- **Decision**: The system prompt instructs the model to return **only JSON** with `no_speech`,
  `transcript`, and `question` (question omitted/empty when `no_speech` is true). The provider
  parses and validates this shape; a malformed/empty completion is treated as a provider failure
  (`502`), never stored.
- **Rationale**: A strict, validated output makes the pipeline deterministic and testable, and
  prevents storing junk (constitution: invalid output must fail loudly, not be stored silently).
- **Alternatives considered**: Free-text output with regex extraction (fragile); a second call to
  structure the output (wasteful).

## Decision 4: Speech-validity detection

- **Decision**: Validity is determined by the model's `no_speech` signal (the model "listens" to
  the audio). When `no_speech` is true, the server rejects the submission with `422 NO_SPEECH`,
  persists nothing, and the candidate is prompted to re-record.
- **Rationale**: Avoids adding a VAD/silence-detection dependency and is more reliable than
  amplitude heuristics; matches the user's "detected a voice, so it's valid audio".
- **Alternatives considered**: Client-side silence detection (unreliable, bypassable); a separate
  VAD library (new dependency).

## Decision 5: Prompt construction & job grounding

- **Decision**: The provider receives the user-provided interviewer prompt as the system message,
  with the selected job's description injected and the candidate's prior turns included as
  context. The prompt instructs the model to ground questions in the job description and the
  candidate's answer and to never invent requirements absent from the description. At least the
  generated follow-ups are asked to reference the candidate's answer (supporting FR-014).
- **Rationale**: Directly implements Principle III (role-grounded, adaptive) and FR-004/FR-006;
  keeping prompt-building in a dedicated module makes it unit-testable.
- **Alternatives considered**: A fixed question bank (not adaptive); no history (follow-ups lose
  context).

## Decision 6: Cap enforcement

- **Decision**: The server counts existing **agent** messages for the session; scripted opening =
  3, and generated follow-ups are allowed only while the agent count is below `MAX_AGENT_MESSAGES`
  (6). When the cap is reached, no new question is generated; the interview is considered complete
  and the client stops offering recording.
- **Rationale**: Enforces FR-009/FR-014 deterministically server-side (the client only reflects
  it); prevents an endless interview.
- **Alternatives considered**: Client-side cap (bypassable); counting all messages (wrong unit).

## Decision 7: Error handling & timeouts

- **Decision**: Provider failures (network, non-2xx, timeout, malformed output) are mapped to a
  clear `502 PROVIDER_ERROR`; the candidate message is **not** persisted for a failed attempt, the
  session is preserved, and the client can retry. A per-request timeout prevents hangs.
- **Rationale**: FR-010/SC-005 — a failed model call must not lose the session or hang the UI.
- **Alternatives considered**: Silently dropping the turn (candidate stuck); persisting a partial
  turn (inconsistent conversation).

## Decision 8: Privacy & data handling

- **Decision**: The transcript is stored on the candidate's audio message as a **server-only**
  field and omitted from every public projection; audio is sent to the provider only after consent
  and only for the current session. Credentials live only in server-side env vars.
- **Rationale**: FR-003/FR-007/FR-011/FR-012 and Principle II/Data Privacy — transcription is
  never surfaced and processing is consent-gated.
- **Alternatives considered**: Exposing the transcript to the client (violates Principle II);
  sending audio pre-consent (violates consent).

## Decision 9: Message model changes

- **Decision**: Add `source: 'scripted' | 'model'` to agent messages and an optional server-only
  `transcript` to candidate audio messages; extend the repository with `countByAuthor`. The public
  `MessageView` is unchanged (no transcript/source exposure needed) — `source` may be included for
  UI, but the transcript never is.
- **Rationale**: Minimal model change that supports the cap and audit without changing the client
  contract for existing turns.
- **Alternatives considered**: A separate `transcripts` collection (more joins for no benefit at
  this scale); embedding transcript in the view (privacy violation).

## Decision 10: Testing strategy

- **Decision**: Define an `InterviewerProvider` interface. **Unit** tests use a mock provider to
  cover prompt building/parsing, valid speech → transcript + question, `no_speech` → rejection,
  cap enforcement, and error mapping. **`testcontainers` integration** tests inject a **fake
  provider** to exercise the real HTTP + MongoDB flow end-to-end (transcript stored but not
  returned; question appended in order; `422` leaves nothing persisted; cap stops questions;
  provider failure → `502` and session intact). **No live OpenRouter calls in tests.** Frontend
  tests mock the API for the append/re-record/completion states.
- **Rationale**: Principle V + "testable deterministically, decoupled from transport"; avoids
  flaky network/credentials in CI.
- **Alternatives considered**: Live provider tests (flaky, needs secrets); snapshot tests (low
  signal).

## Open items

None. All spec clarifications are resolved and no Technical Context unknowns remain.
