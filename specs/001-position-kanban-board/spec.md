# Feature Specification: Position Kanban Board

**Feature Branch**: `001-position-kanban-board`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Se debe crear la interfaz 'Position', una página que permita visualizar y gestionar los diferentes candidatos de una posición específica. [...] tablero organizado en columnas donde cada columna representa una fase del proceso de contratación [...] arrastrar su tarjeta desde la columna actual hacia otra columna."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Candidate Kanban Board (Priority: P1)

A recruiter clicks "Ver proceso" on a position card in the Positions list and is taken to a dedicated page for that position. The page displays the position title, a back arrow to return to Positions, and a kanban board with one column per hiring-process phase. Each candidate appears as a card in the column matching their current phase, showing the candidate's full name and average interview score.

**Why this priority**: This is the core read path — without it the feature does not exist. All other stories depend on reaching and rendering this board.

**Independent Test**: Can be fully tested by navigating to a position's board page with mocked API data and verifying that the board renders the correct number of columns and the correct candidate cards under each column.

**Acceptance Scenarios**:

1. **Given** a recruiter is on the Positions page, **When** they click "Ver proceso" on a position card, **Then** the browser navigates to the position's board page.
2. **Given** the board page has loaded, **When** the page renders, **Then** the position title is displayed at the top of the page.
3. **Given** the board page has loaded, **When** the page renders, **Then** a back arrow/link is visible that returns the recruiter to the Positions list.
4. **Given** a position has N defined hiring phases, **When** the board loads, **Then** exactly N columns are displayed, each labelled with the corresponding phase name.
5. **Given** a position has candidates in various phases, **When** the board loads, **Then** each candidate appears as a card in the column that matches their current phase.
6. **Given** a candidate card is visible, **When** the recruiter looks at it, **Then** the card shows the candidate's full name and their average interview score.
7. **Given** the board is loading data from the backend, **When** the request is in flight, **Then** a loading indicator is shown to the user.
8. **Given** the backend returns an error, **When** the page attempts to load, **Then** a user-friendly error message is displayed and the recruiter can navigate back to Positions.

---

### User Story 2 - Move Candidate Between Phases via Drag-and-Drop (Priority: P2)

A recruiter drags a candidate's card from its current phase column and drops it onto a different phase column. The system updates the candidate's phase to the target column and persists the change to the backend.

**Why this priority**: Drag-and-drop is the sole mechanism for updating a candidate's phase from this interface; it is the primary interactive action on the board.

**Independent Test**: Can be fully tested by rendering the board with a candidate in phase A, dragging the card to phase B, and asserting the candidate now appears in phase B and a PUT request was issued with the correct interview step.

**Acceptance Scenarios**:

1. **Given** a candidate card is in column A, **When** the recruiter drags the card to column B and drops it, **Then** the card moves to column B immediately in the UI (optimistic update).
2. **Given** the card has been dropped in the target column, **When** the system persists the change, **Then** a PUT request is sent to the backend with the updated interview step identifier.
3. **Given** the backend confirms the update, **When** the response is received, **Then** the card remains in the target column and no error is shown.
4. **Given** the backend returns an error after a drop, **When** the error is received, **Then** the card is moved back to its original column and an error notification is shown to the recruiter.
5. **Given** a recruiter drops a card onto the same column it started in, **When** the drop completes, **Then** no backend call is made and no visible change occurs.

---

### User Story 3 - Responsive Mobile View (Priority: P3)

A recruiter accesses the position board on a mobile device. The columns that appear side-by-side on a desktop are stacked vertically, each occupying the full screen width, so the content remains readable without horizontal scrolling.

**Why this priority**: Responsive layout is a stated requirement and ensures usability across device types, but it does not block the core desktop functionality.

**Independent Test**: Can be fully tested by rendering the board in a viewport ≤ 768 px wide and asserting that each column is displayed in a single-column vertical layout occupying the full width.

**Acceptance Scenarios**:

1. **Given** a recruiter opens the board on a mobile-width viewport (≤ 768 px), **When** the page renders, **Then** all phase columns are stacked vertically, each occupying 100% of the screen width.
2. **Given** the recruiter is on a desktop-width viewport (> 768 px), **When** the page renders, **Then** all phase columns are displayed side by side in a horizontal row.
3. **Given** a recruiter is on mobile, **When** they scroll down, **Then** they can reach all phase columns without horizontal scrolling.

---

### Edge Cases

- What happens when a position has zero candidates? Each column renders as empty with a visual placeholder (e.g., "No hay candidatos en esta fase").
- What happens when the position has only one hiring phase? A single column is shown; drag-and-drop to the same column is a no-op.
- What happens when the position ID in the URL does not exist or the user lacks access? A clear error message is shown and the recruiter can navigate back to Positions.
- What happens when the network is unavailable during a drag-and-drop? The card reverts to its original column and an error message is displayed.
- What happens when a candidate has no interview scores yet? The average score is displayed as "N/A" or "—".

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the position board page when a recruiter navigates to `/positions/:id`.
- **FR-002**: System MUST show the position title as the page heading.
- **FR-003**: System MUST show a navigation control (back arrow or link) that returns the user to the Positions list (`/positions`).
- **FR-004**: System MUST render one column per hiring-process phase defined for the position, in the order the phases are defined in the interview flow.
- **FR-005**: System MUST display each candidate in the column corresponding to their current hiring phase.
- **FR-006**: Each candidate card MUST show the candidate's full name (first name + last name) and their average interview score.
- **FR-007**: A candidate with no interview scores MUST display a visual indication that no score is available (e.g., "—").
- **FR-008**: System MUST allow recruiters to move a candidate to a different phase exclusively by dragging the candidate card from one column and dropping it onto another.
- **FR-009**: Upon a successful drag-and-drop, the system MUST persist the phase change to the backend by updating the candidate's current interview step.
- **FR-010**: If the backend update fails, the system MUST revert the card to its original column and display an error notification.
- **FR-011**: The board MUST display a loading state while data is being fetched from the backend.
- **FR-012**: The board MUST display a user-friendly error state if data cannot be fetched.
- **FR-013**: On viewports ≤ 768 px wide, phase columns MUST be stacked vertically and each column MUST occupy the full width of the screen.
- **FR-014**: On viewports > 768 px wide, phase columns MUST be displayed in a horizontal row.
- **FR-015**: The "Ver proceso" button on each Positions card MUST navigate to the corresponding position's board page, passing the position ID.

### Key Entities *(include if feature involves data)*

- **Position**: A job opening with a title, a hiring manager, and an associated interview flow. Identified by a unique ID.
- **InterviewFlow**: An ordered sequence of phases (interview steps) associated with a position.
- **InterviewStep**: A single phase in an interview flow (e.g., "Phone Screen", "Technical Interview"). Has a name and an order index.
- **Candidate**: A person applying for a position. Has a full name (first + last) and is currently in exactly one interview step for a given application.
- **Application**: The link between a Candidate and a Position, tracking which InterviewStep the candidate is currently at.
- **Average Score**: A computed value derived from all interview records for a candidate's application, representing their overall performance.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A recruiter can navigate from the Positions list to a specific position's board in one click.
- **SC-002**: The board displays all phases and candidate cards correctly within 3 seconds of page load under normal network conditions.
- **SC-003**: A recruiter can complete a phase change (drag, drop, backend confirmation) in under 5 seconds under normal network conditions.
- **SC-004**: The board renders correctly on both desktop (≥ 769 px) and mobile (≤ 768 px) viewports without horizontal scrolling on mobile.
- **SC-005**: 100% of drag-and-drop operations either succeed and persist the change, or fail gracefully and revert the card with a visible error message — no silent data loss.
- **SC-006**: Every new React component introduced has a corresponding component test.

### Performance & Quality Gates *(from constitution v1.0.0)*

- **PG-001 Backend latency**: `GET /position/:id/candidates` is a complex aggregation endpoint (score averaging) — target < 2 s p95. `GET /position/:id/interviewflow` is a simple read — target < 200 ms p95. `PUT /candidates/:id` is a write operation — target < 500 ms p95.
- **PG-002 Frontend Core Web Vitals**: LCP < 2.5 s, INP < 200 ms, CLS < 0.10 in the production build.
- **PG-003 Test coverage**: Component tests MUST be present for every new React component introduced by this feature. Backend services already tested; any new backend logic must reach ≥ 80% line+branch coverage.
- **PG-004 No new unapproved dependencies**: Any new npm package (e.g., a drag-and-drop library) requires explicit justification in the PR description before use.

---

## Assumptions

- The position ID is available from the URL parameter when the board page is loaded (e.g., `/positions/:id`).
- The existing backend endpoints `GET /position/:id/candidates` and `GET /position/:id/interviewflow` provide all data needed to render the board without additional backend changes.
- The existing `PUT /candidates/:id` endpoint accepts the updated interview step and application ID to persist a phase change.
- The drag-and-drop interaction will require introducing a drag-and-drop library (e.g., `react-beautiful-dnd` or `@dnd-kit/core`); library choice is deferred to the planning phase and must be justified in the PR.
- Only authenticated recruiters can access the board; authentication is handled by the existing system and is outside this feature's scope.
- The board is read-only with respect to candidate data beyond phase changes — no inline editing of candidate profiles is in scope.
- The Positions component currently uses mock data and hardcoded position IDs; connecting it to the real backend API is a dependency of this feature but is treated as a prerequisite task, not a new requirement within this spec.
- The "Ver proceso" button in the existing `Positions.tsx` component will be updated to navigate to `/positions/:id` using React Router v6.
