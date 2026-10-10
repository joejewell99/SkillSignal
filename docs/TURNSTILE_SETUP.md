# Signup bot verification

Developer and employer signup use Cloudflare's hosted dark widget with flexible width and always-visible appearance. The backend calls Siteverify before creating the account. Missing, rejected, expired or reused production tokens must not create accounts.

## Activate real screening

1. In your Cloudflare dashboard, create a Turnstile widget in **Managed** mode and allow your website hostname. An Invisible widget cannot display the reference design.
2. Configure `VITE_TURNSTILE_SITE_KEY` with its public site key, `TURNSTILE_SECRET_KEY` with its private secret, and `TURNSTILE_EXPECTED_HOSTNAME` with the exact hostname (no scheme/path). Keep the secret exclusively on the backend.
3. Rebuild the frontend and restart the backend. The frontend reads Vite variables from the repository-root and frontend environment files, with process environment taking precedence.
4. For production outside Docker, set `BUILD_ENV=production` when building. The production Dockerfile already does this; this rejects missing, placeholder and test site keys.

Local development defaults to Cloudflare's **visible** test key ending in `AA`. This renders the actual widget but does not screen bots. Cloudflare's test banner is intentional and should not be hidden. Production keys remove the banner. The key ending in `BB` is invisible regardless of appearance or CSS.

Turnstile addresses automated signup. Keep the application's rate limiting and deploy edge traffic protection separately for request floods.

References: https://developers.cloudflare.com/turnstile/troubleshooting/testing/ and https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/
