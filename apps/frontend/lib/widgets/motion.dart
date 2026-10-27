import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../app/theme.dart';

/// Press feedback for anything tappable: a small scale down and a light haptic.
class Pressable extends StatefulWidget {
  const Pressable({super.key, required this.child, this.onTap, this.scale = 0.97});
  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: widget.onTap == null ? null : (_) => setState(() => _down = true),
      onTapCancel: () => setState(() => _down = false),
      onTapUp: (_) => setState(() => _down = false),
      onTap: widget.onTap == null
          ? null
          : () {
              HapticFeedback.selectionClick();
              widget.onTap!();
            },
      child: AnimatedScale(scale: _down ? widget.scale : 1, duration: Motion.fast, curve: Curves.easeOut, child: widget.child),
    );
  }
}

extension FadeUp on Widget {
  /// Enters with a soft fade and a short rise. `index` staggers siblings.
  Widget fadeUp({int index = 0, Duration? delay}) => animate(delay: delay ?? Motion.stagger * index)
      .fadeIn(duration: Motion.base, curve: Motion.curve)
      .slideY(begin: 0.12, end: 0, duration: Motion.slow, curve: Motion.curve);
}

/// Loading placeholder that shimmers instead of spinning.
class Skeleton extends StatelessWidget {
  const Skeleton({super.key, required this.height, this.radius = kRadius});
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    return Container(height: height, decoration: BoxDecoration(color: c.surfaceAlt, borderRadius: BorderRadius.circular(radius)))
        .animate(onPlay: (ctrl) => ctrl.repeat())
        .shimmer(duration: 1400.ms, color: c.surface.withValues(alpha: 0.55));
  }
}
