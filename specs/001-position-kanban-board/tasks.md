# Tasks: Position Kanban Board

**Input**: Design documents from `specs/001-position-kanban-board/`

**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/position-board-api.md](./contracts/position-board-api.md)

**Tests**: Per constitution v1.0.0, test tasks are **MANDATORY**. Component tests required for every new React component. Tests MUST be written first (TDD — confirm FAIL before implementing). No backend changes → no backend test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each increment.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the new dependency and establish a working test runner. No user story work can begin until `npm test` succeeds.

- [X] T001 Install `@hello-pangea/dnd` dependency in `frontend/` — run `npm install @hello-pangea/dnd` (includes built-in TypeScript types; no `@types/` package needed)
- [X] T002 Fix test runner: update `"test"` script in `frontend/package.json` from `jest --config jest.config.js` to `react-scripts test --watchAll=false --passWithNoTests` so CRA's built-in Jest + Babel handles all transforms without extra config files
- [X] T003 [P] Create `frontend/src/setupTests.ts` — import `@testing-library/jest-dom` so its custom matchers (`.toBeInTheDocument()`, etc.) are available in every test
- [X] T004 [P] Create `frontend/__mocks__/fileMock.js` — export `module.exports = 'test-file-stub'` to prevent Jest errors on CSS/SVG imports

**Checkpoint**: Run `npm test` in `frontend/` — must exit 0 with "no tests found" (or similar) before proceeding.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, route registration, and the Positions link wiring. Must be complete before any user story can start.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Create TypeScript type-definition block at the top of `frontend/src/services/positionService.ts` — export interfaces `InterviewStepRaw`, `InterviewFlowRaw`, `InterviewFlowResponse`, `CandidateRow`, `BoardColumn`, `UpdateStageRequest` exactly as specified in `data-model.md` (file body is types only; function stubs left empty for Phase 3/4)
- [X] T006 [P] Create stub `frontend/src/components/PositionDetail.tsx` — named export of a React FC that renders `<div>Position Board</div>` — enough for the route to compile; then register `<Route path="/positions/:id" element={<PositionDetail />} />` in `frontend/src/App.js` following the existing React Router v6 `<Route>` pattern
- [X] T007 [P] Update `frontend/src/components/Positions.tsx` — add `id: number` to the `Position` type and to every mock object; replace the inert `<Button variant="primary">Ver proceso</Button>` with a React Router `<Link>` or `useNavigate`-driven button that navigates to `/positions/${position.id}`

**Checkpoint**: `npm start` compiles without errors; clicking "Ver proceso" on any Positions card navigates to `/positions/1` (shows the stub).

---

## Phase 3: User Story 1 — View Candidate Kanban Board (Priority: P1) 🎯 MVP

**Goal**: A recruiter navigates to `/positions/:id`, sees the position title, a back link, and a static Kanban board with one column per hiring phase and candidate cards showing name + score.

**Independent Test**: Render `<PositionDetail />` with mocked API responses; assert the heading shows the position name, the correct number of columns is rendered, and each candidate card shows full name and score.

### Tests for User Story 1 *(MANDATORY — TDD: write first, confirm FAIL, then implement)*

- [X] T008 [P] [US1] Create `frontend/src/services/positionService.test.ts` — mock `global.fetch`; write tests for `getInterviewFlow(positionId)` (asserts GET `/position/1/interviewflow` called; returns parsed `InterviewFlowResponse`) and `getCandidatesByPosition(positionId)` (asserts GET `/position/1/candidates` called; returns `CandidateRow[]`)
- [X] T009 [P] [US1] Create `frontend/src/components/CandidateCard.test.tsx` — write tests: (1) renders candidate full name; (2) renders numeric average score; (3) renders "—" when `averageScore` is `0`
- [X] T010 [P] [US1] Create `frontend/src/components/KanbanColumn.test.tsx` — write tests: (1) renders the step name as a column header; (2) renders a `CandidateCard` for each candidate in `candidates` prop; (3) renders "No hay candidatos en esta fase" when `candidates` is empty
- [X] T011 [P] [US1] Create `frontend/src/components/KanbanBoard.test.tsx` — write tests: (1) renders exactly N columns for N `columns` in props; (2) columns appear in ascending `orderIndex` order
- [X] T012 [P] [US1] Create `frontend/src/components/PositionDetail.test.tsx` — mock `positionService`; write tests: (1) renders a loading spinner while data is loading; (2) renders error banner when fetch fails; (3) renders position title as heading once loaded; (4) renders a back link to `/positions`; (5) renders the correct number of KanbanColumns; (6) passes candidates to the correct column

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement `getInterviewFlow` and `getCandidatesByPosition` in `frontend/src/services/positionService.ts` — use `fetch` (not axios); handle non-2xx responses by throwing; access path per `contracts/position-board-api.md` (`response.interviewFlow.positionName` and `response.interviewFlow.interviewFlow.interviewSteps`)
- [X] T014 [P] [US1] Implement `frontend/src/components/CandidateCard.tsx` — Bootstrap `<Card>` with `<Card.Body>`: full name in `<Card.Title>`, average score in `<Card.Text>` (display `"—"` when `averageScore === 0`); accept props `{ fullName: string; averageScore: number }`
- [X] T015 [US1] Implement `frontend/src/components/KanbanColumn.tsx` — Bootstrap `<div className="d-flex flex-column">` column; header `<h6>` with step name; list of `<CandidateCard>` keyed by `applicationId`; empty-state `<p>` when `candidates` is empty; accept props `{ stepName: string; candidates: CandidateRow[] }` (depends on T014)
- [X] T016 [US1] Implement `frontend/src/components/KanbanBoard.tsx` — Bootstrap `<div className="d-flex flex-row flex-nowrap overflow-auto gap-3">` container; render one `<KanbanColumn>` per entry in `columns` prop, sorted by `orderIndex`; accept props `{ columns: BoardColumn[]; onDragEnd?: ... }` (stub `onDragEnd` for now — wired in Phase 4) (depends on T015)
- [X] T017 [US1] Replace the stub in `frontend/src/components/PositionDetail.tsx` — use `useParams` to get `id`; fetch `getInterviewFlow` and `getCandidatesByPosition` in parallel with `Promise.all`; build `BoardColumn[]` by grouping `CandidateRow[]` by `currentInterviewStep` name; manage `loading` and `error` state; render position title as `<h2>`, back arrow `<Link to="/positions">← Posiciones</Link>`, and `<KanbanBoard columns={...} />`; show spinner on loading, error banner on failure (depends on T013, T016)

**Checkpoint**: Navigate to `/positions/1` (backend running with seed data). Board should render with correct columns and candidate cards, loading spinner visible, back link works, error banner appears when backend is stopped.

---

## Phase 4: User Story 2 — Move Candidate Between Phases via Drag-and-Drop (Priority: P2)

**Goal**: A recruiter can drag a candidate card from one column to another; the change persists to the backend immediately via optimistic update, and reverts on API error.

**Independent Test**: Render `<PositionDetail />` with mocked service; simulate `onDragEnd` event; assert card moves to target column, `updateCandidateStage` is called with correct IDs; simulate API error and assert card reverts.

### Tests for User Story 2 *(MANDATORY — TDD: write first, confirm FAIL, then implement)*

- [X] T018 [P] [US2] Add test to `frontend/src/services/positionService.test.ts` — write test for `updateCandidateStage(candidateId, applicationId, stepId)`: asserts PUT `/candidates/1` called with body `{ applicationId: 7, currentInterviewStep: 2 }`; asserts non-2xx throws
- [X] T019 [P] [US2] Add DragDropContext-render test to `frontend/src/components/KanbanBoard.test.tsx` — asserts board renders without error when wrapped in `DragDropContext` (smoke test that `@hello-pangea/dnd` integration does not throw)
- [X] T020 [P] [US2] Add drag-and-drop test cases to `frontend/src/components/PositionDetail.test.tsx`: (1) when `onDragEnd` is fired with source ≠ destination, the candidate moves to the destination column (optimistic update); (2) when `updateCandidateStage` rejects, the card reverts to its original column; (3) when source === destination, no API call is made

### Implementation for User Story 2

- [X] T021 [US2] Implement `updateCandidateStage(candidateId: number, applicationId: number, interviewStepId: number): Promise<void>` in `frontend/src/services/positionService.ts` — PUT `/candidates/:candidateId` with `{ applicationId, currentInterviewStep: interviewStepId }`; throw on non-2xx (depends on T018)
- [X] T022 [US2] Update `frontend/src/components/CandidateCard.tsx` — accept `draggableId: string` and `index: number` props; wrap the existing `<Card>` with `<Draggable draggableId={draggableId} index={index}>` from `@hello-pangea/dnd`; apply `provided.draggableProps`, `provided.dragHandleProps`, and `ref={provided.innerRef}` to the card element (depends on T019)
- [X] T023 [US2] Update `frontend/src/components/KanbanColumn.tsx` — accept `droppableId: string` prop; wrap the candidate list container with `<Droppable droppableId={droppableId}>` from `@hello-pangea/dnd`; apply `provided.droppableProps`, `ref={provided.innerRef}`, and render `provided.placeholder` inside the list (depends on T022)
- [X] T024 [US2] Update `frontend/src/components/KanbanBoard.tsx` — accept `onDragEnd: (result: DropResult) => void` prop; wrap the entire board with `<DragDropContext onDragEnd={onDragEnd}>`; pass `droppableId={column.stepName}` and `draggableId={String(candidate.applicationId)}` down to columns and cards (depends on T023)
- [X] T025 [US2] Implement `onDragEnd` handler in `frontend/src/components/PositionDetail.tsx`: (1) no-op if `destination` is null or same as source; (2) snapshot `previousBoardState`; (3) compute `newBoardState` by moving the `CandidateRow` from source column to destination column; (4) `setBoardState(newBoardState)` immediately (optimistic); (5) look up `destStepId` from `boardColumns` by destination `droppableId`; (6) call `updateCandidateStage(candidateId, applicationId, destStepId)`; (7) on catch: `setBoardState(previousBoardState)` + display error alert (depends on T020, T021, T024)

**Checkpoint**: In the running app, drag a candidate card to a different column — it moves immediately and the change persists on page refresh. Stop the backend, drag a card — it reverts with an error message.

---

## Phase 5: User Story 3 — Responsive Mobile View (Priority: P3)

**Goal**: On viewports ≤ 768 px wide, Kanban columns stack vertically and each occupies 100% of the screen width. No horizontal scrolling at the viewport level.

**Independent Test**: Render `<KanbanBoard>` inside a 375 px container; assert it has the CSS class that triggers the vertical stacking layout.

### Tests for User Story 3 *(MANDATORY — TDD: write first, confirm FAIL, then implement)*

- [X] T026 [P] [US3] Add responsive CSS-class test to `frontend/src/components/KanbanBoard.test.tsx` — assert the board wrapper element has the `kanban-board` class; assert each column wrapper has the `kanban-column` class (CSS hook for responsive override)

### Implementation for User Story 3

- [X] T027 [US3] Create `frontend/src/components/PositionDetail.css` — define `.kanban-board` (desktop: `display: flex; flex-direction: row; flex-wrap: nowrap; overflow-x: auto`) and a media query `@media (max-width: 768px) { .kanban-board { flex-direction: column; overflow-x: unset; } .kanban-column { width: 100% !important; } }` (only custom CSS allowed because Bootstrap utility classes cannot express the dynamic fixed-width + column-stack override)
- [X] T028 [US3] Import `./PositionDetail.css` in `frontend/src/components/PositionDetail.tsx`; apply `className="kanban-board"` to the `<KanbanBoard>` wrapper element; apply `className="kanban-column"` to each column wrapper in `KanbanBoard.tsx` (depends on T027)

**Checkpoint**: Open the board in browser DevTools at 375 px width — columns stack vertically, each full-width, no horizontal scroll. At 1024 px — columns display in a horizontal scrollable row.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, build verification, and cleanup.

- [X] T029 Run `npm test -- --watchAll=false` in `frontend/` and fix any remaining test failures before merging
- [X] T030 [P] Run `npm run build` in `frontend/` — verify build succeeds and inspect the bundle size output for unexpected regressions from `@hello-pangea/dnd` (~30 kB gzipped expected)
- [X] T031 [P] Execute all Validation Scenarios from `quickstart.md` against running backend (seeded) + frontend — mark each scenario ✅ or ❌ and resolve any ❌ items

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — first usable increment (MVP)
- **Phase 4 (US2)**: Depends on Phase 3 (modifies existing components) — adds DnD on top of the static board
- **Phase 5 (US3)**: Depends on Phase 3 (adds CSS to existing board) — can start in parallel with Phase 4 by a separate developer
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2. No dependency on US2 or US3.
- **US2 (P2)**: Depends on US1 (modifies components created in US1). Must follow US1.
- **US3 (P3)**: Depends on US1 (adds CSS to board). Can run in parallel with US2.

### Within Each Phase

- TDD order within a story: tests written and confirmed FAILING → implementation → tests pass
- Within implementation: types → service → leaf component → parent component → page component
- Parallel tasks marked [P] touch different files and can be assigned simultaneously

### Parallel Opportunities

| Who | Task |
|-----|------|
| Dev A | T005 (types), T008 (service test), T013 (service impl) |
| Dev B | T006 (route stub), T009 (CandidateCard test), T014 (CandidateCard impl) |
| Dev C | T007 (Positions update), T010 (KanbanColumn test), T015 (KanbanColumn impl) |

---

## Parallel Example: User Story 1

```bash
# Step 1 — Write all US1 tests in parallel (all fail):
T008  frontend/src/services/positionService.test.ts
T009  frontend/src/components/CandidateCard.test.tsx
T010  frontend/src/components/KanbanColumn.test.tsx
T011  frontend/src/components/KanbanBoard.test.tsx
T012  frontend/src/components/PositionDetail.test.tsx

# Step 2 — Implement leaf-level first (can parallelize T013 + T014):
T013  positionService.ts  (parallel with T014)
T014  CandidateCard.tsx   (parallel with T013)

# Step 3 — Middle layer (T015 depends on T014):
T015  KanbanColumn.tsx

# Step 4 — Board (T016 depends on T015):
T016  KanbanBoard.tsx

# Step 5 — Page (T017 depends on T013 + T016):
T017  PositionDetail.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T007) — CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T008–T017)
4. **STOP and VALIDATE**: Navigate to `/positions/1`, verify board renders with correct columns and candidate cards
5. Demo / ship if ready

### Incremental Delivery

1. **Foundation** (Phases 1–2) → test runner works, route registered, Positions button linked
2. **US1** (Phase 3) → static board visible → MVP
3. **US2** (Phase 4) → drag-and-drop persists changes → core interactive feature
4. **US3** (Phase 5) → mobile responsive → polish
5. **Polish** (Phase 6) → all tests pass, build verified

### Single Developer Sequence

T001 → T002 → T003 → T004 → T005 → T006 → T007 →
T008 → T009 → T010 → T011 → T012 →
T013 → T014 → T015 → T016 → T017 →
T018 → T019 → T020 → T021 → T022 → T023 → T024 → T025 →
T026 → T027 → T028 →
T029 → T030 → T031

---

## Notes

- [P] tasks touch different files — safe to run in parallel
- [Story] label maps every task to its user story for traceability
- Each user story is independently completable and testable
- **TDD is non-negotiable** (constitution v1.0.0): confirm tests FAIL before writing implementation
- Commit after each phase checkpoint
- `@hello-pangea/dnd` justification must appear in the PR description (constitution PG-004)
- No backend files are modified by this feature
