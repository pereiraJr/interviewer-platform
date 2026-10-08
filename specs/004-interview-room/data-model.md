# Phase 1 Design: Interview Room

**Feature**: `004-interview-room` | **Date**: 2026-10-07

## Overview

This feature introduces one persisted entity, **Interview Session**, stored in a new MongoDB
`interviewSessions` collection, with an embedded **Consent Record**. It reads the existing **Job**
(for role context). The **Message/Turn** entity is modeled for the chat-like surface but is
**not written** in this feature (questioning/answers are out of scope).

## Entity: Interview Session

### Persisted document (`interviewSessions` collection)

| Field | Type | Required | Constraints / Rules | Notes |
|-------|------|----------|---------------------|-------|
| `_id` | ObjectId | yes | Server-generated | Mapped to string `id`. |
| `jobId` | ObjectId | yes | Must reference an existing, available job | Role the interview is for (FR-002). |
| `candidateId` | string | no | Reserved; unset until auth exists | Assumption: candidate identity implicit. |
| `status` | enum | yes | One of `consent_pending`, `in_progress`, `declined`; default `consent_pending` | Authoritative gate (FR-006/FR-007/FR-012). |
| `consent` | object | no | Present once a decision is made | See Consent Record. |
| `createdAt` | Date | yes | Set on insert | Audit/order. |
| `updatedAt` | Date | yes | Updated on write | Audit/order. |

**Indexes**: `{ jobId: 1, status: 1 }` to find a resumable (non-declined) session for a job.

### Embedded: Consent Record

| Field | Type | Required | Constraints / Rules |
|-------|------|----------|---------------------|
| `decision` | enum | yes | `accepted` or `declined` |
| `decidedAt` | Date | yes | Set when the decision is recorded |
| `noticeVersion` | string | yes | Version of the notice the candidate saw |

### State transitions

```text
(none) --enter room--> consent_pending
consent_pending --accept--> in_progress   (terminal for this feature)
consent_pending --decline--> declined     (terminal; candidate returned to dashboard)
```

- A resumable session is one with status `consent_pending` or `in_progress`. `declined` sessions
  are not resumed; entering the room again starts a fresh `consent_pending` session so the
  candidate may reconsider.
- No transition to `in_progress` is possible without an `accepted` consent.

## Entity: Job (reused — owned by `001-jobs-dashboard`)

Read-only here. Only the public `JobSummary` projection (`id`, `title`, `description`) is needed,
to identify the role in the room.

## Public API projection: `InterviewSessionView`

| Field | Type | Required | Source |
|-------|------|----------|--------|
| `id` | string | yes | `_id` |
| `status` | enum | yes | `status` |
| `job` | `{ id, title, description }` | yes | joined from the `jobs` collection |
| `consent` | object \| `null` | yes | `{ decision, decidedAt, noticeVersion }` or `null` before a decision |
| `notice` | `{ text, version }` | yes | fixed server-owned notice (FR-004) |

`candidateId` is not exposed.

## Entity: Message / Turn (modeled, deferred)

- Represents a single item in the chat-like conversation (interviewer prompt or candidate
  response): `{ id, sessionId, role: 'interviewer' | 'candidate', content, createdAt }`.
- **Not persisted in this feature.** The chat surface renders an empty conversation; no messages
  are created until the interview-mechanics feature lands (FR-011/FR-012).

## Validation Rules (mapped to requirements)

| Rule | Source |
|------|--------|
| `jobId`/session `id` are validated identifiers; unknown job/session → `404` | FR-015, constitution input bounding |
| Consent `decision` ∈ {`accepted`, `declined`}; anything else → `400` | FR-006, FR-009 |
| Interview is `in_progress` only after `accepted` consent | FR-006, FR-007, FR-012 |
| Every session records its consent decision and notice version | FR-010, Principle IV |
| A session never exists for an unknown/unavailable job | FR-015 |
| No audio capture, messages, or transcription occur | FR-011, FR-012 |

## Relationships

- **Job → Interview Session**: one-to-many (a job may be interviewed repeatedly over time; in this
  slice, a resumable session per job is reused).
- **Interview Session → Consent Record**: one-to-one (embedded).
- **Interview Session → Message/Turn**: one-to-many (deferred; no messages this feature).

## Volume / Scale Assumptions

- Single candidate / demo scale: a handful of sessions keyed by job; documents are tiny.
