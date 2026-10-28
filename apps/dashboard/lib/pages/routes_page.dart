import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/ui.dart';

class RoutesPage extends ConsumerWidget {
  const RoutesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final routes = ref.watch(routesProvider);

    return ListView(children: [
      PageHeader(t.routes),
      AsyncBody<List<Json>>(
        value: routes,
        onRetry: () => ref.invalidate(routesProvider),
        builder: (list) => list.isEmpty
            ? EmptyState(icon: Icons.route_outlined, title: t.nothingYet, body: '')
            : Column(children: [
                for (final (i, r) in list.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: EcoCard(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Icon(Icons.local_shipping_rounded, color: c.primary),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text('${((r['driver'] as Json)['user'] as Json)['name']} · ${(r['routeDate'] as String).substring(0, 10)}', style: tt.titleMedium),
                          ),
                          StatusPill('${r['status']}'),
                          if (r['status'] == 'planned')
                            IconButton(
                              tooltip: t.cancelRoute,
                              icon: Icon(Icons.delete_outline_rounded, color: c.danger),
                              onPressed: () async {
                                try {
                                  await ref.read(dioProvider).delete('/routes/${r['id']}');
                                  ref.invalidate(routesProvider);
                                  ref.invalidate(shipmentsByStatus);
                                } catch (e) {
                                  if (context.mounted) toast(context, ApiError.from(e).message);
                                }
                              },
                            ),
                        ]),
                        const SizedBox(height: 10),
                        Wrap(spacing: 8, runSpacing: 8, children: [
                          for (final s in (r['stops'] as List).cast<Json>())
                            Chip(
                              avatar: CircleAvatar(
                                backgroundColor: s['collectedAt'] != null ? c.primary : c.surfaceAlt,
                                foregroundColor: s['collectedAt'] != null ? c.onPrimary : c.ink,
                                child: s['collectedAt'] != null ? const Icon(Icons.check, size: 14) : Text('${s['stopOrder']}', style: const TextStyle(fontSize: 12)),
                              ),
                              label: Directionality(textDirection: TextDirection.ltr, child: Text('${(s['shipment'] as Json)['qrCode']}')),
                            ),
                        ]),
                      ]),
                    ).fadeUp(index: i < 8 ? i : 0),
                  ),
              ]),
      ),
      const SizedBox(height: 32),
    ]);
  }
}
