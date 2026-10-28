import 'package:eco_ui/eco_ui.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import 'ui.dart';

/// Kilograms weighed per day, new shipments per day and the rejection rate, with a 7/30/90 day filter.
class TrendsSection extends ConsumerWidget {
  const TrendsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final days = ref.watch(statsDays);
    final stats = ref.watch(statsProvider);
    return EcoCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Wrap(spacing: 8, runSpacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
          Text(t.kgOverTime, style: tt.titleMedium),
          const SizedBox(width: 8),
          for (final (d, label) in [(7, t.days7), (30, t.days30), (90, t.days90)])
            ChoiceChip(label: Text(label), selected: days == d, onSelected: (_) => ref.read(statsDays.notifier).state = d),
        ]),
        const SizedBox(height: 16),
        AsyncBody<Json>(
          value: stats,
          onRetry: () => ref.invalidate(statsProvider),
          skeletonHeight: 220,
          builder: (s) {
            final series = (s['series'] as List).cast<Json>();
            final spots = [for (final (i, r) in series.indexed) FlSpot(i.toDouble(), n(r['kg']).toDouble())];
            final shipSpots = [for (final (i, r) in series.indexed) FlSpot(i.toDouble(), n(r['shipments']).toDouble())];
            final maxY = [...spots, ...shipSpots].fold<double>(1, (m, p) => p.y > m ? p.y : m);
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Wrap(spacing: 28, runSpacing: 8, children: [
                _Stat(t.totalKgPeriod, '${n(s['totalKg'])} ${t.kg}'),
                _Stat(t.shipmentsOverTime, '${n(s['totalShipments'])}'),
                _Stat(t.rejectionRate, '${(n(s['rejectionRate']) * 100).toStringAsFixed(1)}%'),
              ]),
              const SizedBox(height: 16),
              SizedBox(
                height: 220,
                child: LineChart(
                  LineChartData(
                    minY: 0,
                    maxY: maxY.ceilToDouble() + (maxY < 5 ? 1 : maxY * .2),
                    gridData: FlGridData(drawVerticalLine: false, getDrawingHorizontalLine: (_) => FlLine(color: c.surfaceAlt, strokeWidth: 1)),
                    borderData: FlBorderData(show: false),
                    titlesData: FlTitlesData(
                      topTitles: const AxisTitles(),
                      rightTitles: const AxisTitles(),
                      leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, interval: maxY < 5 ? 1 : null, getTitlesWidget: (v, m) => Text(v.toInt().toString(), style: tt.bodySmall?.copyWith(color: c.inkSoft)))),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          interval: (series.length / 5).ceilToDouble(),
                          getTitlesWidget: (v, m) => Padding(padding: const EdgeInsets.only(top: 6), child: Text('${series[v.toInt()]['day']}'.substring(5), style: tt.bodySmall?.copyWith(color: c.inkSoft))),
                        ),
                      ),
                    ),
                    lineBarsData: [
                      LineChartBarData(spots: spots, isCurved: true, preventCurveOverShooting: true, barWidth: 3, color: c.primary, dotData: const FlDotData(show: false), belowBarData: BarAreaData(show: true, color: c.primary.withValues(alpha: .12))),
                      LineChartBarData(spots: shipSpots, isCurved: true, preventCurveOverShooting: true, barWidth: 2, color: c.amber, dotData: const FlDotData(show: false)),
                    ],
                  ),
                  duration: const Duration(milliseconds: 600),
                ),
              ),
              const SizedBox(height: 10),
              Row(children: [
                _Dot(c.primary, t.kgOverTime),
                const SizedBox(width: 16),
                _Dot(c.amber, t.shipmentsOverTime),
              ]),
            ]);
          },
        ),
      ]),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: tt.bodySmall?.copyWith(color: context.eco.inkSoft)),
      Text(value, style: tt.titleLarge),
    ]);
  }
}

class _Dot extends StatelessWidget {
  const _Dot(this.color, this.label);
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ]);
}
