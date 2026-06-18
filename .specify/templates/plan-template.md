          # Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

### Backend

**Language/Version**: TypeScript (strict mode) — Node.js ≥ 18

**Primary Dependencies**: Express (HTTP framework), Prisma ORM, `ts-node-dev` (dev server)

**Storage**: PostgreSQL (port 5432) accessed exclusively via Prisma. Single shared
`PrismaClient` instance — do not instantiate additional clients.

**Testing**: Jest + ts-jest. Tests colocated next to source files (`*.test.ts`).
Prisma and service dependencies mocked with `jest.mock()`. Run with `npm test`.

**Target Platform**: Local server at `http://localhost:3010`; CORS configured for
`http://localhost:3000` only — update backend CORS config when changing frontend port.

**Project Type**: REST API / web-service

**Architecture**: Layered DDD — Routes → Controllers → Services → Domain Models → Prisma.
Every new endpoint MUST follow: domain model → service → controller → route registration
→ `api-spec.yaml` documentation → colocated `.test.ts`.

**Performance Goals** (from constitution v1.0.0):
- Simple single-resource GETs: < 200 ms p95
- POST/PUT with validation + DB write: < 500 ms p95
- Complex aggregations (e.g., candidates with score averages): < 2 s p95

**Constraints**:
- No new `PrismaClient` instantiations (connection pool exhaustion risk).
- No Prisma calls outside domain model classes (`src/domain/models/`).
- All new TypeScript must satisfy `strict: true`; `any` is forbidden.
- ESLint + Prettier must pass before commit.
- Use ES module `import/export` throughout (no `require`).

### Frontend

**Language/Version**: TypeScript (`.tsx`, strict mode) — Node.js ≥ 18

**Primary Dependencies**: React 18, React Router v6, Bootstrap 5,
`react-bootstrap`, Create React App (`react-scripts` 5 / Webpack)

**Storage**: Stateless — all data fetched from backend at `http://localhost:3010`.
Base URL MUST come from `process.env.REACT_APP_API_BASE_URL` (not hardcoded).

**Testing**: Jest + React Testing Library + `@testing-library/jest-dom`.
Tests colocated next to component files. `fetch` mocked via `global.fetch = jest.fn(...)`.
Run with `npm test`.

**Target Platform**: Browser SPA at `http://localhost:3000`

**Project Type**: Single-page React application (recruiter dashboard)

**Architecture**: `src/components/` for route-level pages and shared UI;
`src/services/` for all API calls (never inline `fetch` inside JSX event handlers).
New routes registered in `src/App.js` following the existing React Router v6 `<Route>` pattern.

**Performance Goals** (from constitution v1.0.0 — Google Core Web Vitals, good tier):
- LCP < 2.5 s · INP < 200 ms · CLS < 0.10 (production build)

**Constraints**:
- UI MUST use Bootstrap 5 / `react-bootstrap` exclusively; no ad-hoc or inline styles.
- New components MUST be `.tsx`; `allowJs: true` is only for existing `.js` files.
- State management: local `useState` is sufficient; introduce React Context before any
  third-party state library.
- `npm run eject` is irreversible — never run it.

**Scale/Scope**: [feature-specific — e.g., number of new views, API endpoints touched]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answer each gate. A failing gate is a blocking issue that must be resolved before proceeding.

| # | Gate | Pass / Fail / N/A | Notes |
|---|------|-------------------|-------|
| 1 | **Code Quality** — Does this feature stay within the layered architecture (Routes → Controllers → Services → Domain Models → Prisma for backend; `src/components/` + `src/services/` for frontend)? No new frameworks/libraries introduced without approval? | | |
| 2 | **Test-First** — Are unit tests planned for every new service, validator, and utility (backend)? Component tests planned for every new React component (frontend)? Integration tests planned for any code touching the DB or external APIs? TDD (Red → Green → Refactor) confirmed? | | |
| 3 | **UX Consistency** — Does the UI exclusively use Bootstrap 5 / react-bootstrap components and utility classes? No ad-hoc or inline styles introduced? | | |
| 4 | **Performance** — Is the expected operation type declared (simple read / write / complex aggregation)? Are the p95 latency targets achievable given the design? Core Web Vitals impact assessed for frontend changes? | | |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

<!--
  This project is a full-stack web application (backend + frontend).
  Expand the trees below with the concrete files added or modified by this feature.
  Remove sub-trees that this feature does not touch.
-->

```text
backend/
├── src/
│   ├── routes/                        # Register new Express paths here
│   │   └── [featureRoutes].ts
│   ├── presentation/
│   │   └── controllers/               # HTTP layer only — parse req, call service, return res
│   │       └── [featureController].ts
│   │       └── [featureController].test.ts
│   ├── application/
│   │   ├── services/                  # Business orchestration + use-case logic
│   │   │   └── [featureService].ts
│   │   │   └── [featureService].test.ts
│   │   └── validator.ts               # Extend if new input validation is needed
│   └── domain/
│       └── models/                    # Domain entities with Prisma-backed persistence
│           └── [FeatureModel].ts
├── prisma/
│   └── schema.prisma                  # Update if new entities or fields are needed
└── api-spec.yaml                      # Document every new endpoint here

frontend/
├── src/
│   ├── components/                    # One .tsx file per component
│   │   └── [FeatureComponent].tsx
│   │   └── [FeatureComponent].test.tsx
│   ├── services/                      # All fetch/API calls live here — not inside components
│   │   └── [featureService].ts
│   └── App.js                         # Register new <Route> entries here
└── .env                               # REACT_APP_API_BASE_URL (if not already present)
```

**Structure Decision**: This project always uses the full-stack layout above (backend + frontend).
Annotate which files are new vs. modified, and list any Prisma schema changes that require
a migration (`npx prisma migrate dev --name <migration-name>`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
