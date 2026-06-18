# API Contract: Position Kanban Board

**Feature**: `001-position-kanban-board`
**Date**: 2026-06-18
**Base URL**: `http://localhost:3010`

> All three endpoints used by this feature already exist in the backend.
> This document captures the exact request/response contracts the frontend relies on,
> serving as the integration contract between frontend and backend.

---

## 1. Get Interview Flow for a Position

Fetches the ordered list of hiring phases (columns) and the position title.

### Request

```
GET /position/:id/interviewflow
```

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | path | integer | yes | Position ID |

### Response — 200 OK

```json
{
  "interviewFlow": {
    "positionName": "Senior Backend Engineer",
    "interviewFlow": {
      "id": 1,
      "description": "Standard Engineering Flow",
      "interviewSteps": [
        {
          "id": 1,
          "interviewFlowId": 1,
          "interviewTypeId": 1,
          "name": "Phone Screen",
          "orderIndex": 1
        },
        {
          "id": 2,
          "interviewFlowId": 1,
          "interviewTypeId": 2,
          "name": "Technical Interview",
          "orderIndex": 2
        },
        {
          "id": 3,
          "interviewFlowId": 1,
          "interviewTypeId": 3,
          "name": "Manager Interview",
          "orderIndex": 3
        }
      ]
    }
  }
}
```

**Frontend access path**:
- Position title: `response.interviewFlow.positionName`
- Steps (sorted by `orderIndex`): `response.interviewFlow.interviewFlow.interviewSteps`

### Response — 404 Not Found

```json
{ "message": "Position not found", "error": "..." }
```

---

## 2. Get Candidates for a Position

Fetches all candidates currently in any phase of the position's hiring pipeline,
including their current step name and average interview score.

### Request

```
GET /position/:id/candidates
```

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | path | integer | yes | Position ID |

### Response — 200 OK

```json
[
  {
    "id": 42,
    "applicationId": 7,
    "fullName": "Alice Martínez",
    "currentInterviewStep": "Phone Screen",
    "averageScore": 8.5
  },
  {
    "id": 43,
    "applicationId": 8,
    "fullName": "Bob García",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 0
  }
]
```

**Frontend notes**:
- `currentInterviewStep` is the step **name** (string) — used to assign candidate to
  the matching column.
- `averageScore` of `0` means no interview scores recorded yet — display as `—`.
- `id` is the **candidate** ID (used as path param in the update call).
- `applicationId` is sent in the update request body.

### Response — 404 Not Found

```json
{ "message": "Position not found", "error": "..." }
```

---

## 3. Update Candidate Interview Step

Moves a candidate to a new hiring phase. Called after a successful drag-and-drop.

### Request

```
PUT /candidates/:id
```

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | path | integer | yes | Candidate ID |

```json
{
  "applicationId": 7,
  "currentInterviewStep": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `applicationId` | integer | yes | Application ID (from candidates response) |
| `currentInterviewStep` | integer | yes | **Step ID** (from interviewflow response) — NOT the step name |

### Response — 200 OK

```json
{
  "message": "Candidate stage updated successfully",
  "data": {
    "id": 7,
    "positionId": 1,
    "candidateId": 42,
    "applicationDate": "2026-01-15T00:00:00.000Z",
    "currentInterviewStep": 2,
    "notes": null,
    "interviews": []
  }
}
```

### Response — 400 Bad Request

```json
{ "message": "Invalid input data", "error": "..." }
```

### Response — 404 Not Found

```json
{ "message": "Candidate or application not found", "error": "..." }
```

---

## Frontend Service Interface

The `positionService.ts` file exposes these three functions:

```typescript
// Fetches interviewflow — returns the nested object shape from the API
getInterviewFlow(positionId: number): Promise<InterviewFlowResponse>

// Fetches candidates array
getCandidatesByPosition(positionId: number): Promise<CandidateRow[]>

// Updates a candidate's interview step — takes step ID (integer)
updateCandidateStage(
  candidateId: number,
  applicationId: number,
  interviewStepId: number
): Promise<void>
```

See `data-model.md` for the full TypeScript interface definitions.

---

## Error Handling Contract

| Scenario | Frontend behaviour |
|----------|--------------------|
| `GET /interviewflow` fails (4xx/5xx) | Show error banner; back arrow still functional |
| `GET /candidates` fails (4xx/5xx) | Show error banner; back arrow still functional |
| `PUT /candidates/:id` fails | Revert card to original column; show error toast/alert |
| Network offline during PUT | Same as above (fetch rejects with TypeError) |
| Position ID is not a number | Redirect to Positions list with error message |
