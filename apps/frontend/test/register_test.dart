import 'package:ecoplus_app/app/strings.dart';
import 'package:ecoplus_app/app/theme.dart';
import 'package:ecoplus_app/features/auth/register_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Future<void> open(WidgetTester tester) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(900, 1800);
    addTearDown(tester.view.reset);
    await tester.pumpWidget(ProviderScope(
      overrides: [stringsProvider.overrideWithValue(const S(false))],
      child: MaterialApp(theme: buildTheme(Brightness.light), locale: const Locale('en'), home: const RegisterScreen()),
    ));
    await tester.pump();
  }

  testWidgets('shows the field errors before anything is sent', (tester) async {
    await open(tester);
    await tester.tap(find.text('Create account').last);
    await tester.pump();
    expect(find.text('Enter your name (at least 2 letters)'), findsOneWidget);
    expect(find.text('Invalid number (digits only, 8 to 15)'), findsOneWidget);
    expect(find.text('At least 8 characters with a letter and a number'), findsOneWidget);
  });

  testWidgets('business fields appear only for a business account', (tester) async {
    await open(tester);
    expect(find.text('Business name'), findsNothing);
    await tester.tap(find.text('Business'));
    await tester.pump();
    expect(find.text('Business name'), findsOneWidget);
  });
}
