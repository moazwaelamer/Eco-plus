# Status (27 Oct 2026)

## Done and verified locally

- Backend Phases 0 to 2 and the factory side of Phase 3 in `apps/backend`: 24 tables, 66 endpoints, 147 automated tests (79 unit, 68 end to end against PostgreSQL),
  lint, typecheck and build clean.
- Full core flow works over HTTP: register, photo, scan, request, route, driver collect with code, weigh, points, stock.
- Linear tasks for finished backend work are Done (MOA-201 to 207, 212 to 221, 227, 228 to 232, 234, 237).
- Project study document, architecture, ERD and database dictionary (generated from the real schema), API reference, screens list.
- Repo is a monorepo in this folder with VS Code settings and a CI workflow.

## Not done

| Area | What is missing |
| --- | --- |
| GitHub | Code is committed locally; not pushed yet. Branch protection not set |
| CI | Backend and Flutter workflows. Every step was run locally on a clean `git archive` copy and passed (backend: typecheck, lint, 79 unit, 71 e2e, build; Flutter: analyze and tests for both apps). Never run on GitHub Actions |
| Docker | Dockerfile and compose written, never built (Docker not installed on this machine) |
| Hosting | No VPS, no Coolify, no staging (MOA-199, 200, 252) |
| Flutter app | Built: login, register, citizen, driver, employee weighing (QR lookup, mark collected, accept or reject). Missing: notifications list, QR camera scan for weighing, push, offline, iOS/Android runs |
| Dashboard | Built: admin overview, route planner, routes, orders, invoices, stock, charts (stock, orders, kg and shipments over 7/30/90 days, rejection rate), shipment map (OpenStreetMap); factory catalog and orders. fleet page (add drivers and vehicles), setup page (add factories and materials). Active switch on drivers, vehicles and materials. Missing: edit fields, factory users, users and levels, alerts |
| Design | No Figma, colours, fonts or brand yet (MOA-210, 211). Only the written brief and screen list |
| Push | Real FCM sending not built; tokens are stored (MOA-233) |
| Backend Phase 3 (rest) | Admin dashboard numbers, impact report, capacity and low-stock alerts, audit log, user / level management (catalog, factory accounts, orders, invoices are built) |
| Backend gaps | Password reset / verification, S3 storage and image compression, "customer not home", GPS-near check for the driver, Google Routes never tried against the real service |
| AI | Phase 4 entirely |
| Pilot | Phase 5 and the business track: quotes, permits, partnership agreement, anchor suppliers, role of Mr. Roshdy |
| Numbers | Feasibility figures are placeholders until real quotes exist |

## Suggested next steps

1. Push to GitHub, turn on branch protection, see the first CI run and fix it.
2. Install Flutter, create `apps/frontend` and `apps/dashboard` skeletons (MOA-208, 209).
3. Backend Phase 3 (orders, invoices, admin endpoints) so the dashboard has data.
4. In parallel the business track, because real prices decide whether the model works.
