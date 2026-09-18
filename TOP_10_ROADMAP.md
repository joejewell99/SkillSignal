# SkillSignal Top 10% Roadmap

## Goal

Turn SkillSignal into a polished, reliable internship portfolio project that can be opened by an employer, understood quickly, demonstrated without surprises, and discussed confidently in an interview.

## Baseline

- Feature completeness: 79%
- Employer showcase readiness: 84%
- Early-product launch readiness: 62%
- Current estimate: top 20% of internship portfolio projects
- Target estimate: top 10% of internship portfolio projects
- Backend tests: 21 passing
- Frontend production build: passing

## Definition Of Done

SkillSignal reaches the target when all of the following are true:

- The developer and employer journeys work from registration through contact.
- Public and authenticated screens work at 390px, 768px, 1024px, and 1440px without clipping or horizontal overflow.
- A new production database can be created and upgraded through committed migrations.
- Authentication restores from the server and handles expired sessions cleanly.
- The application has a stable HTTPS deployment with secure configuration and backups.
- CI runs the backend tests and frontend quality checks on every change.
- Browser tests protect the two primary user journeys.
- AI usage has trustworthy quotas, cost limits, timeouts, and failure handling.
- Loading, empty, error, retry, success, and destructive-action states are clear.
- The repository explains the product, architecture, security choices, setup, tests, and deployment.
- A five-minute employer demonstration can be completed reliably with prepared data.

## Work Order

### P0: Employer First Impression

- [x] Remove home-page mobile clipping and horizontal overflow.
- [x] Stop the desktop home section rail overlapping hero content.
- [x] Verify AI Match has no horizontal overflow or left-edge clipping.
- [x] Check Profiles, Login, Register, Dashboard, Settings, and profile detail responsively.
- [x] Verify keyboard focus, dialogs, menus, and readable contrast.

### P0: Core Journeys

- [x] Verify developer registration, profile editing, project proof, publishing, and messaging.
- [x] Verify employer registration, AI matching, profile review, saving, and messaging.
- [ ] Add useful loading, empty, failure, retry, and success states to both journeys.
- [x] Prepare reliable developer and employer demonstration accounts.

### P0: Production Foundations

- [x] Add Flyway and commit the initial database schema migration.
- [x] Add `GET /api/auth/me` and server-backed session restoration.
- [x] Clear frontend authentication consistently after a `401` response.
- [x] Remove the hard-coded unlimited AI account.
- [x] Harden proxy-aware rate limiting and add AI cost limits. Nginx applies per-client API/authentication limits at the same-origin edge, while AI quotas use a transactional row lock for existing usage records.
- [x] Add a health endpoint and production-safe configuration.

### P1: Verification

- [ ] Add backend integration tests for registration, permissions, ownership, messaging, quotas, and deletion. Quota behavior now has focused coverage, including the removed personal-email bypass.
- [ ] Add frontend linting and focused component tests.
- [ ] Add browser tests for the developer and employer journeys.
- [x] Add a repeatable API smoke script for the developer and employer journeys.
- [x] Add CI for backend tests and the frontend build.

### P1: Deployment And Operations

- [ ] Deploy the frontend, API, and PostgreSQL behind HTTPS.
- [x] Prepare a same-origin `/api` route and cookie-safe container configuration.
- [ ] Configure production secrets, secure cookies, CORS, and trusted proxies.
- [ ] Configure database backups and perform one restore rehearsal.
- [ ] Add error reporting, useful structured logs, uptime monitoring, and a rollback procedure.
- [x] Document release, health-check, backup, and rollback procedure.

### P1: Portfolio Presentation

- [x] Compress the hero asset and split heavy frontend routes where useful. The hero image is now a quality-controlled JPEG derivative and routes are lazy-loaded.
- [x] Add favicon, metadata, and a useful not-found page.
- [x] Replace outdated README sections with current architecture and workflows.
- [ ] Add deployment link; screenshots, architecture diagram, and test instructions are now documented.
- [ ] Prepare a five-minute demo and answers about key technical decisions.
- [x] Record known limitations and the next production steps honestly.

## Five-Day Sequence

1. Fix responsive UI and verify the two core journeys locally.
2. Add migrations, session restoration, rate limiting, and critical backend tests.
3. Deploy staging with HTTPS, health checks, CI, secrets, and backups.
4. Add browser tests, complete UI states, improve performance, and update documentation.
5. Run a clean-database launch rehearsal, fix final defects, and practise the employer demo.

## Completed Milestone

The public and authenticated interfaces have been visually and geometrically checked across mobile and desktop widths. Overflow and navigation issues were fixed, failed remote images now have intentional fallbacks, authentication is restored from the server, the API exposes a readiness check, CI verifies builds, a versioned Flyway schema is available for fresh databases, and production containers provide a same-origin frontend/API path. A clean isolated Compose rehearsal also started PostgreSQL, the API, and Nginx together and returned 200 responses for both `/api/health` and `/`.

## Next Task

The two core journeys have been exercised against the live migrated PostgreSQL database with fresh accounts: registration, profile publication, project proof, search, saving, messaging, acceptance, reply, and cleanup all passed. Production container configuration has passed a clean runtime rehearsal with public health and homepage checks. Next, deploy with provider credentials and complete the external HTTPS, backup, monitoring, and restore checks.

## Working Rule

Do not add a major feature unless it is required to complete one of the two primary journeys. Every change should improve reliability, clarity, evidence of engineering quality, or the employer demonstration.
