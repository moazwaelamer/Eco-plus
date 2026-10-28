# Code structure

```
apps/backend/
  prisma/            schema.prisma, migrations (init, constraints, cancelled, device_tokens), seed.ts
  src/
    main.ts, app.module.ts, app.setup.ts   start-up, global guards, helmet, CORS, Swagger
    config/          validated environment
    common/          error filter, request id, Zod pipe, pagination, geo, dates
    auth/            register, login, refresh, logout, /me, guards, decorators
    uploads/         bag photos (magic-byte check)
    scans/           bag scans
    requests/        pickup requests, decision rule (v1 + v2 merge)
    shipments/       QR, status machine, list / by-qr / manual collect
    weighing/        the weighing transaction
    points/          formula, ledger, leaderboard
    warehouse/       batches and stock
    notifications/   stored notifications
    fleet/           vehicles and drivers (admin)
    routes/          route planning, stop ordering, Google Routes, driver endpoints
    devices/         push tokens
    push/            push sender (none / log)
    admin/           requests created by staff for phone / WhatsApp customers
    health/          GET /health
  test/              end-to-end tests against a real PostgreSQL
apps/frontend/       Flutter mobile app: citizen, business, driver
apps/dashboard/      Flutter Web: admin, factory and employee portal
packages/eco_ui/     Brand tokens, theme, fonts, shared widgets (Flutter)
packages/eco_core/   API client, token storage, session (Flutter)
packages/brand/      tokens.json for non-Flutter use (website)
docs/                this folder
```

Each backend module follows `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.schemas.ts` (Zod), and `*.spec.ts` for pure logic.
