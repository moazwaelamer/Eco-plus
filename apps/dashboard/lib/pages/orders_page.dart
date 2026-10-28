import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/ui.dart';

class OrdersPage extends ConsumerWidget {
  const OrdersPage({super.key});

  Future<void> _act(BuildContext context, WidgetRef ref, Json order, String action) async {
    try {
      await ref.read(dioProvider).post('/orders/${order['id']}/$action');
      ref.invalidate(ordersProvider);
      ref.invalidate(invoicesProvider);
      ref.invalidate(stockProvider);
    } catch (e) {
      if (context.mounted) toast(context, ApiError.from(e).message);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final isAdmin = ref.watch(sessionProvider).value?.role == 'admin';
    final orders = ref.watch(ordersProvider);

    return ListView(children: [
      PageHeader(t.orders),
      AsyncBody<List<Json>>(
        value: orders,
        onRetry: () => ref.invalidate(ordersProvider),
        builder: (list) => list.isEmpty
            ? EmptyState(icon: Icons.receipt_long_outlined, title: t.nothingYet, body: '')
            : Column(children: [
                for (final (i, o) in list.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _OrderCard(order: o, t: t, isAdmin: isAdmin, onAction: (a) => _act(context, ref, o, a), c: c, tt: tt).fadeUp(index: i < 8 ? i : 0),
                  ),
              ]),
      ),
      const SizedBox(height: 32),
    ]);
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, required this.t, required this.isAdmin, required this.onAction, required this.c, required this.tt});
  final Json order;
  final T t;
  final bool isAdmin;
  final void Function(String) onAction;
  final EcoColors c;
  final TextTheme tt;

  @override
  Widget build(BuildContext context) {
    final status = '${order['status']}';
    final items = (order['items'] as List).cast<Json>();
    final total = items.fold<num>(0, (s, i) => s + n(i['quantityKg']) * n(i['unitPrice']));
    final actions = <(String, String, bool)>[
      if (isAdmin && status == 'placed') ('confirm', t.confirm, true),
      if (isAdmin && status == 'confirmed') ('dispatch', t.dispatch, true),
      if (isAdmin && status == 'dispatched') ('deliver', t.deliver, true),
      if ((isAdmin && (status == 'placed' || status == 'confirmed')) || (!isAdmin && status == 'placed')) ('cancel', t.cancel, false),
    ];

    return EcoCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('#${order['id']}', style: tt.titleLarge),
          const SizedBox(width: 12),
          if (isAdmin) Expanded(child: Text('${(order['factory'] as Json?)?['name'] ?? ''}', style: tt.bodyMedium?.copyWith(color: c.inkSoft))) else const Spacer(),
          StatusPill(status),
        ]),
        const SizedBox(height: 12),
        for (final i in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(children: [
              Expanded(child: Text('${(i['materialType'] as Json)['name']} · ${(i['batch'] as Json?)?['grade'] ?? ''}')),
              Text('${n(i['quantityKg'])} ${t.kg}', style: const TextStyle(fontFeatures: [FontFeature.tabularFigures()])),
            ]),
          ),
        const Divider(height: 24),
        Row(children: [
          Text('${t.total}: ${money(total)} ${t.currency}', style: tt.titleMedium),
          const Spacer(),
          for (final a in actions)
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 8),
              child: a.$3
                  ? FilledButton(onPressed: () => onAction(a.$1), style: FilledButton.styleFrom(minimumSize: const Size(0, 42), padding: const EdgeInsets.symmetric(horizontal: 18)), child: Text(a.$2))
                  : OutlinedButton(onPressed: () => onAction(a.$1), child: Text(a.$2)),
            ),
        ]),
      ]),
    );
  }
}
