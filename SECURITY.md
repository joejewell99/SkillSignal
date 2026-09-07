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
- Treat messages and profile content as sensitive application data. If a threat model requires protection from a database dump, add envelope encryption using a managed KMS key and plan a migration for existing plaintext rows; PostgreSQL/provider encryption at rest remains required.
- Revoke and replace any API key that has ever been exposed outside the secret manager.
