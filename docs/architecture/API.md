# API reference (summary)

Generated from the controllers by `scripts/gen-docs.py`. Full shapes: Swagger at `/docs` when `SWAGGER_ENABLED=true`.

| Method | Path | Who | What |
| --- | --- | --- | --- |
| POST | `/admin/pickup-requests` | admin, employee | Create a pickup request for a customer who called or wrote on WhatsApp |
| POST | `/auth/login` | public | Log in with phone or email and password |
| POST | `/auth/logout` | public | Revoke a refresh token |
| POST | `/auth/refresh` | public | Exchange a refresh token for a new token pair (the old refresh token stops working) |
| POST | `/auth/register` | public | Create a citizen or business account (staff accounts are created by an admin) |
| GET | `/catalog` | factory, admin | Material that can be ordered now: free stock per material and grade, with price |
| GET | `/driver/routes` | driver | My routes for a day (today by default) with ordered stops |
| POST | `/driver/routes/:id/start` | driver | Start my route (only on its own day, one at a time) |
| POST | `/driver/stops/:shipmentId/collect` | driver | Mark a stop as collected by typing the customer\'s 6 digit handover code |
| GET | `/drivers` | admin | List drivers (admin) |
| POST | `/drivers` | admin | Create a driver account (admin) |
| GET | `/drivers/:id` | admin | One driver (admin) |
| PATCH | `/drivers/:id` | admin | Change licence or status, or deactivate the account (admin) |
| GET | `/factories` | admin | List factories (admin) |
| POST | `/factories` | admin | Add a factory (admin) |
| GET | `/factories/:id` | admin | One factory with its logins (admin) |
| PATCH | `/factories/:id` | admin | Change factory details (admin) |
| POST | `/factories/:id/users` | admin | Create a login for a factory (admin) |
| GET | `/health` | any logged in | Liveness check that also verifies the database connection |
| GET | `/invoices` | factory, admin | Invoices of my factory (admin: all). Unpaid and past due shows as overdue |
| GET | `/invoices/:id` | factory, admin | One invoice |
| POST | `/invoices/:id/pay` | admin | Record a payment (admin) |
| GET | `/leaderboard` | citizen | Top 20 citizens by points (shown as first name and last initial) and my own rank |
| GET | `/materials` | admin, employee, factory | All material types with price and point factor |
| POST | `/materials` | admin | Add a material type (admin) |
| PATCH | `/materials/:id` | admin | Change price, point factor, name or active flag (admin). Existing orders keep their price |
| GET | `/me` | any logged in | The logged-in user with profile and level |
| POST | `/me/device-tokens` | any logged in | Register this phone for push notifications (moves the token if another user had it) |
| DELETE | `/me/device-tokens/:token` | any logged in | Stop push notifications on this phone (call on logout) |
| GET | `/me/points` | citizen | My balance, level, progress to the next level and points history |
| GET | `/notifications` | any logged in | My notifications, newest first, with the unread count |
| PATCH | `/notifications/:id/read` | any logged in | Mark one notification as read |
| POST | `/notifications/read-all` | any logged in | Mark all my notifications as read |
| GET | `/orders` | factory, admin | Orders of my factory (admin: all, optional factoryId) |
| POST | `/orders` | factory | Place an order; the stock is reserved at once or the order is refused (factory) |
| GET | `/orders/:id` | factory, admin | One order with items and invoice |
| POST | `/orders/:id/cancel` | factory, admin | Cancel and release the stock (factory: placed only; admin: until dispatched) |
| POST | `/orders/:id/confirm` | admin | Confirm an order (admin) |
| POST | `/orders/:id/deliver` | admin | Mark an order as delivered: batches become sold and the invoice is issued (admin) |
| POST | `/orders/:id/dispatch` | admin | Mark an order as dispatched (admin) |
| GET | `/pickup-requests` | citizen, business | My pickup requests with their shipments |
| POST | `/pickup-requests` | citizen, business | Request a pickup for one of my scans. 201 with a shipment when ready or merged, 200 with decision "wait" when not full enough. |
| GET | `/pickup-requests/:id` | any logged in | One pickup request (owner, admin or employee) |
| PATCH | `/pickup-requests/:id/cancel` | citizen, business, admin | Cancel a request before anything is collected |
| GET | `/routes` | admin | List routes, filter by date, driver or status (admin) |
| POST | `/routes` | admin | Create a route: assign shipments to a driver and vehicle, stops get ordered (admin) |
| DELETE | `/routes/:id` | admin | Cancel a planned route (admin) |
| GET | `/routes/:id` | admin | One route with its stops and handover codes (admin) |
| PUT | `/routes/:id/stop-order` | admin | Set the stop order by hand, planned routes only (admin) |
| DELETE | `/routes/:id/stops/:shipmentId` | admin | Take a shipment off a planned route (admin) |
| GET | `/scans` | citizen, business | My scans, newest first |
| POST | `/scans` | citizen, business | Record a bag (photo URL, material type, optional fill level and location) |
| GET | `/scans/:id` | any logged in | One scan (owner, admin or employee) |
| GET | `/shipments` | citizen, business, admin, employee | My shipments (staff see all), optional status filter |
| GET | `/shipments/:id` | citizen, business, admin, employee | One shipment (owner, admin or employee) |
| POST | `/shipments/:id/collect` | employee, admin | Mark a shipment as collected (staff, until the driver app exists) |
| POST | `/shipments/:id/weigh` | employee |  |
| GET | `/shipments/by-qr/:code` | employee, admin | Find a shipment from its QR code (employee scan) |
| GET | `/uploads/:name` | any logged in |  |
| POST | `/uploads/image` | citizen, business, admin, employee |  |
| GET | `/vehicles` | admin | List vehicles (admin) |
| POST | `/vehicles` | admin | Add a vehicle (admin) |
| PATCH | `/vehicles/:id` | admin | Change a vehicle, or retire it with isActive=false (admin) |
| GET | `/warehouse/batches` | employee, admin | Batches, filter by material, grade and status |
| PATCH | `/warehouse/batches/:id` | employee, admin | Change the grade or status of a batch (not when sold) |
| GET | `/warehouse/stock` | employee, admin | Stock per material and grade, with capacity use and a near-capacity flag (80%) |
