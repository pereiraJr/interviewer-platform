# Phase 0 Research: Jobs Dashboard

**Feature**: `001-jobs-dashboard` | **Date**: 2026-10-07

All Technical Context unknowns are resolved below. Each decision records the choice, the
rationale, and the alternatives considered. A guiding constraint from the user is **minimal
third-party tools**, so every library is justified against a lower-dependency option.

## Decision 1: Backend language & HTTP framework

- **Decision**: TypeScript on Node.js LTS with **Express** for the REST API.
- **Rationale**: Explicitly requested. Express is the most widely documented minimal HTTP
  layer for Node, and a route → service → repository split keeps it small and testable.
- **Alternatives considered**: Fastify/NestJS (more built-in structure but more dependencies
  and concepts than needed); raw Node `http` (avoids one dependency but reimplements routing,
  JSON parsing, and error handling that Express provides).

## Decision 2: MongoDB access layer (driver vs ODM)

- **Decision**: Use the **official `mongodb` Node.js driver** directly, wrapped in a small
  repository module.
- **Rationale**: Honors "minimal third-party tools" — no ODM (e.g. Mongoose) is needed for a
  single collection with a trivial shape. Keeping the driver behind `jobRepository` means the
  ODM could be introduced later without touching services or routes.
- **Alternatives considered**: Mongoose (schema validation and castings, but heavier and its
  ODM coupling is unnecessary here); Prisma/TypeORM (larger, target relational/typed models
  more than this use case).

## Decision 3: HTTP/API integration testing approach

- **Decision**: Integration tests start the Express app on an ephemeral port and call it with
  the built-in `fetch` (Node 20+), against a **real MongoDB started via `testcontainers`**.
- **Rationale**: Exercises the true HTTP surface and a real database, satisfying Principle V's
  "API endpoints" and "inter-service communication" integration-test expectations. Using
  `fetch` avoids adding `supertest`.
- **Alternatives considered**: `supertest` (ergonomic, but an extra dependency for behavior we
  can get from `fetch`); `mongodb-memory-server` (faster, but not a real MongoDB container and
  explicitly the user asked for `testcontainers`).

## Decision 4: Test runner

- **Decision**: **Jest** for all packages (backend unit/integration, frontend unit).
- **Rationale**: Explicitly requested and works for both Node and jsdom environments via
  `ts-jest`/SWC transform.
- **Alternatives considered**: Vitest (excellent, but a second runner diverges from the
  requested stack); Node's built-in test runner (would avoid Jest but contradicts the request).

## Decision 5: Frontend framework, testing, and routing

- **Decision**: **React + TypeScript**. Unit-test components with
  `@testing-library/react` (+ `@testing-library/jest-dom`) under Jest/jsdom. Navigate to the
  job detail view with **React Router**.
- **Rationale**: React/TypeScript explicitly requested. React Testing Library is the community
  best practice (test behavior/accessibility, not implementation). Routing is required by
  FR-007; React Router is the de-facto standard and keeps the route testable in memory
  (`MemoryRouter`).
- **Alternatives considered**: Enzyme (deprecated); React's bare `react-test-renderer` (does
  not encourage accessible, user-centric queries); custom History API navigation (avoids a
  dependency but complicates testing and accessibility — rejected).

## Decision 6: Data fetching & state

- **Decision**: Fetch on mount with the built-in `fetch` inside a `useEffect`, tracked by a
  small local state machine (`idle | loading | success | error`), surfaced through a typed
  `jobsApi` module.
- **Rationale**: The slice has one GET request and no caching/mutation needs; a data-fetching
  library is unnecessary.
- **Alternatives considered**: TanStack Query/SWR (powerful caching and retries, but extra
  dependencies unjustified for a single read); Redux (far too much for one page).

## Decision 7: Layout for the three-column grid

- **Decision**: CSS **Grid** (`grid-template-columns: repeat(3, 1fr)`) with media queries that
  reduce to 2 and 1 columns at narrower breakpoints; cards truncate long text with CSS.
- **Rationale**: Native CSS meets FR-005/FR-006/FR-012 with zero dependencies and is smooth to
  test visually and via computed styles.
- **Alternatives considered**: Flexbox with calculated widths (more fragile for equal columns);
  a grid/UI library (violates minimal dependencies).

## Decision 8: Build/dev tooling & package manager

- **Decision**: **npm** (bundled with Node) with a root `package.json` of fan-out scripts; use
  **Vite** to build/serve the React frontend; run the backend through a TypeScript executor.
- **Rationale**: npm needs no extra install. Vite is the current standard React+TS dev server
  (fast dev experience, sane defaults) and is a dev-time tool, not a runtime dependency.
- **Alternatives considered**: Yarn/pnpm (extra tool); webpack (more configuration for the same
  result); no bundler (poor DX and no HMR for React).

## Decision 9: API response shape & error envelope

- **Decision**: `GET /api/jobs` returns `200 { "jobs": JobSummary[] }`; errors return
  `{ "error": { "code": string, "message": string } }` with an appropriate status. Unknown
  routes return `404` with the same error envelope.
- **Rationale**: An object envelope leaves room for future metadata without a breaking change,
  and a single error shape simplifies frontend handling and tests.
- **Alternatives considered**: Bare top-level array (simplest, but no room to evolve);
  JSON:API (over-specified for one endpoint).

## Decision 10: Job availability semantics

- **Decision**: The repository filters to currently available jobs, backed by a `status` field
  (`"available" | "closed"`) on the stored document; only available jobs are returned and the
  status is not exposed in the API response.
- **Rationale**: FR-001 requires "currently available" jobs; modeling status server-side keeps
  the public contract minimal (id/title/description) while leaving room to manage postings.
- **Alternatives considered**: Hard-deleting closed jobs (loses audit history); exposing
  `status` to the client (unnecessary for the dashboard).

## Open items

None. All NEEDS CLARIFICATION items from Technical Context are resolved.
