import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../strings.dart';

/// A status pill: colour plus label, never colour alone.
class StatusPill extends ConsumerWidget {
  const StatusPill(this.status, {super.key});
  final String status;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.eco;
    final t = ref.watch(stringsProvider);
    final color = switch (status) {
      'created' || 'placed' || 'planned' || 'issued' => c.amber,
      'rejected' || 'cancelled' || 'overdue' => c.danger,
      'assigned' || 'in_progress' || 'confirmed' || 'dispatched' => c.primary,
      'paid' || 'delivered' || 'done' || 'collected' || 'weighed' => c.primary,
      _ => c.inkSoft,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(99)),
      child: Text(t.status(status), style: Theme.of(context).textTheme.labelMedium?.copyWith(color: color, fontWeight: FontWeight.w700)),
    );
  }
}

class PageHeader extends StatelessWidget {
  const PageHeader(this.title, {super.key, this.actions = const []});
  final String title;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: Row(children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.headlineMedium)),
          ...actions,
        ]),
      ).fadeUp();
}

/// Shows loading as a shimmer, errors with a retry, and data through [builder].
class AsyncBody<D> extends ConsumerWidget {
  const AsyncBody({super.key, required this.value, required this.onRetry, required this.builder, this.skeletonHeight = 120});
  final AsyncValue<D> value;
  final VoidCallback onRetry;
  final Widget Function(D data) builder;
  final double skeletonHeight;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    return value.when(
      data: builder,
      loading: () => Column(children: [for (var i = 0; i < 3; i++) Padding(padding: const EdgeInsets.only(bottom: 12), child: Skeleton(height: skeletonHeight))]),
      error: (e, _) {
        final err = ApiError.from(e);
        return EcoCard(
          child: Row(children: [
            Icon(Icons.cloud_off_rounded, color: context.eco.inkSoft),
            const SizedBox(width: 12),
            Expanded(child: Text(err.isNetwork ? t.noConnection : err.message)),
            OutlinedButton(onPressed: onRetry, child: Text(t.tryAgain)),
          ]),
        );
      },
    );
  }
}

class KpiCard extends StatelessWidget {
  const KpiCard({super.key, required this.label, required this.value, required this.icon, this.suffix = '', this.hint});
  final String label;
  final num value;
  final IconData icon;
  final String suffix;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    return EcoCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: c.surfaceAlt, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: c.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: t.titleSmall?.copyWith(color: c.inkSoft))),
        ]),
        const SizedBox(height: 16),
        TweenAnimationBuilder<double>(
          tween: Tween(end: value.toDouble()),
          duration: const Duration(milliseconds: 1000),
          curve: Curves.easeOutCubic,
          builder: (_, v, _) => Text('${_fmt(v)}$suffix', style: t.displaySmall?.copyWith(fontFeatures: const [FontFeature.tabularFigures()])),
        ),
        if (hint != null) ...[const SizedBox(height: 4), Text(hint!, style: t.bodySmall?.copyWith(color: c.inkSoft))],
      ]),
    );
  }

  static String _fmt(double v) => v == v.roundToDouble() ? v.round().toString() : v.toStringAsFixed(1);
}

String money(num v) => v.toStringAsFixed(2);

void toast(BuildContext context, String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
