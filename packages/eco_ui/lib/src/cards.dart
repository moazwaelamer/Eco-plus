import 'package:flutter/material.dart';

import 'motion.dart';
import 'theme.dart';

class EcoCard extends StatelessWidget {
  const EcoCard({super.key, required this.child, this.padding = const EdgeInsets.all(20), this.color, this.onTap});
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? c.surface,
        borderRadius: BorderRadius.circular(kRadius),
        border: Border.all(color: c.line),
        boxShadow: color == null ? [BoxShadow(color: c.ink.withValues(alpha: 0.04), blurRadius: 18, offset: const Offset(0, 6))] : null,
      ),
      child: child,
    );
    return onTap == null ? card : Pressable(onTap: onTap, child: card);
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, required this.body});
  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(color: c.surfaceAlt, shape: BoxShape.circle),
          child: Icon(icon, size: 32, color: c.primary),
        ),
        const SizedBox(height: 16),
        Text(title, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w700), textAlign: TextAlign.center),
        const SizedBox(height: 6),
        Text(body, style: t.bodyMedium?.copyWith(color: c.inkSoft), textAlign: TextAlign.center),
      ]),
    );
  }
}

