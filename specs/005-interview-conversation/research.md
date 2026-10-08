# Phase 0 Research: Interview Conversation

**Feature**: `005-interview-conversation` | **Date**: 2026-10-07

Focus: resolve the audio storage/retrieval approach (the user's explicit performance concern),
message persistence/ordering, how the scripted opening is created, gating, limits, and testing —
while honoring the project constraints (minimal dependencies, voice-first/no client transcription,
auditable sessions, existing layering/testing conventions).

## Decision 1: Audio storage format & retrieval in MongoDB

- **Decision**: Store each recording as a **single document in a dedicated `audioRecordings`
  collection** holding the compressed audio bytes as a **BSON `Binary`** field plus metadata
  (`contentType`, `byteLength`, `durationMs`, `createdAt`). The conversation message references the
  recording by `_id`. Audio is returned by a dedicated streaming endpoint, never embedded in
  message/history payloads.
- **Rationale**: Interview answers are size-bounded (< 16 MB) and already compressed by the browser
  encoder, so a single-document binary store is the simplest design that is genuinely fast to store
  and retrieve: listing a conversation never loads audio bytes, and fetching audio is one indexed
  `findOne` by `_id`. This directly satisfies FR-009/SC-004. It also avoids the 33% bloat and slow
  (de)serialization of base64.
- **Alternatives considered**: **GridFS** (better for very large/unbounded files and streaming, but
  adds chunk bookkeeping and a second query layer for no benefit at these sizes); **base64 string
  in the message** (larger and slower to encode/decode — rejected per the performance requirement);
  **raw bytes inline in the message document** (inflates every conversation read).

## Decision 2: Audio upload transport

- **Decision**: The client POSTs the audio as a **raw binary request body** (e.g.
  `Content-Type: audio/webm`) to `POST /api/interviews/:id/messages`, with metadata supplied via
  headers/query (`x-audio-duration-ms`). The backend reads it with the built-in
  `express.raw({ type: <allowed audio types>, limit })` parser.
- **Rationale**: Avoids adding a multipart library (e.g. `multer`), keeping the dependency set
  minimal, and is naturally aligned with the binary storage decision. `express.json()` (already
  global) does not consume audio bodies, so a route-scoped raw parser is sufficient.
- **Alternatives considered**: `multipart/form-data` (requires `multer`/`busboy`); JSON+base64
  (explicitly rejected for performance); direct-to-object-storage (out of scope; the requirement is
  MongoDB).

## Decision 3: Message persistence & ordering

- **Decision**: Store conversation turns in a new `interviewMessages` collection as small documents
  (`sessionId`, `author: 'agent' | 'candidate'`, `kind: 'text' | 'audio'`, `text?`, `audio?: {
  recordingId, contentType, durationMs, byteLength }`, `sequence`, `createdAt`), indexed by
  `{ sessionId: 1, sequence: 1 }`. `sequence` is a monotonic per-session integer assigned at insert.
- **Rationale**: A dedicated ordered collection keeps the session document small and makes
  "conversation in order" a single indexed query (FR-005/FR-010). Storing audio metadata on the
  message lets the UI render an audio bubble without fetching bytes.
- **Alternatives considered**: Embedding the whole conversation in the session document (grows
  unbounded and rewrites the session on every turn); ordering by `createdAt` alone (clock ties make
  order ambiguous — an explicit `sequence` is deterministic).

## Decision 4: Server-owned scripted opening

- **Decision**: The three opening messages are **fixed server-side constants**. When consent is
  accepted (transition to `in_progress`), the backend seeds the agent greeting, the
  `Lets Get Started:` message, and the `Could you give a brief intro about yourself?` question as
  the first three turns of the conversation.
- **Rationale**: FR-002–FR-005 mandate exact, ordered content; owning it server-side guarantees
  consistency, auditability (the record contains exactly what the candidate saw), and that the
  greeting cannot be lost or duplicated by client retries (seeding is idempotent per session).
- **Alternatives considered**: Frontend posts the opening (client owns mandated content; retries can
  duplicate); generating a dynamic greeting (not required; adaptive/questioning is deferred).

## Decision 5: Conversation retrieval

- **Decision**: `GET /api/interviews/:id/messages` returns the ordered turns with text inline and
  audio as metadata + an audio URL/route reference (no bytes). Audio bytes are fetched from
  `GET /api/interviews/:id/messages/:messageId/audio` (or an equivalent session-scoped audio route).
- **Rationale**: Keeps the history payload small and fast (SC-004) and lets the browser stream/play
  audio lazily with the correct `Content-Type`. The message list renders fully without waiting on
  audio.
- **Alternatives considered**: Inlining audio in the history (large/slow reads); separate uncoupled
  audio route without the session/message path (weaker isolation).

## Decision 6: Consent gating & isolation

- **Decision**: Adding a message/audio and seeding the opening are allowed **only when the session
  is `in_progress`** (i.e. consent accepted). Endpoints are scoped by session id; an unknown session
  is `404`, and posting before consent is rejected (`409 Conflict`) — nothing is recorded
  pre-consent (FR-013/SC-005). Audio is only reachable through its own session's route (FR-016).
- **Rationale**: Server-side enforcement of the consent gate (Principle II + Data Privacy) and
  session-scoped isolation of confidential audio.
- **Alternatives considered**: Client-only gating (not trustworthy); global audio listing/id access
  without session scoping (privacy risk).

## Decision 7: Limits & validation

- **Decision**: Enforce a maximum recording duration (e.g. 120 s) and a maximum byte size (e.g.
  10 MB) server-side; reject oversize bodies with `413` and invalid/empty audio with `400`.
  Validate `contentType` against an allow-list of web audio types and reject unknown sessions/jobs.
  The client also stops recording at the duration limit and shows that the bound was reached
  (FR-017).
- **Rationale**: The constitution requires bounding externally supplied input; audio uploads are
  exactly such input. Limits keep documents well under MongoDB's size cap and keep retrieval fast.
- **Alternatives considered**: No limits (risk of huge documents / abuse); client-only limits
  (bypassable).

## Decision 8: Client recording lifecycle

- **Decision**: Isolate `MediaRecorder` in a `useRecorder` hook that manages `idle → recording →
  saving → idle` (and `error`), requesting microphone permission, collecting compressed chunks, and
  producing a `Blob` on stop-and-save. Components render state and call `start()/stopAndSave()`.
- **Rationale**: A single, unambiguous start and stop-and-save control matches Principle II; keeping
  the imperative browser API in one hook keeps components declarative and testable (mocking
  `MediaRecorder` in Jest).
- **Alternatives considered**: Recorder logic inline in the page (harder to test); third-party
  recorder libraries (new dependency, unnecessary).

## Decision 9: Audio playback

- **Decision**: Render saved replies with a native audio player pointing at the session-scoped audio
  endpoint. Playback is read-only and never triggers recording.
- **Rationale**: FR-010/SC-003 require saved audio to be playable after reload; the native control
  is accessible and dependency-free.
- **Alternatives considered**: Custom waveform player (extra complexity/scope); no playback (fails
  the independent test for US3).

## Decision 10: Testing strategy

- **Decision**: Backend **unit** tests validate scripted-opening seeding, audio metadata/limits,
  ordering, and gating (`conversationService.test.ts`). **`testcontainers` integration** tests cover
  the real flow: accept consent → scripted opening returned in order → post audio (binary) → message
  appears with metadata → fetch audio bytes (correct `Content-Type`) → history reload is ordered;
  plus `409` before consent, `400` invalid audio, `404` unknown session, and `413` oversize.
  Frontend **RTL** tests cover `MessageList` (agent vs candidate rendering, audio player) and
  `RecordButton`/`useRecorder` (mocked `MediaRecorder`: idle/recording/saving/error, save callback),
  and the updated `InterviewRoom` (opening messages shown after consent; saved reply appended).
- **Rationale**: Matches Principle V and the established `001`–`004` approach (real MongoDB via
  `testcontainers`, HTTP via the app, RTL for components, single `npm test`).
- **Alternatives considered**: `mongodb-memory-server` (not the project standard); snapshot tests
  (low signal); skipping binary round-trip tests (would miss real storage/retrieval issues).

## Open items

None. The one spec clarification is resolved and no Technical Context unknowns remain.
