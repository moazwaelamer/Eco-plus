---
name: aos-mobile
description: AZTEAC (AOS ch. 16) mobile standards: Flutter default, state management, navigation, project setup checklist, environments, CI/CD, push notifications, versioning, store review and beta testing. Use when building, structuring, releasing or reviewing the mobile app.
---

# AOS mobile development (Chapter 16)

## Stack
- **Flutter** is the default (go native only if decided and justified at kickoff, never mid-project).
- State: `setState`/InheritedWidget/ValueNotifier for simple apps; **Riverpod or BLoC** for shared, offline-first or authenticated state. Choice recorded in the kickoff. Keep state as close to where it is used as possible.
- Navigation: **GoRouter** (or Navigator 2.0), the whole structure mapped before the first navigation code. Bottom navigation for primary sections, stack for drill-down, sheets and modals for overlays. No custom patterns without a documented reason.

## Project setup checklist
1. Standard Flutter folder structure (see `aos-code-style`); Flutter `.gitignore`; README with SDK, Xcode and Android Studio setup.
2. Three environments (development, staging, production), each with its own API base URL, feature flags and keys; switched by config or environment variable, never by editing code.
3. CI/CD: lint and tests on every PR, debug builds for internal testing, signed release builds when a release is tagged; signing keys in the CI secret store, never in the repository.
4. Push notifications (FCM for Android, APNs for iOS) configured at project start, with end-to-end delivery tested on staging.

## Store release
- Semantic versions tied to sprints: `1.3.0 (build 47)` = major release 1, sprint 3, build 47 overall; the build number increases with every upload.
- Apple Developer and Google Play accounts kept in the password manager; client-owned accounts requested during onboarding.
- Pre-submission checklist against the review guidelines: privacy policy, permissions justified, no private APIs, no placeholder content, account deletion where required.
- **Beta first:** TestFlight (iOS) and the Internal Testing track (Android) for **at least three days** before submitting to production.

## EcoPlus notes
Flutter app in `apps/frontend` (not started). Roles: citizen, business, driver, employee. Weak connections are normal: show retry states and never lose a typed weight or code. API contract: `apps/backend` Swagger.
