# SkillSignal

SkillSignal is a full-stack portfolio platform for proof-based hiring. Junior developers build profiles around projects, skills, and evidence; employers search by proven technical problems instead of generic resume keywords.

## Stack

- Backend: Spring Boot, Spring Security, JWT, Spring Data JPA
- Frontend: React, Vite, React Router
- Database: PostgreSQL

## Project Layout

```text
backend/   Spring Boot API
frontend/  React client
```

## Quick Start

### 1. Start PostgreSQL

Create a local environment file first:

```bash
copy .env.example .env
```

Set `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_USERNAME`, `DB_PASSWORD`, and a random `JWT_SECRET` of at least 32 characters in `.env`. Add `OPENAI_API_KEY` if you want to use the AI features. Keep `.env` local; it is ignored by Git.

Then start PostgreSQL:

```bash
docker compose up -d
```

### 2. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API runs on `http://localhost:8080`.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## Optional admin and demo data

No admin account is created unless both admin variables are supplied. Set these in `.env` before the first backend startup if you need an admin:

- `SKILLSIGNAL_ADMIN_EMAIL`
- `SKILLSIGNAL_ADMIN_PASSWORD`

Demo profiles and sample messages are disabled by default. For local demonstrations only, set `DEMO_DATA_ENABLED=true`; do not enable it for production data.

## Starter Auth Flow

- `POST /api/auth/register`
- `POST /api/auth/login`
- Authentication uses an HttpOnly session cookie; state-changing requests use the CSRF cookie issued by `GET /api/auth/csrf`.
- `GET /api/developer/profile` requires `DEVELOPER` or `ADMIN`
- `GET /api/employer/search` requires `EMPLOYER` or `ADMIN`
- `GET /api/admin/moderation` requires `ADMIN`

## MVP Direction

Build the product around this rule:

> Projects are the source of truth, not resumes.

Suggested next backend models:

- `DeveloperProfile`
- `Skill`
- `Project`
- `EvidenceLink`
- `ProblemTag`
- `ReadinessAssessment`
- `SavedCandidate`
- `ContactRequest`
