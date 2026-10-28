import 'package:ecoplus_app/features/staff/weigh_screen.dart';
import 'package:ecoplus_app/app/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('weigh screen renders the QR search', (tester) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(800, 900);
    await tester.pumpWidget(ProviderScope(child: MaterialApp(theme: buildTheme(Brightness.light), home: const WeighScreen())));
    await tester.pump(const Duration(seconds: 1));
    expect(find.byType(TextField), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
