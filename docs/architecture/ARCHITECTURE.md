# Architecture

```
Flutter app (citizen, business, driver, employee)      Flutter Web (admin, factory)
              \                                          /
               +----------- HTTPS, JWT ----------------+
                                |
                      NestJS REST API (apps/backend)
                                |
                 PostgreSQL 16 via Prisma 7  +  uploads on disk (S3 later)
                                |
          Google Routes API (optional)   FCM push (not built)
```

## Backend

- NestJS 12, TypeScript 6, Node 24, ESM. Prisma 7 with the `pg` adapter. Zod 4 validates every input.
- Global guards in order: rate limit, JWT login check (`@Public()` opts out; account must be active), role check (`@Roles`).
- One error shape: `{ code, message, details?, requestId }`. Cursor pagination: `limit`, `cursor`, `nextCursor`.
- Auth: access token 15 min; refresh tokens stored hashed, rotated, reuse detected.

## Rules that must not break

| Rule | How it is enforced |
| --- | --- |
| Points only after the employee weighs | Awarded inside the weighing transaction only |
| Points = weight x material factor x level multiplier, rounded half up, citizens only | `points.ts`, unit tested |
| Ledger is append-only | Database trigger blocks UPDATE and DELETE |
| Weighing is all-or-nothing and idempotent | One transaction, row lock on the shipment, unique weighing per shipment |
| Shipment status machine | `shipment-status.ts`: created -> assigned -> collected -> weighed or rejected; cancelled; assigned -> created |
| One shipment cannot be on two routes | Conditional update inside the route transaction |
| Driver never sees the handover code | Driver endpoints return a reduced view |
| Decision rule | ready at fill 0.6 (household) / 0.4 (business); merge at 0.3+ with an open shipment within 150 m; else wait |

## Request flow (happy path)

1. `POST /uploads/image` -> `POST /scans` -> `POST /pickup-requests` (decision, shipment + QR).
2. Admin `POST /routes` -> shipments assigned, codes generated, customers notified.
3. Driver `POST /driver/routes/:id/start`, then `POST /driver/stops/:shipmentId/collect {handoverCode}`.
4. Employee `GET /shipments/by-qr/:code`, `POST /shipments/:id/weigh` -> weighing, points, batch, stock, notification.

## Not built yet

Real FCM sending, S3 storage and image compression, audit table, password reset, orders and invoices, AI, monitoring.
