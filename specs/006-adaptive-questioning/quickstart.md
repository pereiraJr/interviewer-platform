# Quickstart: Adaptive Interview Questioning

**Feature**: `006-adaptive-questioning` | **Date**: 2026-10-07

How to configure the OpenRouter-backed interviewer and verify adaptive, role-grounded questioning.
Paths match [plan.md](./plan.md).

## Prerequisites

- Node.js 20 LTS or newer (npm included)
- MongoDB reachable via the backend config, with at least one available job
  (`npm --prefix backend run seed`)
- An OpenRouter API key and an audio-capable model id
- A browser with microphone access and `MediaRecorder`
- Docker running locally (only for `testcontainers` integration tests)

## Configure

Backend environment (server-side only; never expose the key to the browser):

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `OPENROUTER_API_KEY` | yes (else the feature is disabled) | `sk-or-...` | Server-side model credential |
| `OPENROUTER_MODEL` | recommended | an audio-capable model id | Model used to transcribe + ask |
| `OPENROUTER_BASE_URL` | optional | `https://openrouter.ai/api/v1` | API base |
| `OPENROUTER_TIMEOUT_MS` | optional | `8000` | Bounds the provider call |
| `MONGO_URL` | yes | `mongodb://localhost:27017` | Database |

## Run

```bash
# terminal 1 - API
npm --prefix backend run dev

# terminal 2 - web app
npm --prefix frontend run dev
```

Open the frontend URL (default `http://localhost:5173`).

## Walkthrough

1. From the dashboard, select a job and accept the recording consent.
2. The AIfter Agent opening appears: greeting, `Lets Get Started:`, and the intro question.
3. Record a spoken answer and **Stop & Save**.
4. Within ~10 seconds, a new **role-grounded follow-up** appears as an AIfter Agent question that
   refers to your answer and the job description.
5. Confirm the **transcript is never shown** anywhere in the UI.
6. Record an empty/silent answer and **Stop & Save** → you are prompted to **record again** and no
   question is generated.
7. Continue answering: the interview generates follow-ups until it reaches **6 agent messages**
   (3 opening + 3 generated), after which it shows as complete and no further question is asked.

## API (manual checks)

```bash
# Submit a voice answer (raw binary) -> 201 { message, question }
curl -sS -X POST "http://localhost:4000/api/interviews/<sessionId>/messages" \
  -H "Content-Type: audio/webm" \
  -H "x-audio-duration-ms: 4200" \
  --data-binary @answer.webm

# Silent audio -> 422 NO_SPEECH (nothing persisted)
curl -i -X POST "http://localhost:4000/api/interviews/<sessionId>/messages" \
  -H "Content-Type: audio/webm" \
  --data-binary @silence.webm

# Conversation (transcript never present)
curl -sS "http://localhost:4000/api/interviews/<sessionId>/messages"
```

## Test

```bash
npm test                     # root: backend + frontend
npm --prefix backend test    # unit + testcontainers integration (provider is faked; no network)
npm --prefix frontend test    # React Testing Library
```

> Integration tests require Docker and do **not** call OpenRouter; a fake provider is injected.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
```

All three MUST pass (constitution Development Workflow & Quality Gates).

## Manual verification checklist

1. After a valid voice reply, a role-grounded AIfter Agent question appears within ~10 s.
2. Generated questions relate to the job description and the candidate's answer.
3. The candidate's transcript is never displayed.
4. A silent/empty recording produces no question and a clear re-record prompt.
5. The interview stops generating questions once it reaches 6 agent messages.
6. If the model provider is unavailable, the candidate sees a clear error and can retry without
   losing the session.
7. No processing happens before consent is accepted.
