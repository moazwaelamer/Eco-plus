import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// EcoPlus design tokens. Forest green and warm paper, with lime used only for the one thing that matters on a screen.
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
    required this.accent,
    required this.onAccent,
    required this.amber,
    required this.danger,
  });

  final Color bg, surface, surfaceAlt, ink, inkSoft, line, primary, onPrimary, accent, onAccent, amber, danger;

  static const light = EcoColors._(
    bg: Color(0xFFF4F1EA),
    surface: Color(0xFFFFFFFF),
    surfaceAlt: Color(0xFFEAE6DB),
    ink: Color(0xFF12241B),
    inkSoft: Color(0xFF5C6B62),
    line: Color(0xFFDDD8CA),
    primary: Color(0xFF0F5B3E),
    onPrimary: Color(0xFFFFFFFF),
    accent: Color(0xFFC6F432),
    onAccent: Color(0xFF12241B),
    amber: Color(0xFFD98B1B),
    danger: Color(0xFFC83E36),
  );

  static const dark = EcoColors._(
    bg: Color(0xFF0B1511),
    surface: Color(0xFF13211A),
    surfaceAlt: Color(0xFF1B2E25),
    ink: Color(0xFFE8F0EA),
    inkSoft: Color(0xFF93A69A),
    line: Color(0xFF26382E),
    primary: Color(0xFF5FD19A),
    onPrimary: Color(0xFF08130E),
    accent: Color(0xFFC6F432),
    onAccent: Color(0xFF12241B),
    amber: Color(0xFFF0B04A),
    danger: Color(0xFFFF8A80),
  );
}

extension EcoTheme on BuildContext {
  EcoColors get eco => Theme.of(this).brightness == Brightness.dark ? EcoColors.dark : EcoColors.light;
}

const kRadius = 20.0;

ThemeData buildTheme(Brightness brightness) {
  final c = brightness == Brightness.dark ? EcoColors.dark : EcoColors.light;
  final base = ThemeData(brightness: brightness, useMaterial3: true);
  final text = base.textTheme.apply(fontFamily: GoogleFonts.cairo().fontFamily, bodyColor: c.ink, displayColor: c.ink);
  OutlineInputBorder border(Color color, [double w = 1.2]) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: color, width: w));

  return base.copyWith(
    scaffoldBackgroundColor: c.bg,
    textTheme: text,
    colorScheme: ColorScheme.fromSeed(seedColor: c.primary, brightness: brightness).copyWith(
      primary: c.primary,
      onPrimary: c.onPrimary,
      surface: c.surface,
      onSurface: c.ink,
      error: c.danger,
    ),
    dividerColor: c.line,
    appBarTheme: AppBarTheme(backgroundColor: c.bg, foregroundColor: c.ink, elevation: 0, scrolledUnderElevation: 0),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      border: border(c.line),
      enabledBorder: border(c.line),
      focusedBorder: border(c.primary, 2),
      errorBorder: border(c.danger),
      labelStyle: TextStyle(color: c.inkSoft),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: c.primary,
        foregroundColor: c.onPrimary,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.surface,
      indicatorColor: c.accent,
      labelTextStyle: WidgetStatePropertyAll(text.labelMedium?.copyWith(fontWeight: FontWeight.w600)),
      iconTheme: WidgetStateProperty.resolveWith(
        (s) => IconThemeData(color: s.contains(WidgetState.selected) ? c.onAccent : c.inkSoft),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: c.ink,
      contentTextStyle: text.bodyMedium?.copyWith(color: c.bg),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
  );
}
