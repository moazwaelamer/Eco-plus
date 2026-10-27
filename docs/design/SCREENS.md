# Screens per role

Each screen maps to existing backend endpoints (see [../architecture/API.md](../architecture/API.md)).

## Everyone
Login, register (citizen / business), profile (`/me`), notifications list.

## Citizen and business (mobile)
1. **Home**: points, level bar, next level, "Scan a bag".
2. **Scan**: camera / gallery, material type, fill level slider, location. -> `/uploads/image`, `/scans`.
3. **Result**: ready / merge / wait with a clear message and, when ready, the shipment QR. -> `/pickup-requests`.
4. **Shipments**: list with status chips; detail shows QR and the **handover code** once a driver is assigned.
5. **Points**: balance, history, leaderboard.
6. **Impact** (Phase 3): kg recycled, CO2 saved.

## Driver (mobile)
1. **Today**: route card (vehicle, number of stops), Start button.
2. **Stops**: ordered list with customer name, phone, "Open in Maps", status.
3. **Collect**: big numeric keypad for the 6 digit code; clear error on a wrong code.
4. **Done**: summary when the last stop is collected.

## Employee (mobile)
1. **Scan QR** -> shipment details (customer, material, fill level).
2. **Weigh**: weight input, material, grade, accept / reject with reason.
3. **Warehouse**: batches, stock per material, near-capacity warning.
4. **Phone request**: create a request for a customer who called or wrote on WhatsApp.

## Admin (web dashboard)
Dashboard numbers and map (Phase 3), shipments waiting for a driver, route planner (select shipments, driver, vehicle, date, reorder),
vehicles, drivers, users, levels and point factors (Phase 3).

## Factory (web portal, Phase 3)
Material catalog with live stock, cart and order, order tracking, invoices.
