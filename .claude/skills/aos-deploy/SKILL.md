---
name: aos-deploy
description: AZTEAC (AOS ch. 7, 9, 10) environments, Coolify configuration, CI/CD pipeline, rollback, and DNS/SSL standards. Use when setting up or changing environments, deployment, domains, health checks, or when a deployment fails.
---

# AOS servers, domains and deployment (Chapters 7, 9, 10)

## Infrastructure
Hostinger KVM2 VPS with **Coolify**. All production apps run as containers managed by Coolify; nothing is deployed straight to the host OS.

## Three sacred environments
- **Development:** local machines only, local PostgreSQL or Docker with seed data. Never connect to a staging or production database. A new developer must be running from the README within one hour.
- **Staging:** mirrors production (same VPS, separate Coolify project, same images, same schema); domain, test keys and data differ. Clients approve features here.
- **Production:** only code that passed staging. No direct pushes.
- Each environment has its own `.env` / Coolify variables (`DATABASE_URL`, API URLs, third-party keys, `JWT_SECRET`, CORS origins). The README lists every required variable.

## Pipeline
Feature branch, PR, review, merge to `main`, **auto-deploy to staging**, QA on staging (developer and reviewer), **manual promotion to production** by the Lead Developer or CEO. No shortcuts.

## Coolify standards
- Name services `client-service-environment`, e.g. `billys-backend-prod`, `billys-backend-staging`.
- Resources to start with: frontend 512 MB to 1 GB, backend 256 to 512 MB, PostgreSQL 512 MB to 1 GB; adjust from metrics.
- Every service has a health check (`/api/health` or `/health` returning 200, ideally checking the database). Production restart policy `always`; staging `on-failure`.
- Build-time vs runtime variables: a build-time variable configured as runtime-only fails silently (for example `NEXT_PUBLIC_*`).
- Node build/start commands must match what works locally; no localhost URLs.

## Rollback
Redeploy the previous successful deployment in Coolify (under two minutes). If a migration was part of it: **down migration first, then application rollback**. The Lead Developer and AI & Operations Lead may roll back production without CEO approval. Every failed deployment gets a blameless post-mortem (see `aos-incident`).

## Domains, DNS, SSL
- Auto-renewal on every domain, no exceptions. Registrar, account holder and credentials documented in the password manager.
- Root domains use A records to the VPS; subdomains use CNAME records.
- TTL: 300 s for new deployments and before any DNS change (lower it and wait the old TTL first); raise to 3600 s once stable.
- SSL through Coolify's Let's Encrypt integration; staging `robots.txt` disallows all crawlers.
