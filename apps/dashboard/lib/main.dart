import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router.dart';
import 'strings.dart';

void main() => runApp(const ProviderScope(child: DashboardApp()));

class DashboardApp extends ConsumerWidget {
  const DashboardApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final arabic = ref.watch(arabicProvider);
    return MaterialApp.router(
      title: 'EcoPlus',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      themeMode: ref.watch(themeModeProvider),
      locale: Locale(arabic ? 'ar' : 'en'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
