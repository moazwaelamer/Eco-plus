import 'package:eco_ui/eco_ui.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../data.dart';

class StockBarChart extends StatelessWidget {
  const StockBarChart({super.key, required this.items, required this.title, required this.unit});
  final List<Json> items;
  final String title;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final max = items.fold<num>(1, (m, i) => n(i['weightKg']) > m ? n(i['weightKg']) : m).toDouble();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: tt.titleMedium),
      const SizedBox(height: 16),
      SizedBox(
        height: 200,
        child: items.isEmpty
            ? Center(child: Text('—', style: TextStyle(color: c.inkSoft)))
            : BarChart(
                BarChartData(
                  maxY: (max * 1.2 / 20).ceilToDouble() * 20,
                  gridData: FlGridData(drawVerticalLine: false, getDrawingHorizontalLine: (_) => FlLine(color: c.surfaceAlt, strokeWidth: 1)),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(),
                    rightTitles: const AxisTitles(),
                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (v, m) => Text(v.toInt().toString(), style: tt.bodySmall?.copyWith(color: c.inkSoft)))),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (v, m) => Padding(padding: const EdgeInsets.only(top: 6), child: Text('${items[v.toInt()]['material']}'.split(' ').first, style: tt.bodySmall?.copyWith(color: c.inkSoft))),
                      ),
                    ),
                  ),
                  barTouchData: BarTouchData(touchTooltipData: BarTouchTooltipData(getTooltipItem: (g, gi, r, ri) => BarTooltipItem('${r.toY.toInt()} $unit', TextStyle(color: c.onPrimary, fontWeight: FontWeight.w600)))),
                  barGroups: [
                    for (final (i, it) in items.indexed)
                      BarChartGroupData(x: i, barRods: [BarChartRodData(toY: n(it['weightKg']).toDouble(), width: 28, color: c.primary, borderRadius: const BorderRadius.vertical(top: Radius.circular(8)))]),
                  ],
                ),
                duration: const Duration(milliseconds: 700),
                curve: Curves.easeOutCubic,
              ),
      ),
    ]);
  }
}

class StatusDonut extends StatelessWidget {
  const StatusDonut({super.key, required this.counts, required this.title, required this.label});
  final String Function(String) label;
  final Map<String, int> counts;
  final String title;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final colors = [c.primary, c.amber, c.inkSoft, c.surfaceAlt, c.primary.withValues(alpha: .5)];
    final entries = counts.entries.toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: tt.titleMedium),
      const SizedBox(height: 16),
      SizedBox(
        height: 200,
        child: entries.isEmpty
            ? Center(child: Text('—', style: TextStyle(color: c.inkSoft)))
            : Row(children: [
                Expanded(
                  child: PieChart(
                    PieChartData(
                      sectionsSpace: 3,
                      centerSpaceRadius: 44,
                      sections: [for (final (i, e) in entries.indexed) PieChartSectionData(value: e.value.toDouble(), color: colors[i % colors.length], radius: 26, showTitle: false)],
                    ),
                    duration: const Duration(milliseconds: 700),
                  ),
                ),
                Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                  for (final (i, e) in entries.indexed)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Container(width: 10, height: 10, decoration: BoxDecoration(color: colors[i % colors.length], shape: BoxShape.circle)),
                        const SizedBox(width: 8),
                        Text('${label(e.key)}  ${e.value}', style: tt.bodySmall),
                      ]),
                    ),
                ]),
              ]),
      ),
    ]);
  }
}
