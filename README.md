# EcoPlus

Recycling collection platform: households and businesses scan a bag, a driver collects it, the warehouse weighs it,
the customer earns points, and factories order the sorted material.

Graduation project that is meant to become a real business. The full study (use cases, ERD, feasibility, competitors,
phases) is in [docs/product/ecoplus_project.html](docs/product/ecoplus_project.html).

## Repository layout

```
apps/
  backend/     NestJS + Prisma + PostgreSQL REST API (Phases 0 to 2 built)
  frontend/    Flutter mobile app: citizen / business, driver, employee (not started)
  dashboard/   Flutter Web: admin and factory portal (not started)
docs/          Product study, decisions, workflow
infra/         Docker, Coolify and hosting configs (empty for now)
packages/      Shared contracts, for example the OpenAPI client (empty for now)
.github/       CI workflows
.vscode/       Shared editor settings, tasks and recommended extensions
```

## Status

| Part | State |
| --- | --- |
| Backend, Phases 0 to 2 | Built, 125 automated tests pass locally. See [apps/backend/README.md](apps/backend/README.md) |
| Frontend (Flutter app) | Not started |
| Dashboard (Flutter Web) | Not started |
| Docker, CI, staging on Coolify | Written or planned, never run |

## Getting started (backend)

```bash
cd apps/backend
cp .env.example .env     # then edit DATABASE_URL and JWT_ACCESS_SECRET
npm install
npx prisma migrate dev
npm run db:seed
npm run start:dev
```

Full steps, test accounts and API flow are in [apps/backend/README.md](apps/backend/README.md).

## Working on it

See [docs/WORKFLOW.md](docs/WORKFLOW.md). Short version: one branch per task, pull request into `main`, CI must pass.
Tasks live in Linear (project EcoPlus, issues MOA-196 and up).
