import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// EcoPlus brand tokens (source of truth: packages/brand/tokens.json, explained in docs/design/BRAND.md).
/// Canopy green for trust, Bloom lime for the one action that matters, warm paper so it never feels clinical.
class EcoColors {
  const EcoColors._({
    required this.bg,
    required this.surface,
    required this.surfaceAlt,
    required this.ink,
    required this.inkSoft,
    required this.line,
    required this.primary,
    required this.onPrimary,
    required this.amber,
    required this.danger,
  });

  final Color bg, surface, surfaceAlt, ink, inkSoft, line, primary, onPrimary, amber, danger;

  /// Bloom lime: the same in both themes.
  Color get accent => bloom;
  Color get onAccent => const Color(0xFF0D1B14);

  static const bloom = Color(0xFFC8F560);

  /// Hero panels are always deep canopy with light text, in light and dark mode.
  static const canopyFrom = Color(0xFF0E4A37);
  static const canopyTo = Color(0xFF06261C);
  static const canopyGlow = Color(0xFF1E8A62);
  static const onCanopy = Color(0xFFEAF6EE);
  static const canopyGradient = LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [canopyFrom, canopyTo]);

  static const light = EcoColors._(
    bg: Color(0xFFF5F2EA),
    surface: Color(0xFFFFFFFF),
    surfaceAlt: Color(0xFFECE7DA),
    ink: Color(0xFF0D1B14),
    inkSoft: Color(0xFF566660),
    line: Color(0xFFDFD9C9),
    primary: Color(0xFF0B3D2E),
    onPrimary: Color(0xFFFFFFFF),
    amber: Color(0xFFA35A0C),
    danger: Color(0xFFC23B33),
  );

  static const dark = EcoColors._(
    bg: Color(0xFF07110C),
    surface: Color(0xFF0F1D16),
    surfaceAlt: Color(0xFF17291F),
    ink: Color(0xFFEAF3EC),
    inkSoft: Color(0xFF8FA598),
    line: Color(0xFF223529),
    primary: Color(0xFF6FE0A6),
    onPrimary: Color(0xFF05150D),
    amber: Color(0xFFF0B04A),
    danger: Color(0xFFFF8A80),
  );
}

extension EcoTheme on BuildContext {
  EcoColors get eco => Theme.of(this).brightness == Brightness.dark ? EcoColors.dark : EcoColors.light;
}

const kRadius = 22.0;
const kFont = 'IBMPlexSansArabic';

/// Motion tokens: short and soft. Things ease out, they never bounce except for celebrations.
class Motion {
  static const fast = Duration(milliseconds: 160);
  static const base = Duration(milliseconds: 320);
  static const slow = Duration(milliseconds: 700);
  static const stagger = Duration(milliseconds: 70);
  static const curve = Curves.easeOutCubic;
}

final themeModeProvider = NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ThemeMode.system;
  void cycle() => state = switch (state) {
        ThemeMode.system => ThemeMode.light,
        ThemeMode.light => ThemeMode.dark,
        ThemeMode.dark => ThemeMode.system,
      };
}

ThemeData buildTheme(Brightness brightness) {
  final c = brightness == Brightness.dark ? EcoColors.dark : EcoColors.light;
  final base = ThemeData(brightness: brightness, useMaterial3: true, fontFamily: kFont);

  TextStyle ts(double size, FontWeight w, {double height = 1.3, double spacing = 0}) =>
      TextStyle(fontFamily: kFont, fontSize: size, fontWeight: w, height: height, letterSpacing: spacing, color: c.ink);

  final text = base.textTheme.copyWith(
    displayLarge: ts(56, FontWeight.w700, height: 1.05, spacing: -1.5),
    displayMedium: ts(44, FontWeight.w700, height: 1.05, spacing: -1),
    displaySmall: ts(34, FontWeight.w700, height: 1.1, spacing: -0.5),
    headlineLarge: ts(30, FontWeight.w700, height: 1.15, spacing: -0.4),
    headlineMedium: ts(26, FontWeight.w700, height: 1.2, spacing: -0.3),
    headlineSmall: ts(22, FontWeight.w700, height: 1.25, spacing: -0.2),
    titleLarge: ts(20, FontWeight.w700),
    titleMedium: ts(16, FontWeight.w600),
    titleSmall: ts(14, FontWeight.w600),
    bodyLarge: ts(16, FontWeight.w400, height: 1.5),
    bodyMedium: ts(14, FontWeight.w400, height: 1.5),
    bodySmall: ts(12, FontWeight.w400, height: 1.4),
    labelLarge: ts(14, FontWeight.w600),
    labelMedium: ts(12, FontWeight.w600, spacing: 0.2),
    labelSmall: ts(11, FontWeight.w600, spacing: 0.3),
  );

  OutlineInputBorder border(Color color, [double w = 1.2]) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: color, width: w));

  return base.copyWith(
    scaffoldBackgroundColor: c.bg,
    textTheme: text,
    primaryTextTheme: text,
    colorScheme: ColorScheme.fromSeed(seedColor: c.primary, brightness: brightness).copyWith(
      primary: c.primary,
      onPrimary: c.onPrimary,
      surface: c.surface,
      onSurface: c.ink,
      error: c.danger,
    ),
    dividerColor: c.line,
    splashFactory: InkSparkle.splashFactory,
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    }),
    appBarTheme: AppBarTheme(backgroundColor: c.bg, foregroundColor: c.ink, elevation: 0, scrolledUnderElevation: 0, centerTitle: false),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      border: border(c.line),
      enabledBorder: border(c.line),
      focusedBorder: border(c.primary, 2),
      errorBorder: border(c.danger),
      focusedErrorBorder: border(c.danger, 2),
      labelStyle: TextStyle(color: c.inkSoft),
      errorStyle: TextStyle(color: c.danger, fontWeight: FontWeight.w500),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: c.primary,
        foregroundColor: c.onPrimary,
        disabledBackgroundColor: c.surfaceAlt,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: ts(16, FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.ink,
        minimumSize: const Size(0, 48),
        side: BorderSide(color: c.line, width: 1.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: ts(15, FontWeight.w600),
      ),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: c.primary, textStyle: ts(14, FontWeight.w600))),
    chipTheme: base.chipTheme.copyWith(labelStyle: ts(14, FontWeight.w600)),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.surface,
      surfaceTintColor: Colors.transparent,
      height: 70,
      indicatorColor: EcoColors.bloom,
      labelTextStyle: WidgetStatePropertyAll(ts(12, FontWeight.w600)),
      iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(color: s.contains(WidgetState.selected) ? const Color(0xFF0D1B14) : c.inkSoft)),
    ),
    bottomSheetTheme: BottomSheetThemeData(backgroundColor: c.surface, surfaceTintColor: Colors.transparent, shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28)))),
    dialogTheme: DialogThemeData(backgroundColor: c.surface, surfaceTintColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24))),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: c.ink,
      contentTextStyle: ts(14, FontWeight.w500).copyWith(color: c.bg),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
  );
}
