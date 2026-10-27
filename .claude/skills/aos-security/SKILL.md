---
name: aos-security
description: AZTEAC (AOS ch. 14) security standards for secrets, input validation, SQL, authentication, authorisation, CORS and infrastructure. Use when writing or reviewing endpoints, auth, config, migrations or deployment settings.
---

# AOS security standards (Chapter 14)

## Secrets
- Secrets only in environment variables. Locally `.env` files, ignored by Git; on staging and production in Coolify. Never in code, committed config or comments.
- `.gitignore` always lists `.env`, `.env.local`, `.env.development`, `.env.production`. A PR that removes them is rejected.
- Rotate API keys every 90 days and database passwords every 180 days; rotate everything a departing member could access immediately.
- Shared credentials live in the password manager. Never share them over WhatsApp or email.
- Any value that differs between environments is an environment variable (no hardcoded localhost URLs).

## Application security
- **Validate all input on the server** (type, range, format, sanitisation). The client's validation is only for UX.
- **Parameterise every query**: `db.query('SELECT * FROM users WHERE id = $1', [id])`, never string concatenation.
- **Authentication:** JWT; access tokens 15 minutes to 1 hour; refresh tokens rotated on every use (old one invalidated); store tokens in httpOnly cookies where possible, not localStorage.
- **Authorisation:** RBAC checked at the API on every endpoint. Hiding a button is not access control.
- **CORS:** explicit allowed origins in production, never `*`.
- Rate limit every production backend.

## Infrastructure
- SSH by key only, password login disabled; remove keys when someone leaves.
- Firewall: only ports 80, 443 and SSH.
- OS updates monthly; critical CVEs (CVSS 9.0 or higher) within 48 hours.
- fail2ban on every server.

## Review checklist
Secrets in diff? Input validated server-side? Queries parameterised? Role and tenant checked at the API? Tokens rotated? CORS explicit? Errors leak nothing? Then also run the project's `/security-review` for auth, tenancy, files or payments.
