# Frontend (Flutter mobile app)

One app for customers (citizen, business) and drivers. Admin, employee and factory will use the web dashboard (`apps/dashboard`).
Arabic first (RTL) with English, light and dark themes.

## Built

- Login with saved session and automatic token refresh; demo-account chips on the login screen (need the development seed).
- Citizen / business: home with points card and level progress, shipments with QR and the handover code, points history and leaderboard.
- Driver: today's route, start route, collect a stop by typing the customer's 6 digit code.
- Register (citizen or business) with the same validation rules as the API.
- Scan a bag: photo (camera or gallery, optional), material, fill level, location, request pickup; the result shows ready, merge (rides along) or wait.
- Admin / employee / factory: a screen saying their tools live on the web dashboard.

## Not built yet

Notifications list, uploading the photo from the web build was not exercised (file picker), camera and location were not tried on a phone, employee weighing, push notifications,
offline queue, bundling the Cairo font (on first load the Arabic text briefly shows as boxes while the font downloads), real app icon and store assets, iOS and Android builds were not run (only the web build was checked).

## Run

Start the API first (`apps/backend`, `npm run start:dev`), then:

```bash
cd apps/frontend
flutter pub get
flutter run -d chrome --web-port 8080     # web; the API allows http://localhost:8080 by default
flutter run                               # a connected phone or simulator
flutter run --dart-define=API_URL=http://192.168.1.10:3000   # API on another machine
```

The Android emulator reaches the API at `10.0.2.2:3000` automatically. Checks: `flutter analyze` and `flutter test`.

## Layout

`lib/app` theme, router, strings. `lib/core` API client and session. `lib/features/<role>` screens. `lib/widgets` shared pieces.
Design tokens are in `lib/app/theme.dart` (forest green, warm paper, lime accent, Cairo font).
