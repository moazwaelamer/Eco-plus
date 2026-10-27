---
name: aos-code-style
description: AZTEAC (AOS ch. 11) naming conventions, project folder structures (Next.js, Node/Express, Flutter) and formatting rules (Prettier, ESLint). Use when creating files, naming things, structuring a module, or formatting code.
---

# AOS code style and structure (Chapter 11)

**Golden rule:** if another developer cannot understand the code within thirty seconds, rewrite it. Readability over cleverness, clarity over brevity. Comments explain **why**, not what. No names like `data`, `temp`, `x`.

## Naming
| Context | Convention | Example |
|---|---|---|
| JS/TS variables and functions | camelCase | `getUserBookings`, `isActive` |
| Components and component files | PascalCase | `BookingCard.tsx` |
| Utility files | kebab-case | `booking-utils.ts` |
| Python functions / classes / modules | snake_case / PascalCase / snake_case | `get_user_booking`, `ImageClassifier`, `model_utils.py` |
| Database tables | snake_case, plural | `user_bookings` |
| Database columns | snake_case, singular | `created_at`, `is_active` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| API endpoints | kebab-case, plural | `/api/v1/user-bookings` |

## Structures (never invent your own; discuss new folders with the Lead Developer)
**Next.js:** `src/app` (routes, layouts), `src/components/{ui,features,layout}`, `src/lib`, `src/types`, `src/styles`.

**Node/Express:** `src/routes` (endpoints by resource), `src/controllers` (HTTP only), `src/services` (business logic), `src/models` (schemas, query builders), `src/middleware`, `src/utils`. A controller never holds a DB query; a route file never holds business logic.

**Flutter:** `lib/core/{navigation,theme,utils}`, `lib/data/{models,services}`, `lib/logic/store` (Riverpod/Bloc/Provider), `lib/presentation/{pages,widgets}`, `main.dart`. (The mobile chapter's setup checklist also lists `lib/screens`, `widgets`, `routes`, `services`, `providers`, `utils`, `models`; keep to one layout per project and record it in the kickoff.)

## Formatting
- Prettier for all JS/TS: **2 spaces, single quotes, trailing commas, semicolons always, print width 100**. `.prettierrc` at the root.
- ESLint extending the framework's recommended rules (`.eslintrc`).
- Format on save is mandatory in the editor (Prettier as default formatter, 2-space tabs, auto save after delay).
- Dart: `dart format`.
- Node versions pinned with `.nvmrc`.
