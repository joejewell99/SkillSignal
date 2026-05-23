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

## Default Admin

On first backend startup, an admin user is created:

- Email: `admin@skillsignal.dev`
- Password: `Admin123!`

Change these with environment variables:

- `SKILLSIGNAL_ADMIN_EMAIL`
- `SKILLSIGNAL_ADMIN_PASSWORD`

## Starter Auth Flow

- `POST /api/auth/register`
- `POST /api/auth/login`
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
