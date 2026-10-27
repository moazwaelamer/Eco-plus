---
name: aos-database
description: AZTEAC (AOS ch. 8) PostgreSQL standards: database naming, least-privilege users, migration files with up and down, merged migrations, daily backups and 7-4-3 retention. Use when writing migrations, changing schema, or setting up or reviewing databases and backups.
---

# AOS database standards (Chapter 8)

## Defaults and naming
- PostgreSQL is the default for every project; a different database needs a documented reason in the kickoff.
- Database name: `projectname_environment_db`, e.g. `billyhub_production_db`, `billyhub_staging_db`, `billyhub_test_db`.
- One database user per application with minimum permissions (read, write, execute functions, run migrations). The app **never connects as superuser**; superuser credentials stay in the password manager.

## Migrations (no exceptions)
- Every schema change is a migration file. Never alter a production table by hand in a SQL client.
- File name: `YYYYMMDD_HHMMSS_description.sql`, e.g. `20260315_143000_add_booking_status_column.sql`.
- Every file has an **up** section and a **down** section. The down migration is mandatory and must be tested against a copy of the production schema before deploying.
- Diverging migrations are merged into one new migration by the Lead Developer: list the differences, write one migration reaching the final state, test it on a fresh database, remove the conflicting files.
- Deploy order on rollback: run the down migration first, then roll back the application.
- A failed rollback in production escalates to P0.

## Backups
- Daily `pg_dump --format=custom`, compressed, from cron or an n8n workflow between 02:00 and 04:00. File name: `projectname_production_YYYYMMDD_HHMMSS.dump`.
- Stored **off the application server** (another VPS or object storage).
- Test restore into a temporary database **every month**; record date, file, time taken and issues in the Technical Wiki.
- Retention 7-4-3: seven daily, four weekly, three monthly.

## Checklist
Migration named with timestamp? Has up and down? Down tested? App user least-privilege? Backup job and restore test documented?

> EcoPlus today: Prisma migrations are timestamped and up-only (`apps/backend/prisma/migrations`); constraints and triggers are written in SQL inside them. Add a down note in the PR when a change is risky.
