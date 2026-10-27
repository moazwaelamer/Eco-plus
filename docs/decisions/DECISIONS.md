# Decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10 | Backend: NestJS, Prisma, PostgreSQL 16 | Typed, modular, strong DB guarantees for money-like data (points ledger, stock) |
| 2026-10 | Apps: Flutter (mobile) and Flutter Web (dashboard) | One language for all clients |
| 2026-10 | Hosting: VPS with Coolify | Cheap, self-managed, Docker based |
| 2026-10 | MVP has points but no rewards or redemption | Loyalty-card style first; decide rewards after the pilot |
| 2026-10 | Decision rule: ready at fill 0.6 (household) / 0.4 (business); merge nearby bags at 0.3+ within 150 m | Simple and configurable; tune with pilot data |
| 2026-10 | Monorepo with `apps/backend`, `apps/frontend`, `apps/dashboard` | One place for code, docs and CI |

Open: Mr. Roshdy's role, real prices and permits, partnership agreement, real FCM push sender.
