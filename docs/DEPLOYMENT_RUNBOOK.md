# SkillSignal Deployment Runbook

## Required Configuration

Provide these through the hosting platform's secret manager, never in Git:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET` with at least 32 characters
- `PUBLIC_ORIGIN` set to the HTTPS frontend origin
- `OPENAI_API_KEY` if AI reranking is enabled

Use [`.env.production.example`](../.env.production.example) as the variable checklist. Keep the populated file outside the repository.

Keep `DEMO_DATA_ENABLED=false`, `JPA_DDL_AUTO=validate`, and `AUTH_COOKIE_SECURE=true` in production.

## Release

1. Build and start the stack with `docker-compose.production.yml`.
2. Wait for PostgreSQL health and Flyway startup to complete.
3. Check `GET /api/health` through the public frontend origin.
4. Run `scripts/api-journey-smoke.ps1` against the deployed API or staging origin.
5. Review logs for migration errors, authentication failures, and unexpected 5xx responses.

The frontend and API share one origin. Nginx serves the React build and proxies `/api`, which keeps the HttpOnly session cookie and CSRF flow consistent.

The production Nginx edge applies per-client limits of 10 API requests per second and 5 authentication requests per minute, with small bursts allowed. The AI endpoints also enforce daily authenticated and guest quotas in the API. If the deployment platform adds another proxy, preserve the real client address when forwarding requests.

## Backup And Rollback

Before a release that changes data:

```bash
pg_dump --format=custom --file=skillsignal-pre-release.dump "$DATABASE_URL"
```

Rollback the application by redeploying the previous image tag. Roll back a database change only with a reviewed Flyway migration; never edit production tables manually or switch Hibernate to `create`/`update`.

## Operational Gaps

The hosting provider still needs HTTPS, managed backups, uptime monitoring, error reporting, trusted-proxy configuration, and one restore rehearsal before this is presented as a live production service.
