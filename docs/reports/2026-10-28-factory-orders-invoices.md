# Report: Factory orders and invoices (backend)

Date: 2026-10-28  
Linear: MOA-240, MOA-241, MOA-242 (MOA-253 tests, partly)

## What was done
Materials and catalog, factories with logins, orders that reserve stock in one transaction (split batches), order status flow with
cancel rules, delivery that sells the batches and issues an invoice, invoice payment and overdue display. 19 new endpoints.

## How it was checked
`npm run typecheck`, `npm run lint`, `npm test` (79 passed), `npm run test:e2e` (68 passed, real PostgreSQL), `npm run build`.
New e2e cases: split reservation, all-or-nothing across lines, two factories racing for the same stock, cancel rules, price snapshot,
invoice total / number / due date / overdue / double pay, cross-factory access returns 404.

## Decisions and differences from the plan
Invoice is issued on delivery (not on confirmation). Split batches stay split after a cancel. New column `invoices.paidAt`.
Overdue is computed on read. Order items keep the price at order time.

## Not done or not verified
Dashboard numbers, impact report, alerts, audit log; PDF invoices; order concurrency was tested with two parallel requests only, not a load test.

## Next
Admin dashboard endpoints and alerts, then the Flutter apps.
