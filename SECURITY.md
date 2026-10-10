# SkillSignal security notes

This application stores passwords as BCrypt hashes. Passwords are never stored in plaintext, returned by an API response, or reversible by the application. A database operator can delete or replace a hash, but cannot recover the original password from it; database access must therefore be restricted as well.

User-owned records are accessed through authenticated service methods. Message, connection, saved-candidate, proof-signal, AI usage, and profile queries use the authenticated user id, and the API denies unknown routes by default. Public profile fields are intentionally public only when a user enables profile visibility.

Before production deployment:

- Set `JWT_SECRET`, `DB_USERNAME`, `DB_PASSWORD`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` through a secret manager. Never commit them or put them in frontend code.
- Keep `DEMO_DATA_ENABLED=false`; demo seeders use known sample passwords and are for local development only.
- Run PostgreSQL with a non-superuser application role that has only the required database privileges. Keep migrations separate from the runtime role and keep `JPA_DDL_AUTO=validate`.
- Enable encrypted storage and encrypted backups at the database/provider layer, require TLS for database connections, restrict network access to the API, and rotate credentials.
- Use short-lived JWTs, HTTPS everywhere, a strict frontend Content Security Policy, dependency and vulnerability scanning, and centralized access logs that never record passwords, authorization headers, message bodies, or database connection strings.
- The frontend sends authentication through an `HttpOnly`, `SameSite` session cookie and uses a separate readable CSRF cookie plus request header for state-changing requests. Enable `AUTH_COOKIE_SECURE=true` when serving over HTTPS.
- Registration/login and API write requests have an application-level per-IP request limit; the Nginx production edge has request limits, a 16 KiB auth body cap, a general 1 MiB body cap, proxy timeouts, and browser security headers. App memory buckets are per instance, so use the edge or a shared store for horizontally scaled enforcement. Never set `TRUST_FORWARDED_FOR=true` unless the API is reachable only through a trusted proxy that overwrites forwarding headers.
- Registration requires accepted terms, valid email, an 8-character minimum, and a maximum bcrypt-safe password length. Authentication/session cookies are inaccessible to JavaScript; API mutations require CSRF protection, and cookie `Secure` must remain enabled in production.
- Request DTO validation caps text/list/image sizes and validates externally navigable links as HTTP(S). React renders user text as text; avoid adding raw HTML rendering for user-controlled content.
- SQL access must continue using repository parameter binding/ORM; do not add string-concatenated SQL. Apply schema changes through reviewed Flyway migrations.
- Treat messages and profile content as sensitive application data. If a threat model requires protection from a database dump, add envelope encryption using a managed KMS key and plan a migration for existing plaintext rows; PostgreSQL/provider encryption at rest remains required.
- Revoke and replace any API key that has ever been exposed outside the secret manager.

## Abuse and Availability Boundaries

Application and Nginx rate limits reduce ordinary automated abuse, but do not stop a distributed botnet or volumetric denial-of-service attack by themselves. Put the public origin behind a managed WAF/CDN with DDoS protection and adaptive bot controls, rate-limit registration/login at that edge, and ensure origin access is restricted so attackers cannot bypass it. Use provider limits/alerts for connection count, CPU, memory, and storage; PostgreSQL backups and tested restoration are required. Avoid publishing PostgreSQL or backend ports directly to the internet.

## Legal and Privacy Readiness

Code configuration is not legal compliance certification. Before accepting real users, identify the countries where the service and users operate, document controller/processor roles, personal data and purposes, retention/deletion periods, lawful basis/consent where applicable, user rights handling, breach response, subprocessors (including AI providers), international transfers, and age requirements. Publish accurate privacy and terms notices, obtain appropriate legal review, and configure consent/retention workflows to match actual practice. The current registration records terms acceptance timestamp/version; that alone does not prove notice or privacy-law compliance.

Account registration embeds Cloudflare Turnstile and verifies each submitted token server-side with Siteverify before creating a user or profile. Development defaults use Cloudflare's published testing key pair and are not bot protection; production Compose requires the real site key, secret, and expected hostname. Keep the secret only in server-side secrets, scope the Turnstile widget to production hostnames, and review Cloudflare's privacy terms for your user notice.
