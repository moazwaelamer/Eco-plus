# Report: Backend Phases 0 to 2

Date: 2026-10-27  
Linear: MOA-201 to 207, 212 to 221, 227 to 232, 234, 237

## What was done
NestJS backend with auth and roles, bag scans, pickup requests with decision rules v1 and v2, shipments with QR codes and a status
machine, the weighing transaction, points ledger, warehouse stock, notifications, fleet, route planning with stop ordering,
driver handover codes and device tokens. 24 tables, 47 endpoints.

## How it was checked
`npm run typecheck`, `npm run lint`, `npm test` (66 passed), `npm run test:e2e` (59 passed, real PostgreSQL), `npm run build`.
A curl smoke test of the built server passed after Phase 1. Checks were repeated after moving the project into this folder.

## Decisions and differences from the plan
Added `refresh_tokens`, `device_tokens`, `cancelled` status, `assigned -> created`. Merge rule keeps each bag as its own stop. Details:
[../architecture/SCHEMA.md](../architecture/SCHEMA.md) and the build status section of the project document.

## Not done or not verified
Docker build, CI run, real FCM, Google Routes on the real service, anything in Flutter. See [../STATUS.md](../STATUS.md).

## Next
Push to GitHub, Flutter skeletons, backend Phase 3.
