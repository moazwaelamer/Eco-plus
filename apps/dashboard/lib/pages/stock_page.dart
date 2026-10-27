import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/ui.dart';

class StockPage extends ConsumerWidget {
  const StockPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final stock = ref.watch(stockProvider);

    return ListView(children: [
      PageHeader(t.stock),
      AsyncBody<Json>(
        value: stock,
        onRetry: () => ref.invalidate(stockProvider),
        builder: (s) {
          final items = (s['items'] as List).cast<Json>();
          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            KpiCard(label: t.stockTotal, value: n(s['totalKg']), icon: Icons.warehouse_rounded, suffix: ' ${t.kg}', hint: '${t.capacityUse}: ${s['usagePercent']}%').fadeUp(index: 1),
            const SizedBox(height: 20),
            if (items.isEmpty)
              EmptyState(icon: Icons.inventory_2_outlined, title: t.nothingYet, body: '')
            else
              for (final (i, it) in items.indexed)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: EcoCard(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                    child: Row(children: [
                      Expanded(child: Text('${it['material']}', style: tt.titleMedium)),
                      Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: c.surfaceAlt, borderRadius: BorderRadius.circular(99)), child: Text('${it['grade']}', style: tt.labelMedium)),
                      const SizedBox(width: 16),
                      Text('${n(it['weightKg'])} ${t.kg}', style: tt.titleMedium?.copyWith(fontFeatures: const [FontFeature.tabularFigures()])),
                    ]),
                  ).fadeUp(index: 2 + (i < 8 ? i : 0)),
                ),
            const SizedBox(height: 32),
          ]);
        },
      ),
    ]);
  }
}
