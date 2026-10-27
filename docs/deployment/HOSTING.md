# Hosting

Plan (nothing deployed yet):

- One VPS (Ubuntu) running **Coolify**: the API container, PostgreSQL 16 with daily backups, HTTPS certificates.
- Staging auto-deploys from `dev`; production from `main` after a green CI.
- Domain and DNS on Cloudflare. Flutter Web (dashboard) served as static files.
- Photos move from local disk to S3-compatible storage before production.
- Mobile apps: Play Store first (iOS only if needed).

## Environment

See `apps/backend/.env.example`. Production must set a long random `JWT_ACCESS_SECRET`, `SWAGGER_ENABLED=false`, the real
`CORS_ORIGINS`, and never run the seed (it refuses when `NODE_ENV=production`).

## Before going live

Docker build tested, backup restore drill, security review, load test, monitoring and alerts (Linear MOA-196 to 200, MOA-252, MOA-264 to 268).
