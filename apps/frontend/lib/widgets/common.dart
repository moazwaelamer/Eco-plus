import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/strings.dart';
import '../core/api.dart';
import 'package:eco_ui/eco_ui.dart';

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
