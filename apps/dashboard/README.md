# Dashboard (Flutter Web)

Admin and factory portal in the EcoPlus identity (shared `packages/eco_ui`, API client in `packages/eco_core`). Arabic first with
English, light and dark. Responsive: sidebar on wide screens, drawer on narrow.

## Built

| Role | Pages |
| --- | --- |
| Admin | Overview (waiting shipments, routes today, open orders, unpaid total, stock and capacity, recent orders), Shipments (filter, select, plan a route with driver, vehicle, date), Routes (stops, cancel a planned route), Orders (confirm, dispatch, deliver, cancel), Invoices (mark paid), Stock |
| Factory | Catalog with live stock and prices, place an order (stock is reserved at once), My orders (cancel while placed), Invoices |
| Employee | Stock |

Customers and drivers who log in here are told to use the mobile app.

## Not built yet

Create factories and materials from the UI (the API has them), users and levels, impact report, alerts, AI estimate chart,
employee weighing, invoice PDF, tables with sorting and search, tests against the API. Only the web build was run.

## Run

Start the API (`apps/backend`, `npm run start:dev`). The API must allow this origin (`CORS_ORIGINS` includes `http://localhost:8081`).

```bash
cd apps/dashboard
flutter run -d chrome --web-port 8081
flutter run -d chrome --web-port 8081 --dart-define=API_URL=http://localhost:3000
```

Checks: `flutter analyze` and `flutter test`.
