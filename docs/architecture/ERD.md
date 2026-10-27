# Entity relationship diagram

Generated from `apps/backend/prisma/schema.prisma` (24 tables) by `scripts/gen-docs.py`. Chain of custody: Shipment -> WeighingRecord -> Batch -> OrderItem -> FactoryOrder. `points_ledger` is append-only.

```mermaid
erDiagram
  FACTORIES o|--o{ USERS : "factory"
  USERS ||--o{ REFRESH_TOKENS : "user"
  USERS ||--o{ DEVICE_TOKENS : "user"
  USERS ||--o{ CITIZEN_PROFILES : "user"
  LEVELS ||--o{ CITIZEN_PROFILES : "level"
  USERS ||--o{ BUSINESS_PROFILES : "user"
  USERS ||--o{ BAG_SCANS : "user"
  BAG_SCANS ||--o{ PICKUP_REQUESTS : "scan"
  PICKUP_REQUESTS ||--o{ SHIPMENTS : "request"
  USERS ||--o{ DRIVERS : "user"
  DRIVERS ||--o{ ROUTES : "driver"
  VEHICLES ||--o{ ROUTES : "vehicle"
  ROUTES ||--o{ ROUTE_STOPS : "route"
  SHIPMENTS ||--o{ ROUTE_STOPS : "shipment"
  USERS ||--o{ EMPLOYEES : "user"
  WAREHOUSES ||--o{ EMPLOYEES : "warehouse"
  WAREHOUSES ||--o{ BATCHES : "warehouse"
  MATERIAL_TYPES ||--o{ BATCHES : "materialType"
  SHIPMENTS ||--o{ WEIGHING_RECORDS : "shipment"
  EMPLOYEES ||--o{ WEIGHING_RECORDS : "employee"
  MATERIAL_TYPES o|--o{ WEIGHING_RECORDS : "materialType"
  BATCHES o|--o{ WEIGHING_RECORDS : "batch"
  USERS ||--o{ POINTS_LEDGER : "user"
  WEIGHING_RECORDS o|--o{ POINTS_LEDGER : "weighing"
  FACTORIES ||--o{ FACTORY_ORDERS : "factory"
  FACTORY_ORDERS ||--o{ ORDER_ITEMS : "order"
  MATERIAL_TYPES ||--o{ ORDER_ITEMS : "materialType"
  BATCHES o|--o{ ORDER_ITEMS : "batch"
  FACTORY_ORDERS ||--o{ INVOICES : "order"
  USERS ||--o{ NOTIFICATIONS : "user"
  USERS {
    Int id PK
    String name
    String phone
    String email
    String passwordHash
    enum role
    Int factoryId
    Boolean isActive
    DateTime createdAt
  }
  REFRESH_TOKENS {
    Int id PK
    Int userId
    String tokenHash
    DateTime expiresAt
    DateTime revokedAt
    DateTime createdAt
  }
  DEVICE_TOKENS {
    Int id PK
    Int userId
    String token
    String platform
    DateTime createdAt
    DateTime updatedAt
  }
  LEVELS {
    Int id PK
    String name
    Int minPoints
    Decimal multiplier
  }
  CITIZEN_PROFILES {
    Int userId PK
    Int levelId
    Int totalPoints
    String address
    Float lat
    Float lng
  }
  BUSINESS_PROFILES {
    Int userId PK
    String businessName
    String businessType
    String agreementRef
    Float lat
    Float lng
  }
  BAG_SCANS {
    Int id PK
    Int userId
    String imageUrl
    Float fillLevel
    String contentType
    Float contamination
    Float confidence
    enum source
    Float lat
    Float lng
    DateTime scannedAt
  }
  PICKUP_REQUESTS {
    Int id PK
    Int scanId
    enum decision
    enum status
    enum channel
    Int createdById
    DateTime requestedAt
  }
  SHIPMENTS {
    Int id PK
    Int requestId
    String qrCode
    Float gpsLat
    Float gpsLng
    enum sourceType
    String handoverCode
    enum status
    DateTime createdAt
    DateTime updatedAt
  }
  VEHICLES {
    Int id PK
    String plate
    String type
    Decimal capacityKg
    Boolean isActive
  }
  DRIVERS {
    Int userId PK
    String licenseNo
    enum status
  }
  ROUTES {
    Int id PK
    Int driverId
    Int vehicleId
    DateTime routeDate
    enum status
  }
  ROUTE_STOPS {
    Int id PK
    Int routeId
    Int shipmentId
    Int stopOrder
    DateTime collectedAt
  }
  WAREHOUSES {
    Int id PK
    String name
    String address
    Decimal capacityKg
  }
  EMPLOYEES {
    Int userId PK
    Int warehouseId
    String position
  }
  MATERIAL_TYPES {
    Int id PK
    String name
    Decimal pointFactor
    Decimal pricePerKg
    Decimal co2KgPerKg
    Boolean isActive
  }
  BATCHES {
    Int id PK
    Int warehouseId
    Int materialTypeId
    Decimal weightKg
    String grade
    enum status
    DateTime createdAt
  }
  WEIGHING_RECORDS {
    Int id PK
    Int shipmentId
    Int employeeId
    Int materialTypeId
    Int batchId
    Decimal actualWeightKg
    String grade
    Boolean accepted
    String rejectReason
    DateTime weighedAt
  }
  POINTS_LEDGER {
    Int id PK
    Int userId
    Int weighingId
    Int points
    enum reason
    DateTime createdAt
  }
  FACTORIES {
    Int id PK
    String name
    String contact
    String address
  }
  FACTORY_ORDERS {
    Int id PK
    Int factoryId
    enum status
    DateTime orderedAt
    DateTime deliveredAt
  }
  ORDER_ITEMS {
    Int id PK
    Int orderId
    Int materialTypeId
    Int batchId
    Decimal quantityKg
    Decimal unitPrice
  }
  INVOICES {
    Int id PK
    Int orderId
    String number
    Decimal total
    enum status
    DateTime issuedAt
    DateTime dueAt
    DateTime paidAt
  }
  NOTIFICATIONS {
    Int id PK
    Int userId
    String title
    String body
    Boolean isRead
    DateTime sentAt
  }
```
