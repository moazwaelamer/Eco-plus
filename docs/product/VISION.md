# Vision

EcoPlus collects sorted recyclables from households and businesses, weighs them at a warehouse, rewards the customer with
points for the confirmed weight, and sells clean material to recycling factories. Every bag is traceable from the customer's
door to the factory order.

## Who uses it

| Actor | Does |
| --- | --- |
| Citizen | Photographs a bag, requests pickup, shows a handover code to the driver, earns points |
| Business (cafe, supermarket) | Same as a citizen, lower fill threshold, impact report, later invoices and agreements |
| Driver | Follows an ordered list of stops, types the customer's code to confirm each pickup |
| Employee | Scans the shipment QR at the warehouse, weighs, accepts or rejects, manages batches |
| Admin | Plans routes, manages users, drivers, vehicles, prices and levels, watches the dashboard |
| Factory | Browses stock, orders material, tracks delivery, gets invoices |

## Customer journey

1. Scan the bag (photo, material type, how full) and ask for a pickup.
2. The system decides: `ready` (full enough), `merge` (not full, but a driver passes nearby), or `wait`.
3. A shipment with a QR code is created. An admin puts shipments on a route; the customer gets a 6 digit code.
4. The driver collects and types the code. The shipment is `collected`.
5. The employee weighs it. Points = weight x material factor x level multiplier. Stock grows.
6. A factory orders from stock.

## Principles

- The weighed value is the truth. Photos and estimates never create points.
- Points are a loyalty card in the MVP: earn, level up, leaderboard. No rewards or redemption until after the pilot.
- Everything money-like is append-only or transactional (points ledger, weighing, stock).
- Numbers in the feasibility study are placeholders until real quotes and pilot data replace them.
