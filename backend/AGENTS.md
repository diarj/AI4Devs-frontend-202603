# AGENTS.md — Backend LTI

## Project Overview

LTI (Lean Talent Intelligence) is a **recruitment management system** built with **TypeScript + Express + Prisma + PostgreSQL**. It exposes a REST API consumed by the companion React frontend (port 3000). The system manages the full hiring pipeline: candidates, their education and work experience, job positions, interview flows, and interview records.

**Server:** `http://localhost:3010`  
**Database:** PostgreSQL (via Prisma ORM)  
**Architecture:** Layered — Routes → Controllers → Services → Domain Models → Prisma

---

## Dev Environment

### Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally (default port 5432)
- Database credentials configured in `.env`

### Environment Setup

Copy `.env` and fill in credentials:

```
DB_PASSWORD=<your_password>
DB_USER=LTIdbUser
DB_NAME=LTIdb
DB_PORT=5432
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"
```

> **Gotcha:** `prisma/schema.prisma` currently has a hardcoded `url` instead of `env("DATABASE_URL")`. Before running migrations on a new environment, change it to:
> ```prisma
> datasource db {
>   provider = "postgresql"
>   url      = env("DATABASE_URL")
> }
> ```

### Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma client (required after schema changes)
npm run prisma:generate

# Run database migrations
npx prisma migrate deploy

# Seed the database (two positions, three candidates, flows, etc.)
npx ts-node prisma/seed.ts

# Start dev server with hot reload
npm run dev

# Build and start production
npm run start:prod
```

---

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `ts-node-dev --respawn --transpile-only src/index.ts` | Dev server with hot reload |
| `npm run build` | `tsc` | Compile TypeScript → `dist/` |
| `npm start` | `node dist/index.js` | Run compiled build |
| `npm run start:prod` | `npm run build && npm start` | Build then run |
| `npm test` | `jest` | Run all unit tests |
| `npm run prisma:generate` | `npx prisma generate` | Regenerate Prisma client after schema changes |

---

## Project Architecture

The project follows a **layered architecture** inspired by DDD (Domain-Driven Design):

```
src/routes/              → HTTP verb/path registration
src/presentation/        → Controllers: parse request, call service, return response
src/application/         → Services: business orchestration + input validation
src/domain/models/       → Domain entities: business logic, Prisma access
prisma/schema.prisma     → Database schema
```

### Layer Responsibilities

- **Routes** (`src/routes/`): Wire Express paths to controller functions.
- **Controllers** (`src/presentation/controllers/`): Handle HTTP concerns only — extract params/body, invoke services, return status codes.
- **Services** (`src/application/services/`): Orchestrate business operations. Contain the application use-case logic.
- **Validator** (`src/application/validator.ts`): Validate and sanitize candidate input before persistence.
- **Domain Models** (`src/domain/models/`): TypeScript classes representing business entities. Each model contains its Prisma-based persistence methods (`save()`, `findOne()`, static queries).

### Domain Entities (DDD)

The data model revolves around a `Candidate` aggregate:

- **`Candidate`** — Root aggregate. Contains `Education[]`, `WorkExperience[]`, `Resume[]`, `Application[]`.
- **`Education`** — Academic history (institution, title, dates).
- **`WorkExperience`** — Professional history (company, position, dates).
- **`Resume`** — Uploaded CV file reference (filePath, fileType).
- **`Application`** — Links a Candidate to a Position, tracks `currentInterviewStep`.
- **`Company`** — Organization entity. Has `Employee[]` and `Position[]`.
- **`Employee`** — Company employee who conducts interviews.
- **`Position`** — Job opening. Belongs to a Company and an InterviewFlow.
- **`InterviewFlow`** — Ordered sequence of interview steps for a position.
- **`InterviewStep`** — One step in a flow (e.g., "Technical Screen"). References an `InterviewType`.
- **`InterviewType`** — Category of interview (e.g., "Video call", "On-site").
- **`Interview`** — Record of a specific interview: date, result, score, notes.

Full ERD: see `ModeloDatos.md`.

---

## API Endpoints

Base URL: `http://localhost:3010`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check — returns `"Hola LTI!"` |
| `POST` | `/candidates` | Create a candidate (with education, work experience, CV) |
| `GET` | `/candidates/:id` | Get candidate by ID with all relations |
| `PUT` | `/candidates/:id` | Update candidate's current interview step for an application |
| `POST` | `/upload` | Upload a PDF/DOCX file (max 10 MB); returns `{ filePath, fileType }` |
| `GET` | `/position/:id/candidates` | List candidates for a position with average interview scores |
| `GET` | `/position/:id/interviewflow` | Get the interview flow steps for a position |

OpenAPI spec: `api-spec.yaml`. Note: Swagger UI packages are installed but **not mounted** — wire them up in `src/index.ts` if needed.

---

## Testing

### Run Tests

```bash
npm test
```

### Test Structure

Tests are **colocated** next to source files:

```
src/application/services/candidateService.test.ts
src/application/services/positionService.test.ts
src/presentation/controllers/candidateController.test.ts
src/presentation/controllers/positionController.test.ts
```

### Approach

- Framework: **Jest** + **ts-jest**
- Prisma and service dependencies are mocked with `jest.mock()`.
- No integration or end-to-end tests exist; all tests are unit-level.
- When adding a new service or controller, create a colocated `.test.ts` file.
- Tests must pass before merging: `npm test`.

### Test Pattern

```typescript
// Mock Prisma at the top of the test file
jest.mock('../../domain/models/Candidate');

describe('addCandidate', () => {
  it('should create a candidate and return 201', async () => {
    // arrange → act → assert
  });
});
```

---

## Code Conventions

### Architecture Principles (from ManifestoBuenasPracticas.md)

**DDD — every change must respect domain boundaries:**

- **Entities** have a unique `id`. Modify them only through their aggregate root.
- **Value Objects** (e.g., `Education`, `WorkExperience` in some contexts) should have no independent identity within their aggregate.
- **Repositories** (`CandidateRepository`, etc.) must encapsulate all database access for an entity — do not scatter Prisma calls across services.
- **Domain Services** encapsulate business logic that does not belong to a single entity.
- All business operations on `Education` or `WorkExperience` must go through the `Candidate` aggregate root.

**SOLID principles:**

- **S** — Each class has one reason to change. Controllers handle HTTP; services handle business logic; models handle persistence.
- **O** — Extend via composition or subclassing; do not modify existing classes to add features.
- **L** — Subclasses must be substitutable for their base classes without breaking behaviour.
- **I** — Prefer narrow, focused interfaces (`ICandidateService`) over large catch-all ones.
- **D** — Depend on abstractions. Inject `PrismaClient` rather than instantiating it inside domain classes.

**DRY:** Extract shared database operation patterns into reusable helpers. Do not repeat validation logic across service methods.

### TypeScript

- Strict mode is enabled (`tsconfig.json`). All types must be explicit — avoid `any`.
- Use interfaces to define service contracts before implementing them.
- Prefer `async/await` over raw Promises.

### Formatting

- **Prettier** + **ESLint** are configured. Run `npx eslint src/` and `npx prettier --check src/` before committing.
- Single quotes, trailing commas (see `.prettierrc`).
- Imports: ES module `import/export` syntax throughout (except `positionRoutes.ts` which uses `require` — fix on next touch).

### Error Handling

- Controllers must wrap service calls in `try/catch` and return structured HTTP errors.
- Throw domain-level errors from services; map them to HTTP status codes in controllers.
- The global error handler in `index.ts` returns HTTP 500 — don't rely on it for expected error cases.

---

## Known Issues / Technical Debt

| Issue | Location | Impact |
|-------|----------|--------|
| Hardcoded DB URL in schema | `prisma/schema.prisma` | Security risk; blocks env-based configuration |
| Multiple `PrismaClient` instances | `index.ts`, domain models, `positionService.ts` | Connection pool exhaustion under load |
| Swagger not mounted | `src/index.ts` | API docs inaccessible at runtime |
| Mixed `require`/`import` | `positionRoutes.ts` vs rest | Inconsistent module style |
| Hardcoded CORS origin | `src/index.ts` | Must change for non-localhost deployment |
| Hardcoded server port | `src/index.ts` | Should read from `process.env.PORT` |
| No `prisma.seed` in `package.json` | `package.json` | Seed must be run manually |
| Request logger registered after routes | `src/index.ts` | May miss logging some requests |

---

## Adding a New Feature

Follow the guide in `src/prompts/CreateNewRoute.md`. The standard pattern is:

1. Add domain model in `src/domain/models/` with Prisma-backed methods.
2. Add service in `src/application/services/` with business logic.
3. Add controller in `src/presentation/controllers/` handling HTTP only.
4. Register route in `src/routes/`.
5. Document the endpoint in `api-spec.yaml`.
6. Write a colocated `.test.ts` for the service and the controller.

---

## Security Considerations

- Never commit `.env` to version control. The `.gitignore` should exclude it.
- Move hardcoded credentials from `schema.prisma` to `env("DATABASE_URL")` before any deployment.
- File uploads are stored at `../uploads/` relative to the backend root — validate file types (only PDF/DOCX) and enforce the 10 MB size limit that Multer enforces.
- The `email` field on `Candidate` has a unique constraint; duplicate-email errors must be caught and returned as HTTP 409.

---

## Data Model Quick Reference

See `ModeloDatos.md` for full descriptions and ERD.

```
Candidate ──< Education
Candidate ──< WorkExperience
Candidate ──< Resume
Candidate ──< Application >── Position >── Company
Application >── InterviewStep >── InterviewFlow
InterviewStep >── InterviewType
Application ──< Interview >── Employee
```
