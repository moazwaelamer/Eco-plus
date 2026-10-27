# Database dictionary

24 tables, generated from `apps/backend/prisma/schema.prisma` by `scripts/gen-docs.py`. Constraints Prisma cannot express (CHECKs, the `points_ledger` trigger) are in `apps/backend/prisma/migrations/*_constraints`.


## users

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `name` | String |  |
| `phone` | String? | unique, optional |
| `email` | String? | unique, optional |
| `passwordHash` | String |  |
| `role` | Role |  |
| `factoryId` | Int? | optional |
| `isActive` | Boolean | @default(true) |
| `createdAt` | DateTime | @default(now()) |

## refresh_tokens

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `userId` | Int |  |
| `tokenHash` | String | unique |
| `expiresAt` | DateTime |  |
| `revokedAt` | DateTime? | optional |
| `createdAt` | DateTime | @default(now()) |

## device_tokens

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `userId` | Int |  |
| `token` | String | unique |
| `platform` | String |  |
| `createdAt` | DateTime | @default(now()) |
| `updatedAt` | DateTime |  |

## levels

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `name` | String | unique |
| `minPoints` | Int |  |
| `multiplier` | Decimal |  |

## citizen_profiles

| Column | Type | Notes |
| --- | --- | --- |
| `userId` | Int | primary key |
| `levelId` | Int |  |
| `totalPoints` | Int | @default(0) |
| `address` | String? | optional |
| `lat` | Float? | optional |
| `lng` | Float? | optional |

## business_profiles

| Column | Type | Notes |
| --- | --- | --- |
| `userId` | Int | primary key |
| `businessName` | String |  |
| `businessType` | String |  |
| `agreementRef` | String? | optional |
| `lat` | Float? | optional |
| `lng` | Float? | optional |

## bag_scans

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `userId` | Int |  |
| `imageUrl` | String? | optional |
| `fillLevel` | Float? | optional |
| `contentType` | String |  |
| `contamination` | Float? | optional |
| `confidence` | Float? | optional |
| `source` | ScanSource | @default(manual) |
| `lat` | Float? | optional |
| `lng` | Float? | optional |
| `scannedAt` | DateTime | @default(now()) |

## pickup_requests

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `scanId` | Int | unique |
| `decision` | PickupDecision |  |
| `status` | RequestStatus | @default(open) |
| `channel` | RequestChannel | @default(app) |
| `createdById` | Int? | optional |
| `requestedAt` | DateTime | @default(now()) |

## shipments

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `requestId` | Int | unique |
| `qrCode` | String | unique |
| `gpsLat` | Float |  |
| `gpsLng` | Float |  |
| `sourceType` | SourceType |  |
| `handoverCode` | String? | optional |
| `status` | ShipmentStatus | @default(created) |
| `createdAt` | DateTime | @default(now()) |
| `updatedAt` | DateTime |  |

## vehicles

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `plate` | String | unique |
| `type` | String |  |
| `capacityKg` | Decimal |  |
| `isActive` | Boolean | @default(true) |

## drivers

| Column | Type | Notes |
| --- | --- | --- |
| `userId` | Int | primary key |
| `licenseNo` | String |  |
| `status` | DriverStatus | @default(available) |

## routes

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `driverId` | Int |  |
| `vehicleId` | Int |  |
| `routeDate` | DateTime |  |
| `status` | RouteStatus | @default(planned) |

## route_stops

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `routeId` | Int |  |
| `shipmentId` | Int | unique |
| `stopOrder` | Int |  |
| `collectedAt` | DateTime? | optional |

## warehouses

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `name` | String |  |
| `address` | String? | optional |
| `capacityKg` | Decimal |  |

## employees

| Column | Type | Notes |
| --- | --- | --- |
| `userId` | Int | primary key |
| `warehouseId` | Int |  |
| `position` | String |  |

## material_types

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `name` | String | unique |
| `pointFactor` | Decimal |  |
| `pricePerKg` | Decimal |  |
| `co2KgPerKg` | Decimal? | optional |
| `isActive` | Boolean | @default(true) |

## batches

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `warehouseId` | Int |  |
| `materialTypeId` | Int |  |
| `weightKg` | Decimal |  |
| `grade` | String |  |
| `status` | BatchStatus | @default(in_stock) |
| `createdAt` | DateTime | @default(now()) |

## weighing_records

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `shipmentId` | Int | unique |
| `employeeId` | Int |  |
| `materialTypeId` | Int? | optional |
| `batchId` | Int? | optional |
| `actualWeightKg` | Decimal |  |
| `grade` | String? | optional |
| `accepted` | Boolean |  |
| `rejectReason` | String? | optional |
| `weighedAt` | DateTime | @default(now()) |

## points_ledger

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `userId` | Int |  |
| `weighingId` | Int? | optional |
| `points` | Int |  |
| `reason` | LedgerReason |  |
| `createdAt` | DateTime | @default(now()) |

## factories

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `name` | String |  |
| `contact` | String? | optional |
| `address` | String? | optional |

## factory_orders

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `factoryId` | Int |  |
| `status` | OrderStatus | @default(placed) |
| `orderedAt` | DateTime | @default(now()) |
| `deliveredAt` | DateTime? | optional |

## order_items

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `orderId` | Int |  |
| `materialTypeId` | Int |  |
| `batchId` | Int? | optional |
| `quantityKg` | Decimal |  |
| `unitPrice` | Decimal |  |

## invoices

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `orderId` | Int | unique |
| `number` | String | unique |
| `total` | Decimal |  |
| `status` | InvoiceStatus | @default(issued) |
| `issuedAt` | DateTime | @default(now()) |
| `dueAt` | DateTime |  |
| `paidAt` | DateTime? | optional |

## notifications

| Column | Type | Notes |
| --- | --- | --- |
| `id` | Int | primary key, @default(autoincrement()) |
| `userId` | Int |  |
| `title` | String |  |
| `body` | String |  |
| `isRead` | Boolean | @default(false) |
| `sentAt` | DateTime | @default(now()) |
