import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ecoplus_app/app/strings.dart';
import 'package:ecoplus_app/app/theme.dart';
import 'package:ecoplus_app/features/auth/login_screen.dart';

void main() {
  testWidgets('login screen shows the form and demo accounts in Arabic, then English', (tester) async {
    await tester.pumpWidget(ProviderScope(
      child: Consumer(builder: (context, ref, _) {
        final ar = ref.watch(arabicProvider);
        return MaterialApp(
          theme: buildTheme(Brightness.light),
          locale: Locale(ar ? 'ar' : 'en'),
          home: const LoginScreen(),
        );
      }),
    ));
    await tester.pump(const Duration(seconds: 5)); // let the entrance animations finish

    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(find.text('عميل'), findsOneWidget);

    await tester.tap(find.text('English'));
    await tester.pump(const Duration(seconds: 5));
    expect(find.text('Log in'), findsOneWidget);
    expect(find.text('Citizen'), findsOneWidget);
  });

  test('status labels exist in both languages', () {
    for (final status in ['created', 'assigned', 'collected', 'weighed', 'rejected', 'cancelled']) {
      expect(const S(true).status(status), isNot(status));
      expect(const S(false).status(status), isNot(status));
    }
  });
}
