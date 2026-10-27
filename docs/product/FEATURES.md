# Feature inventory

Status: Built = in the backend with tests. App = needs the Flutter app or dashboard (not started). Later = planned.

## Customer (citizen and business)

| Feature | Backend | App |
| --- | --- | --- |
| Register, login, refresh, logout | Built | Not started |
| Upload bag photo (JPEG/PNG, 5 MB) | Built | Not started |
| Record a scan (material, fill level, location) | Built | Not started |
| Request pickup, decision ready / merge / wait | Built | Not started |
| Cancel a request before collection | Built | Not started |
| Shipment list, status, QR value, handover code | Built | Not started |
| Points, level, progress, history | Built | Not started |
| Leaderboard (first name + initial) | Built | Not started |
| Notifications list, mark read | Built | Not started |
| Push notifications (FCM) | Token storage only | Later |
| AI scan of the bag | Later (Phase 4) | Later |
| Impact report (kg, CO2) | Later (Phase 3) | Later |
| Password reset, email/phone verification | Not built | Later |

## Driver

| Feature | Backend | App |
| --- | --- | --- |
| Today's route with ordered stops | Built | Not started |
| Start route (own day, one at a time) | Built | Not started |
| Collect with customer's 6 digit code | Built | Not started |
| "Customer not home" | Not built | Later |

## Employee

| Feature | Backend | App |
| --- | --- | --- |
| Find shipment by QR | Built | Not started |
| Weigh, accept or reject (one transaction, idempotent) | Built | Not started |
| Warehouse batches and stock, near-capacity flag | Built | Not started |
| Create a request for a phone / WhatsApp customer | Built | Not started |

## Admin

| Feature | Backend | Dashboard |
| --- | --- | --- |
| Vehicles and drivers | Built | Not started |
| Create / reorder / cancel routes, stop ordering (nearest-neighbour, Google Routes optional) | Built | Not started |
| Dashboard numbers, collection map | Later (Phase 3) | Later |
| Manage users, levels, point factors | Later (Phase 3) | Later |
| Capacity and low-stock alerts, audit log | Later (Phase 3) | Later |

## Factory

| Feature | Backend | Portal |
| --- | --- | --- |
| Material catalog, orders with stock reservation, invoices | Later (Phase 3) | Later |

## After the pilot

Rewards and redemption, cash payout, more materials (oil, electronics), drop-off points, demand forecast.
