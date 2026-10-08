# Quickstart: Interview Conversation

**Feature**: `005-interview-conversation` | **Date**: 2026-10-07

How to run and verify the scripted opening, the audio record/save flow, playback, and persistence.
Paths match [plan.md](./plan.md).

## Prerequisites

- Node.js 20 LTS or newer (npm included)
- MongoDB reachable via the backend config (`MONGO_URL`), with at least one available job
  (`npm --prefix backend run seed`)
- A browser with microphone access and `MediaRecorder` support
- Docker running locally (only for `testcontainers` integration tests)

## Run

```bash
# terminal 1 - API
npm --prefix backend run dev

# terminal 2 - web app
npm --prefix frontend run dev
```

Open the frontend URL (default `http://localhost:5173`).

## Walkthrough

1. From the dashboard, select a job and **Accept** the recording consent banner.
2. The conversation begins automatically, in order:
   - the **AIfter Agent** greeting (introduces itself as AIfter Agent),
   - `Lets Get Started:`,
   - `Could you give a brief intro about yourself?`.
3. Click **Record** (grant microphone permission the first time). The control shows that recording
   is in progress.
4. Click **Stop & Save**. The audio appears immediately as a **candidate** reply bubble with a
   play control.
5. Press play on the reply to confirm it plays back.
6. **Reload** the room. The conversation is restored in order and the audio reply is still playable.
7. After the reply, no further question is shown (follow-up questioning is out of scope).

## API (manual checks)

```bash
# Conversation in order (text inline; audio as metadata only)
curl -sS "http://localhost:4000/api/interviews/<sessionId>/messages"

# Upload a recorded reply (raw binary body)
curl -sS -X POST "http://localhost:4000/api/interviews/<sessionId>/messages" \
  -H "Content-Type: audio/webm" \
  -H "x-audio-duration-ms: 4200" \
  --data-binary @answer.webm
# -> 201 with the created candidate message

# Stream the stored audio for a message
curl -sS "http://localhost:4000/api/interviews/<sessionId>/messages/<messageId>/audio" \
  --output answer-playback.webm

# Posting before consent is rejected
# -> 409 Conflict
```

## Test

```bash
npm test                     # root: backend + frontend
npm --prefix backend test    # unit + testcontainers integration
npm --prefix frontend test   # React Testing Library (MediaRecorder mocked)
```

> Integration tests require Docker because MongoDB is started via `testcontainers`.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
```

All three MUST pass (constitution Development Workflow & Quality Gates).

## Manual verification checklist

1. After accepting consent, the three opening messages appear automatically in the correct order.
2. No messages are shown and no recording is possible before consent is accepted.
3. Recording shows a clear in-progress state; saving immediately adds a candidate reply bubble.
4. The saved reply can be played back.
5. Reloading restores the conversation in order with the audio reply still playable.
6. Denying microphone permission shows a clear error without losing the session.
7. A recording stopped immediately (empty audio) or exceeding the limit is handled clearly.
