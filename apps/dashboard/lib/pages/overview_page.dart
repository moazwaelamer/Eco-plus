import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/charts.dart';
import '../widgets/trends.dart';
import '../widgets/ui.dart';

class OverviewPage extends ConsumerWidget {
  const OverviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final waiting = ref.watch(shipmentsByStatus('created'));
    final routes = ref.watch(routesTodayProvider);
    final orders = ref.watch(ordersProvider);
    final invoices = ref.watch(invoicesProvider);
    final stock = ref.watch(stockProvider);

    int count(AsyncValue<List<Json>> v) => v.value?.length ?? 0;
    final open = (orders.value ?? []).where((o) => const {'placed', 'confirmed', 'dispatched'}.contains(o['status'])).length;
    final unpaid = (invoices.value ?? []).where((i) => i['status'] != 'paid').fold<num>(0, (s, i) => s + n(i['total']));

    return ListView(children: [
      PageHeader(t.overview),
      LayoutBuilder(builder: (context, box) {
        final cols = box.maxWidth >= 980 ? 4 : (box.maxWidth >= 560 ? 2 : 1);
        final w = (box.maxWidth - (cols - 1) * 16) / cols;
        final cards = [
          KpiCard(label: t.waitingShipments, value: count(waiting), icon: Icons.local_shipping_rounded),
          KpiCard(label: t.routesToday, value: count(routes), icon: Icons.route_rounded),
          KpiCard(label: t.openOrders, value: open, icon: Icons.receipt_long_rounded),
          KpiCard(label: t.unpaid, value: unpaid, icon: Icons.request_quote_rounded, suffix: ' ${t.currency}'),
        ];
        return Wrap(spacing: 16, runSpacing: 16, children: [for (final (i, c) in cards.indexed) SizedBox(width: w, child: c.fadeUp(index: i + 1))]);
      }),
      const SizedBox(height: 24),
      AsyncBody<Json>(
        value: stock,
        onRetry: () => ref.invalidate(stockProvider),
        skeletonHeight: 90,
        builder: (s) => _StockStrip(s, t).fadeUp(index: 5),
      ),
      const SizedBox(height: 24),
      const TrendsSection(),
      const SizedBox(height: 24),
      LayoutBuilder(builder: (context, box) {
        final wide = box.maxWidth >= 860;
        final stockChart = EcoCard(child: StockBarChart(items: (stock.value?['items'] as List?)?.cast<Json>() ?? const [], title: t.stockByMaterial, unit: t.kg));
        final orderChart = EcoCard(child: StatusDonut(counts: _countBy(orders.value ?? const []), title: t.ordersByStatus, label: t.status));
        return (wide
                ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: stockChart), const SizedBox(width: 16), Expanded(child: orderChart)])
                : Column(children: [stockChart, const SizedBox(height: 16), orderChart]))
            .fadeUp(index: 6);
      }),
      const SizedBox(height: 24),
      Text(t.recentOrders, style: Theme.of(context).textTheme.titleLarge).fadeUp(index: 6),
      const SizedBox(height: 12),
      AsyncBody<List<Json>>(
        value: orders,
        onRetry: () => ref.invalidate(ordersProvider),
        builder: (list) => list.isEmpty
            ? EmptyState(icon: Icons.receipt_long_outlined, title: t.nothingYet, body: '')
            : Column(children: [for (final (i, o) in list.take(5).indexed) _OrderRow(o, t).fadeUp(index: 7 + i)]),
      ),
      const SizedBox(height: 32),
    ]);
  }
}

Map<String, int> _countBy(List<Json> list) {
  final m = <String, int>{};
  for (final o in list) {
    m.update('${o['status']}', (v) => v + 1, ifAbsent: () => 1);
  }
  return m;
}

class _StockStrip extends StatelessWidget {
  const _StockStrip(this.s, this.t);
  final Json s;
  final T t;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final usage = (n(s['usagePercent']) / 100).clamp(0.0, 1.0).toDouble();
    return EcoCard(
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t.stockTotal, style: tt.titleSmall?.copyWith(color: c.inkSoft)),
            const SizedBox(height: 4),
            Text('${n(s['totalKg'])} ${t.kg}', style: tt.headlineMedium),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: TweenAnimationBuilder<double>(
                tween: Tween(end: usage),
                duration: const Duration(milliseconds: 900),
                curve: Curves.easeOutCubic,
                builder: (_, v, _) => LinearProgressIndicator(value: v, minHeight: 10, backgroundColor: c.surfaceAlt, color: s['nearCapacity'] == true ? c.amber : c.primary),
              ),
            ),
            const SizedBox(height: 6),
            Text('${t.capacityUse}: ${s['usagePercent']}%', style: tt.bodySmall?.copyWith(color: c.inkSoft)),
          ]),
        ),
      ]),
    );
  }
}

class _OrderRow extends StatelessWidget {
  const _OrderRow(this.o, this.t);
  final Json o;
  final T t;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: EcoCard(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        child: Row(children: [
          Text('#${o['id']}', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(width: 14),
          Expanded(child: Text('${(o['factory'] as Json?)?['name'] ?? ''}', style: TextStyle(color: c.inkSoft))),
          StatusPill('${o['status']}'),
        ]),
      ),
    );
  }
}
