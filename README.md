# EcoPlus backend

REST API for the EcoPlus smart recycling platform: citizens and businesses scan bags and request pickups,
drivers collect, employees weigh (the ground truth), points are awarded, material goes to the warehouse,
factories order. Design documents: the EcoPlus project document (use cases, ERD, table dictionary).

Stack: Node.js 24, NestJS 12 (TypeScript, ESM), PostgreSQL 16, Prisma 7, Zod, JWT, Vitest.

## Run it locally

You need Node 24 (`nvm use`) and a PostgreSQL 16 database.

```bash
npm install
cp .env.example .env        # then set DATABASE_URL and a real JWT_ACCESS_SECRET
npx prisma migrate dev      # creates the tables and the database rules
npm run db:seed             # levels, materials, one warehouse and factory, one test user per role
npm run start:dev           # http://localhost:3000, Swagger UI at /docs
```

With Docker instead: `docker compose up --build` starts PostgreSQL and the API (not yet tested on a
machine without Docker; see the note in the project hand-over).

Check it works: `curl localhost:3000/health` returns `{"status":"ok","db":"up",...}`.

### Test accounts (seed only, never in production)

`citizen@`, `business@`, `driver@`, `employee@`, `admin@`, `factory@` followed by `ecoplus.test`.
The password is the constant `TEST_PASSWORD` at the top of `prisma/seed.ts`. The seed refuses to run when
`NODE_ENV=production`. Point factors, prices, multipliers and capacities in the seed are placeholders until
real quotes and buyer prices exist.

## What Phase 1 does

```
citizen/business                          employee
POST /uploads/image  -> url
POST /scans          -> scan (material, fill level, location)
POST /pickup-requests {scanId}
   fill level below the threshold  -> 200 decision "wait", nothing stored
   fill level enough               -> 201 request + shipment with QR code (ECO-XXXXXXXXXX)
                                          POST /shipments/:id/collect      (staff; the driver app replaces this in Phase 2)
                                          GET  /shipments/by-qr/:code
                                          POST /shipments/:id/weigh        (one transaction)
GET /me/points, /leaderboard, /notifications, /shipments
                                          GET /warehouse/stock, /warehouse/batches, PATCH /warehouse/batches/:id
admin/employee: POST /admin/pickup-requests  (customer called or wrote on WhatsApp)
```

Rules worth knowing:
- Decision rule v1 is in `src/requests/decision.ts`: household bags need a fill level of `READY_FILL_THRESHOLD`
  (default 0.6), businesses `BUSINESS_READY_FILL_THRESHOLD` (0.4). The "merge nearby requests" decision is Phase 2.
- Points = weight x material point factor x level multiplier, rounded half up, only for citizens
  (businesses are weighed and get stock records but no points). Points are written to the append-only ledger.
- Weighing is one transaction under a row lock: weighing record, ledger row, cached total and level, batch
  weight, shipment status and notification all succeed together or not at all. The same weighing sent twice
  returns the first result (200); different values for an already weighed shipment give 409.
- A new batch is only started when no open batch exists for the same warehouse, material and grade.
- Photos are stored on local disk (`UPLOAD_DIR`) under random names and served only to logged-in users.

## Tests

```bash
createdb ecoplus_test        # once
npm test                     # unit tests
npm run test:e2e             # end-to-end tests against the ecoplus_test database
```

The e2e setup applies migrations, empties the test database and seeds it, and refuses to run unless the
database name contains `ecoplus_test`. Connection details are in `.env.test`.

What the e2e tests prove today:
- health check and the common error shape (`{ code, message, details?, requestId }`);
- register, login, `/me`, refresh-token rotation with reuse detection, logout;
- role guard for every role, and that a disabled account loses access at once;
- the whole core flow, the decision rule, QR lookup, points and level-ups, the weighing transaction
  (failure at the last step saves nothing, a double or simultaneous submit gives one record), ownership
  and role checks, photo validation, staff-created requests, warehouse batches and stock;
- the database itself refuses: edits or deletes on `points_ledger`, zero or negative weights, two weighings
  for one shipment, duplicate QR codes, scan scores outside 0 to 1, negative stock.

## Structure

```
prisma/            schema, migrations (init + constraints), seed
src/config/        environment validation (fails fast at startup)
src/prisma/        database client module
src/common/        request id and logging, error filter, Zod validation pipe
src/auth/          register, login, refresh, logout, /me, guards and decorators
src/health/        GET /health
src/uploads/       bag photo upload and download
src/scans/         bag scans
src/requests/      pickup requests, decision rule, cancel
src/shipments/     shipments, QR codes, status machine, mark collected
src/weighing/      the weighing transaction (weight, points, batch, status, notification)
src/points/        points formula, ledger, level progression, leaderboard
src/warehouse/     batches and stock
src/notifications/ in-app notifications
src/admin/         staff create a request for a customer
test/              end-to-end tests
```

Every route needs a login unless marked `@Public()`. Restrict by role with `@Roles('admin', ...)`.

## How the database differs from the project document

The Prisma schema follows the dictionary (section 6b) with a few additions found while building:

| Change | Why |
| --- | --- |
| New table `refresh_tokens` | Refresh tokens are stored hashed so they can be revoked and rotated |
| `users.isActive` | Disable an account without deleting history |
| `bag_scans.source`, `lat`, `lng` | Know if the type came from the AI or by hand, and where the bag is |
| `pickup_requests.createdById` | Audit who created a request on behalf of a customer |
| `invoices.number`, `dueAt` | Invoice numbering and overdue calculation |
| `weighing_records.materialTypeId` optional | A rejected weighing may not have a known material |
| `shipments.status` has `cancelled` | A user can withdraw a request before collection |
| `points_ledger` trigger | Blocks UPDATE and DELETE, so history cannot be rewritten |

That makes 23 tables, not 22 as written in the document. Each change above also needs to be copied into the
project document (ERD and dictionary).

## Known limits

- Photos are not resized or compressed (needs a native image library); they live on the server's disk, not in
  object storage, so a second server would not see them. Move to S3-compatible storage before production.
- Warehouse changes are written to the application log; the proper audit table is a Phase 3 task.
- A customer created by staff has no usable password until password reset exists.
- Nothing yet moves a shipment to `assigned`: routes and the driver app are Phase 2.
- Rate limiting is per IP (stricter on `/auth`). There is no per-account lockout yet.
- Password reset, email and phone verification are not built.
- The Dockerfile and `docker-compose.yml` were written but not run (Docker is not installed on the
  development machine). CI is written but has not run yet because the repository is not on GitHub.
