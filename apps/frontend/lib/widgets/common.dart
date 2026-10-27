import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/strings.dart';
import '../app/theme.dart';
import '../core/api.dart';
import 'motion.dart';

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

/// A status is never shown by colour alone: the label always travels with it.
class StatusChip extends ConsumerWidget {
  const StatusChip(this.status, {super.key});
  final String status;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.eco;
    final (Color color, IconData icon) = switch (status) {
      'created' => (c.amber, Icons.schedule_rounded),
      'assigned' => (c.primary, Icons.local_shipping_rounded),
      'collected' => (c.primary, Icons.inventory_2_rounded),
      'weighed' => (c.primary, Icons.check_circle_rounded),
      'rejected' => (c.danger, Icons.block_rounded),
      _ => (c.inkSoft, Icons.cancel_rounded),
    };
    final s = ref.watch(stringsProvider);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(99)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 15, color: color),
        const SizedBox(width: 6),
        Text(s.status(status), style: Theme.of(context).textTheme.labelMedium?.copyWith(color: color, fontWeight: FontWeight.w700)),
      ]),
    );
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

/// Shown when a request fails: says what went wrong in plain words and offers a retry.
class ErrorState extends ConsumerWidget {
  const ErrorState({super.key, required this.error, required this.onRetry});
  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final err = ApiError.from(error);
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.cloud_off_rounded, size: 40, color: context.eco.inkSoft),
        const SizedBox(height: 12),
        Text(err.isNetwork ? s.noConnection : err.message, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        OutlinedButton(onPressed: onRetry, child: Text(s.tryAgain)),
      ]),
    );
  }
}
