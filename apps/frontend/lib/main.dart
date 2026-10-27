import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/router.dart';
import 'app/strings.dart';
import 'app/theme.dart';

void main() => runApp(const ProviderScope(child: EcoPlusApp()));

class EcoPlusApp extends ConsumerWidget {
  const EcoPlusApp({super.key});

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
