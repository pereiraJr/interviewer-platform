# Phase 1 Data Model: Jobs Dashboard

**Feature**: `001-jobs-dashboard` | **Date**: 2026-10-07

## Overview

This feature introduces a single persisted entity, **Job**, stored in MongoDB in the `jobs`
collection. The public API exposes only the fields the dashboard needs (identifier, title,
brief description); availability status is an internal storage concern used to filter the
result set.

## Entity: Job

### Persisted document (`jobs` collection)

| Field | Type | Required | Constraints / Rules | Notes |
|-------|------|----------|---------------------|-------|
| `_id` | ObjectId | yes | Server-generated | Mapped to string `id` in the API. |
| `title` | string | yes | Non-empty after trim; max 200 chars | Rendered as the card title (FR-003). |
| `description` | string | no | Trimmed; max 500 chars; may be empty | Brief description; empty/missing is allowed (Edge case). |
| `status` | string enum | yes | One of `available`, `closed`; default `available` | Internal; repository filters to `available` (FR-001). Not exposed publicly. |
| `createdAt` | Date | yes | Set on insert | Ordering / audit. |
| `updatedAt` | Date | yes | Updated on write | Ordering / audit. |

**Indexes**: `{ status: 1, createdAt: -1 }` to serve the "available jobs, newest first"
query efficiently.

### Public API projection: `JobSummary`

| Field | Type | Required | Constraints | Source |
|-------|------|----------|-------------|--------|
| `id` | string | yes | Stringified `_id`; stable and unique | `_id` |
| `title` | string | yes | Non-empty | `title` |
| `description` | string | yes | May be `""` when absent on the document; the API MUST return a string, never `null`/`undefined` | `description ?? ""` |

The public projection intentionally omits `status`, `createdAt`, and `updatedAt` to keep the
dashboard contract minimal (see `research.md` Decision 10).

### Frontend view type

`frontend/src/types/job.ts`

```ts
export interface Job {
  id: string;
  title: string;
  description: string;
}
```

This mirrors `JobSummary` exactly so the API layer and components share one shape.

## Validation Rules (mapped to requirements)

| Rule | Source |
|------|--------|
| Every returned job has a non-empty `title` | FR-003 |
| `description` is always a string (`""` when absent) | FR-004, Edge case "Missing or empty description" |
| Only `status = "available"` documents are returned | FR-001 |
| Field lengths bounded (title ≤ 200, description ≤ 500) | FR-012 (contained card content), input bounding in constitution |
| `id` is unique per job | FR-002 (distinct cards) |

## Relationships

- **Job → JobSummary**: projection (1:1), performed in the repository/service mapping step.
- No relationships to other entities exist in this slice. The interview session, transcript,
  and evaluation entities belong to later features and are intentionally not modeled here.

## State & Lifecycle

- A job's `status` transitions `available → closed` (and potentially back) outside this
  feature; the dashboard only ever reads jobs in the `available` state.
- No lifecycle transitions are triggered by the dashboard itself (read-only consumption).

## Volume Assumptions

- Small catalogue: hundreds of jobs, all returned in a single response (FR-014, no pagination).
- Response size stays comfortably small (approx. ≤ 500 jobs × ≤ 700 chars ≈ a few hundred KB).
