import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'theme.dart';

/// The EcoPlus mark: a leaf-shaped tile with a plus. Same shape as docs/design/brand/logo.svg.
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 44, this.animate = false, this.onDark = false});
  final double size;
  final bool animate;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final mark = SizedBox(width: size, height: size, child: CustomPaint(painter: _LogoPainter(plusColor: const Color(0xFF0B3D2E))));
    if (!animate) return mark;
    return mark
        .animate()
        .scale(begin: const Offset(0.4, 0.4), duration: 700.ms, curve: Curves.elasticOut)
        .fadeIn(duration: 250.ms)
        .then(delay: 300.ms)
        .shimmer(duration: 1400.ms, color: Colors.white.withValues(alpha: 0.7));
  }
}

class _LogoPainter extends CustomPainter {
  _LogoPainter({required this.plusColor});
  final Color plusColor;

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.width / 96;
    final path = Path()
      ..moveTo(0, 48 * k)
      ..arcToPoint(Offset(48 * k, 0), radius: Radius.circular(48 * k))
      ..lineTo(83 * k, 0)
      ..arcToPoint(Offset(96 * k, 13 * k), radius: Radius.circular(13 * k))
      ..lineTo(96 * k, 48 * k)
      ..arcToPoint(Offset(48 * k, 96 * k), radius: Radius.circular(48 * k))
      ..lineTo(13 * k, 96 * k)
      ..arcToPoint(Offset(0, 83 * k), radius: Radius.circular(13 * k))
      ..close();
    canvas.drawPath(path, Paint()..color = EcoColors.bloom);
    final plus = Paint()
      ..color = plusColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10 * k
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(48 * k, 27 * k), Offset(48 * k, 69 * k), plus);
    canvas.drawLine(Offset(27 * k, 48 * k), Offset(69 * k, 48 * k), plus);
  }

  @override
  bool shouldRepaint(_LogoPainter old) => old.plusColor != plusColor;
}

/// "EcoPlus" with the plus in the accent colour. Latin only; the Arabic name is written إيكو بلس.
class Wordmark extends StatelessWidget {
  const Wordmark({super.key, this.size = 28, this.color, this.accent});
  final double size;
  final Color? color;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final base = color ?? context.eco.ink;
    final style = TextStyle(fontFamily: kFont, fontSize: size, fontWeight: FontWeight.w700, letterSpacing: -0.5, height: 1);
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Text.rich(TextSpan(children: [
        TextSpan(text: 'Eco', style: style.copyWith(color: base)),
        TextSpan(text: 'Plus', style: style.copyWith(color: accent ?? EcoColors.bloom)),
      ])),
    );
  }
}

/// Slow, soft light moving behind a hero panel. Painted with radial gradients, so it stays cheap.
class AuroraBackdrop extends StatefulWidget {
  const AuroraBackdrop({super.key, required this.child, this.borderRadius = 32, this.padding = EdgeInsets.zero});
  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry padding;

  @override
  State<AuroraBackdrop> createState() => _AuroraBackdropState();
}

class _AuroraBackdropState extends State<AuroraBackdrop> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 14))..repeat();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.of(context).disableAnimations;
    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: DecoratedBox(
        decoration: const BoxDecoration(gradient: EcoColors.canopyGradient),
        child: Stack(children: [
          Positioned.fill(
            child: reduce
                ? const SizedBox()
                : AnimatedBuilder(animation: _ctrl, builder: (_, _) => CustomPaint(painter: _AuroraPainter(_ctrl.value))),
          ),
          Padding(padding: widget.padding, child: widget.child),
        ]),
      ),
    );
  }
}

class _AuroraPainter extends CustomPainter {
  _AuroraPainter(this.t);
  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    void blob(Color color, double phase, double rx, double ry, double radius, double alpha) {
      final a = (t + phase) * 2 * math.pi;
      final center = Offset(size.width * (0.5 + rx * math.cos(a)), size.height * (0.5 + ry * math.sin(a * 0.8)));
      final r = size.shortestSide * radius;
      final shader = RadialGradient(colors: [color.withValues(alpha: alpha), color.withValues(alpha: 0)]).createShader(Rect.fromCircle(center: center, radius: r));
      canvas.drawCircle(center, r, Paint()..shader = shader);
    }

    blob(EcoColors.canopyGlow, 0.0, 0.35, 0.3, 0.9, 0.55);
    blob(EcoColors.bloom, 0.45, 0.4, 0.35, 0.55, 0.16);
    blob(const Color(0xFF3FBF8B), 0.75, 0.3, 0.4, 0.7, 0.25);
  }

  @override
  bool shouldRepaint(_AuroraPainter old) => old.t != t;
}

/// Circular progress with round caps. Animates from 0 on first show and between values.
class ProgressRing extends StatelessWidget {
  const ProgressRing({super.key, required this.value, this.size = 96, this.stroke = 10, this.child});
  final double value;
  final double size;
  final double stroke;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(end: value.clamp(0.0, 1.0)),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeOutCubic,
      builder: (_, v, _) => SizedBox(
        width: size,
        height: size,
        child: CustomPaint(painter: _RingPainter(v, stroke), child: Center(child: child)),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.value, this.stroke);
  final double value;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset(stroke / 2, stroke / 2) & Size(size.width - stroke, size.height - stroke);
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = Colors.white.withValues(alpha: 0.14);
    canvas.drawArc(rect, 0, math.pi * 2, false, track);
    if (value <= 0) return;
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..shader = const SweepGradient(startAngle: -math.pi / 2, endAngle: math.pi * 1.5, colors: [Color(0xFF7CE0B0), EcoColors.bloom]).createShader(rect);
    canvas.drawArc(rect, -math.pi / 2, math.pi * 2 * value, false, arc);
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.value != value || old.stroke != stroke;
}
