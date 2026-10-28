import 'package:ecoplus_app/app/theme.dart';
import 'package:ecoplus_app/features/notifications/notifications_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> _show(WidgetTester tester, List<Json> items) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = const Size(800, 900);
  await tester.pumpWidget(ProviderScope(
    overrides: [notificationsProvider.overrideWith((ref) async => items)],
    child: MaterialApp(theme: buildTheme(Brightness.light), home: const NotificationsScreen()),
  ));
  await tester.pump(const Duration(seconds: 2));
}

void main() {
  testWidgets('notifications screen lists items', (tester) async {
    await _show(tester, [
      {'id': 1, 'title': 'Pickup scheduled', 'body': 'A driver will collect', 'isRead': false},
    ]);
    expect(find.text('Pickup scheduled'), findsOneWidget);
  });

  testWidgets('notifications screen shows the empty state', (tester) async {
    await _show(tester, []);
    expect(find.byIcon(Icons.notifications_none_rounded), findsOneWidget);
  });
}
