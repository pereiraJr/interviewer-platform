# Phase 1 Design: Interview Conversation

**Feature**: `005-interview-conversation` | **Date**: 2026-10-07

## Overview

This feature adds two persisted entities — **Interview Message** and **Audio Recording** — that
together form the interview conversation owned by the existing **Interview Session**. The agent's
opening messages are fixed, server-owned text; the candidate's reply is recorded audio whose bytes
are stored separately from the message that references them.

## Entity: Interview Message

### Persisted document (`interviewMessages` collection)

| Field | Type | Required | Constraints / Rules | Notes |
|-------|------|----------|---------------------|-------|
| `_id` | ObjectId | yes | Server-generated | Mapped to string `id`. |
| `sessionId` | ObjectId | yes | Must reference an existing session | Conversation owner. |
| `author` | enum | yes | `agent` or `candidate` | Visual distinction (FR-011). |
| `kind` | enum | yes | `text` or `audio` | `agent` turns are text; the opening reply is audio. |
| `text` | string | cond. | Required when `kind = text`; bounded length | The scripted opening messages. |
| `audio` | object | cond. | Required when `kind = audio`; see Audio Ref | Metadata only; bytes live in `audioRecordings`. |
| `sequence` | integer | yes | Monotonic per session, unique within session | Deterministic order (FR-005/FR-010). |
| `createdAt` | Date | yes | Set on insert | Ordering/audit. |

**Indexes**: `{ sessionId: 1, sequence: 1 }` (unique) to read the conversation in order.

### Embedded: Audio Ref

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `recordingId` | ObjectId | yes | Reference to the `audioRecordings` document. |
| `contentType` | string | yes | e.g. `audio/webm`, `audio/mp4`. |
| `durationMs` | integer | yes | `>= 0`, `<= MAX_DURATION_MS`. |
| `byteLength` | integer | yes | `<= MAX_AUDIO_BYTES`. |

## Entity: Audio Recording

### Persisted document (`audioRecordings` collection)

| Field | Type | Required | Constraints / Rules |
|-------|------|----------|---------------------|
| `_id` | ObjectId | yes | Referenced by the message's `audio.recordingId`. |
| `sessionId` | ObjectId | yes | Enforces session-scoped isolation (FR-016). |
| `data` | Binary | yes | Compressed audio bytes; `<= MAX_AUDIO_BYTES`. |
| `contentType` | string | yes | Allow-listed web audio type. |
| `durationMs` | integer | yes | `>= 0`, `<= MAX_DURATION_MS`. |
| `byteLength` | integer | yes | `= data.length`. |
| `createdAt` | Date | yes | Audit. |

**Indexes**: `{ _id: 1 }` (implicit) for single-fetch retrieval; `{ sessionId: 1 }` for scoping.

**Limits (constants)**: `MAX_DURATION_MS` (e.g. 120000) and `MAX_AUDIO_BYTES` (e.g. 10 * 1024 *
1024). Enforced server-side; oversize → `413`, invalid/empty → `400`.

## Scripted opening (server-owned constants)

The first three messages of every interview, seeded when consent is accepted:

| `sequence` | `author` | `kind` | Content |
|------------|----------|--------|---------|
| 1 | agent | text | Greeting introducing the agent as **AIfter Agent** |
| 2 | agent | text | `Lets Get Started:` |
| 3 | agent | text | `Could you give a brief intro about yourself?` |

Seeding is idempotent per session (do not duplicate if already present).

## Public API projection: `MessageView`

| Field | Type | Required | Source |
|-------|------|----------|--------|
| `id` | string | yes | `_id` |
| `author` | enum | yes | `author` |
| `kind` | enum | yes | `kind` |
| `text` | string | no | `text` (text turns) |
| `audio` | object \| absent | no | `{ contentType, durationMs, byteLength }` (audio turns; no bytes) |
| `sequence` | integer | yes | `sequence` |
| `createdAt` | string (date-time) | yes | `createdAt` |

Audio bytes are **not** part of this projection; they are fetched from the session-scoped audio
endpoint.

## State & lifecycle

- Conversation turns are **append-only**; `sequence` increases; no edits/deletes (auditable record).
- The conversation is only available and only grows while the session is `in_progress` (consent
  accepted). Before consent: no messages, no recording (FR-013).
- No follow-up questioning: after the candidate's recorded reply, the conversation is complete for
  this feature (FR-014).

## Validation Rules (mapped to requirements)

| Rule | Source |
|------|--------|
| Opening messages are exactly the three scripted agent turns, in order | FR-002–FR-005 |
| A saved audio reply becomes a candidate `kind: audio` message referencing the stored recording | FR-007, FR-008 |
| Audio bytes are stored compressed as binary and fetched by id | FR-009, SC-004 |
| Conversation returns in `sequence` order, audio playable after reload | FR-010, SC-003 |
| No message or recording before consent (`409`); unknown session `404` | FR-013, SC-005 |
| Audio is reachable only within its own session | FR-016 |
| Duration/byte bounds; oversize `413`, invalid `400` | FR-017 |

## Relationships

- **Interview Session → Interview Message**: one-to-many (ordered conversation).
- **Interview Message → Audio Recording**: zero-or-one (audio turns reference one recording).
- **Interview Session → Audio Recording**: one-to-many (for scoping/authorization).

## Volume / Scale Assumptions

- One scripted opening (3 short text messages) plus a small number of size-bounded audio replies per
  session. Message documents are tiny; audio documents are at most a few MB.
