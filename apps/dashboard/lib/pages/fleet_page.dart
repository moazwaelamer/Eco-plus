import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/form_dialog.dart';
import '../widgets/ui.dart';

/// Admin: the people and trucks that routes are planned with.
class FleetPage extends ConsumerWidget {
  const FleetPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final tt = Theme.of(context).textTheme;
    final c = context.eco;
    final drivers = ref.watch(driversProvider);
    final vehicles = ref.watch(vehiclesProvider);

    Widget section(String title, String addLabel, VoidCallback onAdd, Widget body) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(title, style: tt.titleLarge)),
            FilledButton.icon(style: FilledButton.styleFrom(minimumSize: const Size(0, 44)), onPressed: onAdd, icon: const Icon(Icons.add_rounded), label: Text(addLabel)),
          ]),
          const SizedBox(height: 12),
          body,
        ]);

    return ListView(children: [
      PageHeader(t.fleet),
      section(
        t.drivers,
        t.addDriver,
        () => _addDriver(context, ref, t),
        AsyncBody<List<Json>>(
          value: drivers,
          onRetry: () => ref.invalidate(driversProvider),
          builder: (list) => list.isEmpty
              ? EmptyState(icon: Icons.badge_outlined, title: t.noDrivers, body: '')
              : Column(children: [
                  for (final (i, d) in list.indexed)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: EcoCard(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        child: Row(children: [
                          Expanded(child: Text('${(d['user'] as Json?)?['name'] ?? ''}', style: tt.titleMedium)),
                          Text('${d['licenseNo']}', style: TextStyle(color: c.inkSoft)),
                          const SizedBox(width: 12),
                          StatusPill('${d['status']}'),
                        ]),
                      ).fadeUp(index: i < 8 ? i + 1 : 0),
                    ),
                ]),
        ),
      ),
      const SizedBox(height: 28),
      section(
        t.vehicles,
        t.addVehicle,
        () => _addVehicle(context, ref, t),
        AsyncBody<List<Json>>(
          value: vehicles,
          onRetry: () => ref.invalidate(vehiclesProvider),
          builder: (list) => list.isEmpty
              ? EmptyState(icon: Icons.local_shipping_outlined, title: t.nothingYet, body: '')
              : Column(children: [
                  for (final (i, v) in list.indexed)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: EcoCard(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        child: Row(children: [
                          Expanded(child: Text('${v['plate']}', style: tt.titleMedium)),
                          Text('${v['type']} · ${n(v['capacityKg'])} ${t.kg}', style: TextStyle(color: c.inkSoft)),
                        ]),
                      ).fadeUp(index: i < 8 ? i + 1 : 0),
                    ),
                ]),
        ),
      ),
      const SizedBox(height: 32),
    ]);
  }

  Future<void> _addDriver(BuildContext context, WidgetRef ref, T t) => showFormDialog(context, ref, t, t.addDriver, [
        FormFieldSpec('name', t.fullName),
        FormFieldSpec('phone', t.phone, keyboard: TextInputType.phone),
        FormFieldSpec('password', t.password, obscure: true),
        FormFieldSpec('licenseNo', t.licenseNo),
      ], '/drivers', driversProvider);

  Future<void> _addVehicle(BuildContext context, WidgetRef ref, T t) => showFormDialog(context, ref, t, t.addVehicle, [
        FormFieldSpec('plate', t.plate),
        FormFieldSpec('type', t.vehicleType),
        FormFieldSpec('capacityKg', t.capacityKg, number: true),
      ], '/vehicles', vehiclesProvider);
}
