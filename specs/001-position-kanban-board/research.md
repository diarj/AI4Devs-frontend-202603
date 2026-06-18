# Research: Position Kanban Board

**Feature**: `001-position-kanban-board`
**Date**: 2026-06-18

---

## Research Questions

1. Which drag-and-drop library is the best fit for a React 18 kanban board, given the
   project constraints (Bootstrap 5, TypeScript strict mode, no unapproved new deps)?
2. What exact API response shapes do the existing backend endpoints return?
3. How does `PUT /candidates/:id` expect the step update — by step name or step ID?
4. What is the correct approach to optimistic UI updates for drag-and-drop in React?

---

## Decision 1: Drag-and-Drop Library

**Decision**: Use `@hello-pangea/dnd` (v1.x)

**Rationale**:
- Drop-in community-maintained fork of the battle-tested `react-beautiful-dnd`, with full
  React 18 support and first-class TypeScript typings.
- Provides `DragDropContext`, `Droppable`, and `Draggable` primitives that map cleanly
  onto the Kanban column/card structure required by this feature.
- Minimal API surface: implementing phase change requires only an `onDragEnd` handler.
- Bundle size: ~30 kB gzipped — within acceptable frontend budget.
- Accessible by default (keyboard navigation, screen reader announcements).

**Alternatives considered**:

| Library | Verdict | Reason rejected |
|---------|---------|----------------|
| `react-beautiful-dnd` | Rejected | Unmaintained; known issues with React 18 Strict Mode (`StrictMode` double-invocation breaks DnD state). |
| `@dnd-kit/core` | Valid alternative | More flexible and smaller (~6 kB core), but requires more manual setup for the sortable/column pattern. The additional configuration overhead does not provide enough benefit for this use case. |
| `react-dnd` | Rejected | Older API with more boilerplate; requires separate HTML5 backend. Less ergonomic for a simple Kanban board. |
| Native HTML5 drag-and-drop | Rejected | Lacks accessibility, no touch support, and requires significant custom event management to handle column-to-column moves cleanly. |

**PR justification note**: `@hello-pangea/dnd` must be listed as a new dependency in the
PR description with this rationale, per constitution PG-004.

---

## Decision 2: Backend API Response Shapes

**Decision**: Confirmed exact shapes from source code inspection (no ambiguity).

### `GET /position/:id/interviewflow`

```json
{
  "interviewFlow": {
    "positionName": "Senior Backend Engineer",
    "interviewFlow": {
      "id": 1,
      "description": "Standard hiring flow",
      "interviewSteps": [
        { "id": 1, "interviewFlowId": 1, "interviewTypeId": 1, "name": "Phone Screen", "orderIndex": 1 },
        { "id": 2, "interviewFlowId": 1, "interviewTypeId": 2, "name": "Technical Interview", "orderIndex": 2 },
        { "id": 3, "interviewFlowId": 1, "interviewTypeId": 3, "name": "Manager Interview", "orderIndex": 3 }
      ]
    }
  }
}
```

Note the double nesting: the controller wraps the service result in `{ interviewFlow: ... }`,
and the service itself returns an object with `positionName` and `interviewFlow` keys.
Frontend access path: `response.interviewFlow.positionName` and
`response.interviewFlow.interviewFlow.interviewSteps`.

### `GET /position/:id/candidates`

```json
[
  {
    "fullName": "John Doe",
    "currentInterviewStep": "Phone Screen",
    "averageScore": 8.5,
    "id": 42,
    "applicationId": 7
  }
]
```

The `currentInterviewStep` field is the step **name** (string), not the step ID.
The `id` field is the **candidate** ID (used for `PUT /candidates/:id`).
The `applicationId` is needed in the PUT request body.

### `PUT /candidates/:id`

```json
Request body:
{
  "applicationId": 7,
  "currentInterviewStep": 2
}
```

`currentInterviewStep` in the PUT body is the **interview step ID** (integer),
not the step name. This is a critical mapping requirement:
- Board state uses step names for column matching (from candidates response).
- On drag-and-drop, the frontend must look up the target step's **ID** (from the
  interviewflow response) to send the correct value to the PUT endpoint.

---

## Decision 3: Optimistic UI Update Strategy

**Decision**: Apply optimistic state update immediately on drop; revert on API error.

**Rationale**:
- Moves the card to the target column instantly (INP stays < 200 ms).
- If the PUT request fails, the board state is reverted to its pre-drag snapshot and
  an error message is displayed.
- Implementation: store a `boardState` map (`stepName → candidates[]`) in `useState`.
  On `onDragEnd`, compute the new state and `setState` before calling the API.
  Keep a `previousState` reference for the revert case.

**Alternatives considered**:

| Approach | Verdict | Reason |
|----------|---------|--------|
| Pessimistic update (wait for API) | Rejected | Violates INP < 200 ms requirement; card hangs mid-drag. |
| Re-fetch on success | Rejected | Causes layout shift (CLS impact) and extra network round-trip. |
| Optimistic + rollback on error | **Chosen** | Best UX, meets performance gates. |

---

## Decision 4: Board State Management

**Decision**: Local `useState` in `PositionDetail.tsx`; pass data down as props.

**Rationale**:
- Board data is scoped to a single page. No cross-component sharing is needed.
- Constitution requires local `useState` before introducing React Context.
- The board state is a simple map: `Record<string, CandidateRow[]>` keyed by step name.

---

## Decision 5: Responsive Layout Strategy

**Decision**: Use Bootstrap flexbox utilities with a CSS override for mobile stacking.

**Rationale**:
- Desktop: `d-flex flex-row flex-nowrap overflow-auto` on the board container, each
  column with `flex-shrink-0` and a fixed min-width, giving a horizontally scrollable
  row of columns.
- Mobile (≤ 768 px): A scoped CSS class (`kanban-board--mobile`) switches the container
  to `flex-column` and removes the fixed column width, making columns full-width.
- This uses a minimal scoped `PositionDetail.css` file (Bootstrap alone cannot express
  the dynamic fixed-width + horizontal-scroll behaviour for the column container).

---

## All NEEDS CLARIFICATION Resolved

No `[NEEDS CLARIFICATION]` markers were present in the spec. All unknowns above are now
resolved and decisions are documented.
