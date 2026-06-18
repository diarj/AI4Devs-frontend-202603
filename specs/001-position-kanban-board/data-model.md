# Data Model: Position Kanban Board

**Feature**: `001-position-kanban-board`
**Date**: 2026-06-18

> This document describes the **frontend data model** — the TypeScript interfaces and
> state shapes the frontend uses to drive the board. No backend schema changes are needed.

---

## Source: Backend API → Frontend Types

The frontend derives its working model from two existing backend endpoints. The types
below are defined in `src/services/positionService.ts` (or a colocated `types.ts`).

---

### Raw API Types (matching backend response exactly)

```typescript
// GET /position/:id/interviewflow
export interface InterviewStepRaw {
  id: number;              // step ID — used in PUT /candidates/:id body
  interviewFlowId: number;
  interviewTypeId: number;
  name: string;            // display label for the column header
  orderIndex: number;      // determines column order (ascending)
}

export interface InterviewFlowRaw {
  id: number;
  description: string;
  interviewSteps: InterviewStepRaw[];
}

export interface InterviewFlowResponse {
  interviewFlow: {
    positionName: string;   // used as the page heading
    interviewFlow: InterviewFlowRaw;
  };
}

// GET /position/:id/candidates
export interface CandidateRow {
  id: number;              // candidate ID — path param for PUT /candidates/:id
  applicationId: number;   // sent in PUT request body
  fullName: string;        // displayed on the card
  currentInterviewStep: string;  // step NAME — used to assign candidate to a column
  averageScore: number;    // displayed on the card; 0 means no scores recorded
}

// PUT /candidates/:id — request body
export interface UpdateStageRequest {
  applicationId: number;
  currentInterviewStep: number;  // step ID (integer) — NOT the step name
}
```

---

### Frontend Board State

The `PositionDetail` component holds two pieces of state:

```typescript
// Derived from InterviewStepRaw[], sorted by orderIndex ascending
export interface BoardColumn {
  stepId: number;    // InterviewStep.id — needed to build PUT request
  stepName: string;  // InterviewStep.name — column header + candidate lookup key
  orderIndex: number;
  candidates: CandidateRow[];
}

// Main board state in PositionDetail
// key = stepName (matches CandidateRow.currentInterviewStep)
type BoardState = BoardColumn[];
```

---

### State Transitions

```
Initial load
  ↓ fetch interviewflow + candidates in parallel
  ↓ sort steps by orderIndex
  ↓ group candidates by currentInterviewStep name
  → boardState: BoardColumn[] (one entry per step)

Drag start
  → snapshot previousBoardState (for revert)

Drag end (different column)
  → optimistically move CandidateRow from source column to destination column
  → setState(newBoardState)
  → call PUT /candidates/:candidateId  { applicationId, currentInterviewStep: destStepId }
    ├── success → no further action (UI already updated)
    └── error   → setState(previousBoardState) + show error notification

Drag end (same column / cancelled)
  → no state change, no API call
```

---

### Entity Relationships (frontend view)

```
PositionDetail (page)
  │ positionId (from URL param)
  │ positionName (from interviewflow response)
  │
  └─ BoardColumn[] (one per InterviewStep, sorted by orderIndex)
       │ stepId, stepName, orderIndex
       │
       └─ CandidateRow[] (candidates currently in this step)
            candidateId, applicationId, fullName, averageScore
```

---

### Validation Rules

| Field | Rule |
|-------|------|
| `positionId` | Must be a positive integer (parsed from URL param). If `NaN` or ≤ 0, show error state. |
| `averageScore` | Display as `—` when value is `0` and no interview records exist (cannot distinguish 0-score from no-score at the frontend; show `—` when `averageScore === 0` as a safe default). |
| `currentInterviewStep` (candidate) | Must match exactly one `stepName` in `boardColumns`. Unmatched candidates are placed in an "Unknown" guard state (logged as a warning; not shown on the board). |
| Drag target | Must be a valid `stepName` present in `boardColumns`. Drop outside a valid column is a no-op. |

---

### No Backend Schema Changes

The Prisma schema and all backend domain models are unchanged. The board feature is
entirely frontend-side.
