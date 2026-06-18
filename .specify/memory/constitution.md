<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0 (initial ratification)

Added sections:
  - I. Code Quality & Architecture Fidelity (new)
  - II. Test-First Development (new)
  - III. UX Consistency (new)
  - IV. Performance Standards (new)
  - Technology Stack (new)
  - Governance (new)

Modified principles: N/A (initial creation)
Removed sections: N/A

Templates updated:
  ✅ .specify/templates/plan-template.md — Constitution Check gates aligned
  ✅ .specify/templates/spec-template.md — Performance & test requirements added
  ✅ .specify/templates/tasks-template.md — Test tasks marked mandatory (not optional)

Deferred TODOs: none
-->

# LTI (Lean Talent Intelligence) Constitution

## Core Principles

### I. Code Quality & Architecture Fidelity

Every code change MUST respect the existing layered architecture and DDD boundaries
established in the project. No new frameworks or libraries may be introduced without
explicit team approval documented in the PR description.

**Backend (TypeScript + Express + Prisma + PostgreSQL):**

- The layered flow Routes → Controllers → Services → Domain Models → Prisma MUST be
  preserved. Cross-layer shortcuts (e.g., Prisma calls in controllers) are forbidden.
- Each layer owns exactly one concern: controllers handle HTTP only; services own
  business orchestration; domain models encapsulate persistence via `save()`/`findOne()`.
- Business operations on `Education` or `WorkExperience` MUST go through the `Candidate`
  aggregate root — never modify child entities directly from a service.
- TypeScript strict mode MUST be satisfied (`tsconfig.json` `strict: true`). `any` is
  forbidden; all types must be explicit. Interfaces MUST define service contracts before
  implementation classes are written (`ICandidateService`, etc.).
- `async/await` MUST be used instead of raw Promise chains.
- ESLint + Prettier MUST pass (`npx eslint src/` + `npx prettier --check src/`) before
  every commit. Single quotes and trailing commas are enforced by `.prettierrc`.
- All new files MUST use ES module `import/export` syntax (not `require`).
- Controllers MUST wrap every service call in `try/catch` and return structured HTTP
  error responses. Services MUST throw domain errors; controllers map them to HTTP codes.
- A single shared `PrismaClient` instance MUST be used project-wide to prevent connection
  pool exhaustion.

**Frontend (React 18 + TypeScript + CRA):**

- New components MUST be written in TypeScript (`.tsx`). `tsconfig.json` strict mode
  applies; `any` is forbidden and explicit prop interfaces are required.
- One component per file. Components MUST have a single responsibility; large forms MUST
  be broken into sub-components (following the `FileUploader`/`AddCandidateForm` pattern).
- API calls MUST NOT be inlined in JSX event handlers. They MUST be extracted into named
  `async` functions within the component or, preferably, into a dedicated service file
  under `src/services/`.
- New routes MUST be registered in `src/App.js` following the existing React Router v6
  `<Route>` pattern. No lazy loading or nested routes without explicit design decision.
- If cross-component state becomes necessary, React Context MUST be introduced before
  reaching for any third-party state-management library.
- Named exports MUST be used for components. Imports MUST be grouped in order:
  React → third-party → local components → styles.

**Rationale:** The codebase has an established DDD-inspired layered architecture
documented in `backend/AGENTS.md` and `frontend/AGENTS.md`. Deviating from it without
explicit approval creates inconsistencies that compound into maintenance debt.

### II. Test-First Development (NON-NEGOTIABLE)

Tests MUST be written before implementation. The Red–Green–Refactor cycle is strictly
enforced for all business logic, services, and utility functions.

**Unit Tests (backend — Jest + ts-jest):**

- MUST be written and confirmed FAILING before the corresponding implementation code is
  written.
- REQUIRED for: every service in `src/application/services/`, every utility/validator
  in `src/application/`, and every domain model method that contains business logic.
- Test files MUST be colocated next to the source file (`candidateService.test.ts`
  alongside `candidateService.ts`).
- Prisma and service dependencies MUST be mocked with `jest.mock()` at the top of each
  test file. The Arrange → Act → Assert pattern MUST be used.
- Minimum coverage threshold: **80% line + branch coverage** for all backend business
  logic (services and validators). Coverage MUST be enforced in CI.

**Integration Tests (backend):**

- REQUIRED for any new code that touches the PostgreSQL database or calls an external
  API. Unit-level mocking is insufficient for these cases.
- Integration tests MUST use a real (or Docker-based test) database instance, never the
  production database.

**Component Tests (frontend — React Testing Library):**

- REQUIRED for every new React component in `src/components/`.
- Tests MUST assert on observable behavior (what the user sees and interacts with), never
  on internal implementation details (state variables, private methods).
- `fetch` MUST be mocked via `global.fetch = jest.fn(...)` for components that call the
  backend.
- Test setup MUST follow the pattern documented in `frontend/AGENTS.md`:
  `jest.config.js` + `src/setupTests.ts` with `@testing-library/jest-dom`.

**End-to-End Tests:**

- MUST be written ONLY for critical user paths (e.g., full candidate creation flow,
  uploading a CV). E2E tests are not a substitute for unit or component test coverage.

**Gate:** `npm test` MUST pass with zero failures before any PR is merged. New code
that reduces coverage below the 80% threshold for backend business logic is a blocking
issue.

**Rationale:** The backend already has a Jest+ts-jest test infrastructure with colocated
tests. The frontend has no tests today — any new frontend work MUST include tests. TDD
prevents regressions and drives better API design.

### III. UX Consistency

All UI work MUST reuse the existing Bootstrap 5 design system and `react-bootstrap`
components. Ad-hoc or one-off styles are forbidden.

- **Bootstrap 5** (via `react-bootstrap` + `bootstrap/dist/css/bootstrap.min.css`) is
  the single source of truth for layout, spacing, color, and typography.
- Bootstrap utility classes and `react-bootstrap` components (e.g., `<Button>`,
  `<Form>`, `<Card>`) MUST be used. Custom CSS is only permitted when a Bootstrap utility
  genuinely cannot cover the case.
- Custom CSS, when necessary, MUST be scoped to a component-level file (e.g.,
  `Component.css`). Global `index.css` is reserved for base resets only.
- No inline `style` props in JSX unless driven by dynamic runtime values that cannot be
  expressed as class names.
- Visual patterns established in existing components (`RecruiterDashboard`, `Positions`,
  `AddCandidateForm`) MUST be followed for new pages. Reuse existing layout patterns
  before proposing new ones.

**Rationale:** The frontend already uses Bootstrap 5 throughout. Introducing ad-hoc
styles or alternative CSS frameworks creates visual inconsistency and increases bundle
size.

### IV. Performance Standards

All features MUST be designed and verified against the performance budgets below.

**Frontend — Google Core Web Vitals (production build):**

| Metric | Target (Good) | Threshold (Needs Improvement) |
|--------|---------------|-------------------------------|
| LCP (Largest Contentful Paint) | < 2.5 s | 2.5 s – 4.0 s |
| INP (Interaction to Next Paint) | < 200 ms | 200 ms – 500 ms |
| CLS (Cumulative Layout Shift) | < 0.10 | 0.10 – 0.25 |

- Components MUST NOT trigger unnecessary re-renders. Memoization (`React.memo`,
  `useMemo`, `useCallback`) SHOULD be applied when a component is known to re-render
  frequently with unchanged props.
- Images and static assets MUST be appropriately sized and compressed before inclusion.
- The production bundle MUST be analyzed (`react-scripts build` output) when adding
  new dependencies to avoid unexpected size regressions.

**Backend — Response Time Budgets (p95, measured under normal load):**

| Operation type | p95 target |
|----------------|-----------|
| Simple reads — single-resource GET (e.g., `GET /candidates/:id`) | < 200 ms |
| Write operations — POST/PUT with validation and DB persistence | < 500 ms |
| Complex aggregations (e.g., `GET /position/:id/candidates` with score averaging) | < 2 s |

- The single shared `PrismaClient` instance MUST be maintained to avoid connection pool
  exhaustion that degrades p95 latency.
- N+1 query patterns are forbidden. Prisma `include` and `select` MUST be used to
  fetch related data in a single query where possible.
- New endpoints MUST document their expected operation type (simple read / write /
  complex) in `api-spec.yaml` to make performance expectations explicit.

**Rationale:** Google Core Web Vitals directly affect search ranking and user retention.
The backend latency targets are calibrated to the existing API surface: simple lookups
are inexpensive; write paths include validation overhead; aggregation endpoints have a
wider budget because of join complexity.

## Technology Stack (Reference)

This table documents the approved stack. Any addition requires an explicit PR
description justifying the new dependency and approval from a project lead.

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | Node.js | ≥ 18 |
| Backend language | TypeScript | strict mode |
| Backend framework | Express | existing |
| ORM | Prisma | existing |
| Database | PostgreSQL | port 5432 |
| Backend testing | Jest + ts-jest | existing |
| Frontend framework | React | 18 |
| Frontend build | Create React App (CRA) / react-scripts | 5 |
| Frontend language | TypeScript (.tsx) | strict mode |
| UI system | Bootstrap 5 + react-bootstrap | existing |
| Frontend routing | React Router | v6 |
| Frontend testing | Jest + React Testing Library + jest-dom | to be set up per AGENTS.md |

## Governance

- This constitution supersedes all other informal practices. When a practice documented
  elsewhere conflicts with a principle here, this document takes precedence.
- **Amendments** require: (1) a PR updating this file, (2) a version bump following
  semantic versioning (see below), (3) corresponding updates to any affected templates
  under `.specify/templates/`, and (4) reviewer approval from at least one project lead.
- **Versioning policy:**
  - MAJOR: Removal or incompatible redefinition of an existing principle.
  - MINOR: Addition of a new principle or material expansion of guidance.
  - PATCH: Clarifications, wording corrections, non-semantic refinements.
- **Compliance review:** Every PR description MUST include a brief Constitution Check
  confirming adherence to all four principles (Code Quality, Test-First, UX Consistency,
  Performance). The plan template's Constitution Check gate enforces this at design time.
- All new features MUST follow the workflow in `backend/AGENTS.md` (Adding a New
  Feature) and `frontend/AGENTS.md` (Adding a New Page / Feature).

**Version**: 1.0.0 | **Ratified**: 2026-06-18 | **Last Amended**: 2026-06-18
