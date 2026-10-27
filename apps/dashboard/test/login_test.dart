import 'package:eco_ui/eco_ui.dart';
import 'package:ecoplus_dashboard/pages/login_page.dart';
import 'package:ecoplus_dashboard/strings.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('login page shows the form and demo accounts in English', (tester) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(1200, 800);
    addTearDown(tester.view.reset);
    await tester.pumpWidget(ProviderScope(
      overrides: [stringsProvider.overrideWithValue(const T(false))],
      child: MaterialApp(theme: buildTheme(Brightness.light), home: const LoginPage()),
    ));
    await tester.pump(const Duration(seconds: 5));
    expect(find.text('Log in'), findsWidgets);
    expect(find.text('Admin'), findsOneWidget);
    expect(find.text('Factory'), findsOneWidget);
  });

  test('every status has a label in both languages', () {
    for (final s in ['created', 'assigned', 'collected', 'planned', 'in_progress', 'done', 'placed', 'confirmed', 'dispatched', 'delivered', 'issued', 'paid', 'overdue']) {
      expect(const T(true).status(s), isNot(s));
      expect(const T(false).status(s), isNot(s));
    }
  });
}
