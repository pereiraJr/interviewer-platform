<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Bump rationale: MINOR. Clarifies the voice/transcription contract: transcription is NOT a
client-facing step and MUST NOT run during or be surfaced in the interview; it happens
behind the scenes for auditing and downstream processing. This redefines when and why a
core behavior occurs, so it is materially expanded guidance rather than a wording fix.

Modified principles:
- I. Component-Driven, Clear Interfaces (unchanged)
- II. Voice-First Candidate Experience (clarified: no client-facing transcription)
- III. Role-Grounded Adaptive Questioning (unchanged; depends on behind-the-scenes transcript)
- IV. Auditable Sessions & Structured Evaluations (clarified: transcript generated behind the scenes)
- V. Test Discipline (unchanged)

Added sections:
- None (initial sections retained: Data Privacy & Security Constraints; Development Workflow & Quality Gates)

Removed sections:
- None

Templates requiring updates:
- ✅ .specify/templates/plan-template.md (Constitution Check gate left generic; no change needed)
- ✅ .specify/templates/spec-template.md (requirements/entities align; no change needed)
- ✅ .specify/templates/tasks-template.md (test-task note reflects mandated testing; no change needed)
- ✅ .opencode/commands/speckit.constitution.md (no outdated agent-specific references)
- ✅ AGENTS.md (runtime guidance reference added implicitly via plan)

Follow-up TODOs:
- None
-->

# AfterQuery Interviewer Platform Constitution

## Core Principles

### I. Component-Driven, Clear Interfaces

Every user-facing capability MUST be delivered as a small, composable component with a
single clear responsibility. The application MUST present an explicit, linear flow
(select job → interview → review transcript/evaluation) that a first-time user can
complete without instructions. Components MUST NOT embed unrelated business logic; shared
state MUST flow through well-defined interfaces so components remain independently
testable in isolation.

Rationale: The platform's value is a frictionless, legible interview experience; clear
component boundaries are what make the UI auditable and testable.

### II. Voice-First Candidate Experience

Candidates MUST interact with the interview primarily through voice. The record control
MUST be a single, unambiguous click to start and a single, unambiguous click to stop and
save the recording. Transcription MUST NOT run during, nor be surfaced within, the
client-facing interview experience: the candidate's speech is transcribed behind the
scenes (server-side, out of band) solely for auditing and downstream processing of the
session. The client-facing UI MUST surface only capture state (idle, recording, saving,
error) and MUST handle permission denial, silent/empty audio, and capture failure
gracefully without losing the candidate's session.

Rationale: Voice is the core modality of a spoken interview. Keeping transcription off the
client-facing surface preserves candidate immersion and avoids exposing sensitive
intermediate data, while behind-the-scenes transcription still enables auditability and
adaptive follow-ups.

### III. Role-Grounded Adaptive Questioning

The AI interviewer MUST ground its questions in the selected job's description and
requirements. Questions MUST be dynamic: each subsequent question MUST incorporate the
candidate's prior replies and MAY deepen follow-ups on specific experience, projects,
skills, or gaps. The interview session MUST persist prior turns as reusable context for
generating follow-ups within the same session. The model MUST NOT invent job requirements
that are absent from the job description, and the question-generation step MUST remain
decoupled from the transport/UI layer so it can be tested deterministically.

Rationale: A role-grounded, adaptive interview produces more relevant signal than a fixed
question script and is the central differentiator of the product.

### IV. Auditable Sessions & Structured Evaluations

Every interview MUST be persisted as a session that can be revisited later. On interview
completion the system MUST store the full transcript as an immutable historical record. The
transcript MUST be generated behind the scenes and MUST NOT be exposed to the candidate
during the client-facing interview; it exists for auditing and downstream processing.
The system MUST produce a structured evaluation serialized as JSON with a stable,
documented schema.
Stored sessions MUST be retrievable by identifier and MUST preserve the relationship
between job, transcript turns, and evaluation. Evaluation output MUST be machine-readable
and validated against its schema before persistence; invalid output MUST fail loudly rather
than be stored silently.

Rationale: Interviews are decision-support artifacts; auditability and a stable evaluation
schema are required for review, comparison, and downstream automation.

### V. Test Discipline (NON-NEGOTIABLE)

Behavior MUST be covered by automated tests. Unit tests MUST cover pure logic (question
selection, transcript assembly, evaluation schema validation, session state transitions).
Integration tests MUST cover cross-boundary flows where applicable (recording → transcript
→ session persistence, API endpoints, the AI question/evaluation pipeline against a mocked
or recorded provider). Tests MUST be runnable with a single documented command. New
behavior that is not covered by a test where a test is applicable MUST NOT be considered
complete.

Rationale: Voice capture, model-driven question flow, and JSON evaluation are
error-prone and non-deterministic by nature; automated tests are the only reliable guard
against regressions.

## Data Privacy & Security Constraints

Interview content (audio, transcripts, and evaluations) is sensitive personal data.
The system MUST:

- Treat candidate interview data as confidential and MUST NOT log raw audio, full
  transcripts, or credentials in application logs.
- Require explicit candidate consent before recording begins.
- Store AI provider credentials server-side only; credentials MUST NOT be exposed to the
  browser or committed to the repository.
- Persist only the data required to deliver the interview and its audit trail; provide a
  clear retention/deletion path for sessions.
- Validate and bound all externally supplied input (job identifiers, uploaded audio,
  session identifiers) before use.

## Development Workflow & Quality Gates

All changes MUST flow through the Spec-Driven Development loop
(specify → plan → tasks → implement) and MUST satisfy the following gates before being
considered done:

- Linting and type/static checks MUST pass with no errors.
- The automated test suite MUST pass; failing or skipped critical-path tests block merge.
- API and data contracts (including the evaluation JSON schema) MUST be documented and
  versioned before implementation; contract changes require corresponding test updates.
- Complexity beyond the simplest viable design MUST be justified in the plan's Complexity
  Tracking section.
- The runtime development guidance in `AGENTS.md` and the active plan MUST be kept
  consistent with this constitution.

## Governance

This constitution supersedes all other development practices and conventions for the
AfterQuery Interviewer Platform. Amendments MUST be documented, reviewed, and approved
before taking effect.

- **Amendment procedure**: Propose the change with rationale; update this document and any
  dependent templates/guidance; record the change in the Sync Impact Report; obtain review
  approval; then commit with a `docs:` message.
- **Versioning policy**: This constitution uses semantic versioning. MAJOR for
  backward-incompatible governance or principle removals/redefinitions; MINOR for new
  principles or materially expanded guidance; PATCH for clarifications and non-semantic
  refinements.
- **Compliance review**: Every pull request MUST verify compliance with these principles
  and gates. Non-compliant work MUST be justified in the plan's Complexity Tracking section
  or rejected. Reviewers are responsible for enforcing the NON-NEGOTIABLE principles.

**Version**: 1.1.0 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-07
