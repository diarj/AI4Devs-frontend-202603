# Implementation Plan: Position Kanban Board

**Branch**: `001-position-kanban-board` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-position-kanban-board/spec.md`

---

## Summary

Build a new `PositionDetail` page (route `/positions/:id`) that renders a drag-and-drop
Kanban board for a specific position's hiring pipeline. The board fetches interview flow
phases and candidate data from existing backend endpoints, organises candidates into
columns by current phase, and persists phase changes via drag-and-drop using
`PUT /candidates/:id`. A frontend-only service layer handles all API calls. No backend
changes are required.

---

## Technical Context

### Backend

**Language/Version**: TypeScript (strict mode) — Node.js ≥ 18

**Primary Dependencies**: Express, Prisma ORM, `ts-node-dev`

**Storage**: PostgreSQL (port 5432) via Prisma. Single shared `PrismaClient` instance.

**Testing**: Jest + ts-jest. Tests colocated next to source files. Run with `npm test`.

**Target Platform**: `http://localhost:3010`; CORS for `http://localhost:3000`.

**Project Type**: REST API / web-service

**Architecture**: Layered DDD — Routes → Controllers → Services → Domain Models → Prisma.

**Performance Goals** (from constitution v1.0.0):
- `GET /position/:id/interviewflow` → simple read → < 200 ms p95
- `GET /position/:id/candidates` → complex aggregation (score averaging) → < 2 s p95
- `PUT /candidates/:id` → write with validation + DB → < 500 ms p95

**Constraints**:
- No backend changes needed for this feature — all endpoints already exist.
- No new `PrismaClient` instantiations.
- ESLint + Prettier must pass before commit.

### Frontend

**Language/Version**: TypeScript (`.tsx`, strict mode) — Node.js ≥ 18

**Primary Dependencies**: React 18, React Router v6, Bootstrap 5, `react-bootstrap`,
CRA (`react-scripts` 5), **`@hello-pangea/dnd`** (drag-and-drop — see research.md)

**Storage**: Stateless SPA. All data fetched from `http://localhost:3010` via service layer.

**Testing**: Jest + React Testing Library + `@testing-library/jest-dom`.
`fetch` mocked via `global.fetch = jest.fn(...)`. Run with `npm test`.

**Target Platform**: Browser SPA at `http://localhost:3000`

**Project Type**: Single-page React application

**Architecture**:
- `src/components/` — one `.tsx` file per component + colocated `.test.tsx`
- `src/services/positionService.ts` — all API calls for this feature
- `src/App.js` — new `<Route path="/positions/:id" element={<PositionDetail />} />`

**Scale/Scope**: 1 new route, 4 new components, 1 new service file, 1 existing component
updated (`Positions.tsx`), 1 new npm dependency (`@hello-pangea/dnd`).

---

## Constitution Check

| # | Gate | Pass / Fail | Notes |
|---|------|-------------|-------|
| 1 | **Code Quality** — Layered architecture respected? No unapproved new frameworks? | **Pass** | No backend changes. Frontend follows `src/components/` + `src/services/` pattern. `@hello-pangea/dnd` is the sole new dependency — justified in research.md (drag-and-drop is a functional requirement with no viable pure-Bootstrap alternative). |
| 2 | **Test-First** — Unit/component tests planned for all new code? TDD confirmed? | **Pass** | Component tests required for all 4 new components and the service layer. Tests written BEFORE implementation (Red → Green → Refactor). No new backend services — existing backend tests unaffected. |
| 3 | **UX Consistency** — Bootstrap 5 / react-bootstrap exclusively? No ad-hoc styles? | **Pass** | Board layout uses Bootstrap `d-flex`/`flex-column`/responsive grid utilities. Kanban column and card styles use Bootstrap card components and utility classes. A scoped `PositionDetail.css` is allowed for the narrow drag-over highlight (a dynamic runtime value Bootstrap utilities cannot express). |
| 4 | **Performance** — Operation types declared? p95 targets achievable? Core Web Vitals assessed? | **Pass** | Endpoints classified above. Two parallel fetches on mount; `@hello-pangea/dnd` adds ~30 kB gzipped (bundle reviewed — within budget). Optimistic UI update keeps INP < 200 ms. No layout shifts from the board render (columns are statically sized). |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-position-kanban-board/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── position-board-api.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code

```text
frontend/
├── src/
│   ├── components/
│   │   ├── PositionDetail.tsx          NEW — board page, route-level component
│   │   ├── PositionDetail.test.tsx     NEW — component test
│   │   ├── KanbanBoard.tsx             NEW — DragDropContext wrapper + column row
│   │   ├── KanbanBoard.test.tsx        NEW — component test
│   │   ├── KanbanColumn.tsx            NEW — Droppable column (phase)
│   │   ├── KanbanColumn.test.tsx       NEW — component test
│   │   ├── CandidateCard.tsx           NEW — Draggable candidate card
│   │   ├── CandidateCard.test.tsx      NEW — component test
│   │   └── Positions.tsx               MODIFIED — add position id to data, wire "Ver proceso"
│   ├── services/
│   │   └── positionService.ts          NEW — API calls for board feature
│   └── App.js                          MODIFIED — add /positions/:id route
└── package.json                        MODIFIED — add @hello-pangea/dnd

backend/                                NO CHANGES
```

---

## Complexity Tracking

No constitution violations requiring justification. The `@hello-pangea/dnd` dependency is
necessary because the spec mandates drag-and-drop as the sole phase-change mechanism and
there is no Bootstrap-native drag-and-drop primitive.
