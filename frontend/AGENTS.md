# AGENTS.md — Frontend LTI

## Project Overview

The LTI frontend is a **React 18 + TypeScript** recruiter dashboard built with **Create React App (CRA)**. It provides the UI for the LTI recruitment system: a dashboard, a candidate creation form, and a positions view. It communicates with the Express backend at `http://localhost:3010`.

**Dev server:** `http://localhost:3000`  
**Backend:** `http://localhost:3010` (see `../backend/AGENTS.md`)  
**Build tool:** Create React App (CRA) — `react-scripts` 5 / Webpack

---

## Dev Environment

### Prerequisites

- Node.js ≥ 18
- The **backend** must be running at `http://localhost:3010` for API calls to work.

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server (hot reload at http://localhost:3000)
npm start

# Production build (output to build/)
npm run build
```

---

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm start` | `react-scripts start` | Dev server with hot reload |
| `npm run build` | `react-scripts build` | Production build → `build/` |
| `npm test` | `jest --config jest.config.js` | Run unit tests |
| `npm run eject` | `react-scripts eject` | Eject CRA config (irreversible — avoid) |

> **Note:** `jest.config.js` does not currently exist and there are no test files. Running `npm test` will fail until both are created. Use `react-scripts test` as a temporary alternative or create a proper `jest.config.js`.

---

## Project Architecture

```
src/
├── index.tsx              # React root; renders <App />
├── App.js                 # BrowserRouter + route definitions
├── components/            # Route-level pages and shared UI
│   ├── RecruiterDashboard.js   # Landing page
│   ├── AddCandidateForm.js     # Candidate creation form
│   ├── Positions.tsx           # Positions list (mock data)
│   └── FileUploader.js         # CV upload sub-component
└── services/
    └── candidateService.js     # API service layer (currently unused)
```

**Key resolution note:** `index.tsx` imports `./App`. CRA resolves `.js` before `.tsx`, so `App.js` (with routing) is loaded — not `App.tsx` (CRA boilerplate, effectively dead code).

---

## Routing

Routes are defined in `src/App.js` using **React Router v6**:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `RecruiterDashboard` | Main dashboard with navigation links |
| `/add-candidate` | `AddCandidateForm` | Multi-section form to create a candidate |
| `/positions` | `Positions` | Grid of open positions (filter UI, mock data) |

There are no nested routes, route guards, or lazy loading. Add new routes to `src/App.js` following the existing `<Route>` pattern.

---

## Component Guide

### `RecruiterDashboard.js`
Landing page. Displays navigation cards/links. Imports `src/assets/lti-logo.png`.

### `AddCandidateForm.js`
Multi-section form with:
- Personal details (firstName, lastName, email, phone, address)
- Education entries (institution, title, startDate, endDate) — dynamic list
- Work experience entries (company, position, description, startDate, endDate) — dynamic list
- CV file upload via `FileUploader`

On submit, POSTs to `http://localhost:3010/candidates` with a JSON body. Expects HTTP 201 on success.

### `FileUploader.js`
Accepts a PDF or DOCX file, POSTs it to `http://localhost:3010/upload` as `multipart/form-data`. On success, calls the `onUpload(result)` callback with `{ filePath, fileType }` from the backend response.

### `Positions.tsx`
Grid view of positions. Currently uses **hardcoded mock data** — not connected to the backend. Filter controls exist in the UI but are not functional. When integrating the real API, consume `GET /position/:id/candidates` and `GET /position/:id/interviewflow` from the backend.

### `candidateService.js` (unused)
Contains `axios`-based wrappers for `POST /candidates` and `POST /upload`. It is never imported. Either:
- Adopt it and remove direct `fetch` calls from components, OR
- Delete it and keep `fetch` inline — but centralize the base URL.

---

## API Integration

All backend communication is hardcoded to `http://localhost:3010`. There is no `.env` configuration.

**To make the base URL configurable** (recommended), add a `.env` file:

```
REACT_APP_API_BASE_URL=http://localhost:3010
```

Then reference it in code:

```javascript
const API_BASE = process.env.REACT_APP_API_BASE_URL;
```

### Current API calls

| Component | Method | Endpoint | Purpose |
|-----------|--------|----------|---------|
| `AddCandidateForm.js` | `fetch` POST | `/candidates` | Create candidate |
| `FileUploader.js` | `fetch` POST | `/upload` | Upload CV file |
| `Positions.tsx` | — | — | Not connected; uses mock data |

### Request payload — `POST /candidates`

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "educations": [
    { "institution": "string", "title": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }
  ],
  "workExperiences": [
    { "company": "string", "position": "string", "description": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }
  ],
  "cv": { "filePath": "string", "fileType": "string" }
}
```

---

## Testing

### Current State

Testing is **not functional** — `jest.config.js` is missing and no test files exist.

### Recommended Setup

1. Create `jest.config.js` at the frontend root:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
```

2. Create `src/setupTests.ts`:

```typescript
import '@testing-library/jest-dom';
```

3. Write component tests using **React Testing Library**. Example:

```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecruiterDashboard from './components/RecruiterDashboard';

test('renders dashboard heading', () => {
  render(<MemoryRouter><RecruiterDashboard /></MemoryRouter>);
  expect(screen.getByRole('heading')).toBeInTheDocument();
});
```

4. Mock `fetch` for API-calling components:

```javascript
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({}) })
);
```

5. Run tests: `npm test`.

---

## Code Conventions

### Language

- The project is **mixed JS/TSX**. New components should be written in **TypeScript (`.tsx`)** to match `Positions.tsx` and `index.tsx`.
- `tsconfig.json` has `allowJs: true` and `strict: true`. All new TypeScript files must satisfy strict checks.
- Avoid `any`. Define explicit prop types for every component:

```typescript
interface PositionCardProps {
  title: string;
  status: 'Draft' | 'Open' | 'Closed';
}
```

### State Management

- Currently uses **local `useState` only**. This is fine for the current scope.
- If cross-component state becomes necessary, introduce React Context before reaching for a third-party library.

### Styling

- **Bootstrap 5** is the primary styling system (via `react-bootstrap` and `bootstrap/dist/css/bootstrap.min.css`).
- Use Bootstrap utility classes and `react-bootstrap` components. Avoid custom CSS unless Bootstrap cannot cover the case.
- Keep custom CSS in component-scoped files (e.g., `Component.css`) or in global `index.css` for base resets only.

### Component Design

- One component per file.
- Keep components focused on a single responsibility. Break large forms into sub-components (as `FileUploader` is broken out of `AddCandidateForm`).
- Do not put API calls directly inside JSX event handlers — extract them into named async functions within the component.

### Imports

- Use **named exports** for components.
- Group imports: React → third-party libraries → local components → styles.

---

## Known Issues / Technical Debt

| Issue | Location | Impact |
|-------|----------|--------|
| Dead `App.tsx` file | `src/App.tsx` | Confusion — CRA boilerplate never rendered |
| Hardcoded backend URL | All API calls | Breaks in non-local environments |
| Unused `candidateService.js` | `src/services/` | Dead code; `axios` declared as dependency but missing from `package.json` |
| `Positions.tsx` not connected to backend | `src/components/Positions.tsx` | Shows only mock data |
| No test setup | Project root | `npm test` fails |
| Missing PWA icons | `public/` | `manifest.json` references files that do not exist |
| `dotenv` in dependencies, unused | `package.json` | CRA handles env vars natively; remove the dependency |

---

## Adding a New Page / Feature

1. Create a new component file in `src/components/` (use `.tsx`).
2. Register a new `<Route>` in `src/App.js`.
3. Add navigation from `RecruiterDashboard.js`.
4. If the feature calls the backend, add the API function to `src/services/candidateService.js` (or create a new service file) rather than inlining `fetch` in the component.
5. Write a component test in the same directory as the component file.

---

## Backend Reference

The backend project lives in `../backend/`. See `../backend/AGENTS.md` for full API reference, data models, and backend architecture details.

**CORS:** The backend allows `http://localhost:3000` — this matches the default CRA dev server port. Do not change the frontend port without updating the backend CORS config.
