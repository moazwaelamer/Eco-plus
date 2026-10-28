import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
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

  Future<void> _addDriver(BuildContext context, WidgetRef ref, T t) => _form(context, ref, t, t.addDriver, [
        _Field('name', t.fullName),
        _Field('phone', t.phone, keyboard: TextInputType.phone),
        _Field('password', t.password, obscure: true),
        _Field('licenseNo', t.licenseNo),
      ], '/drivers', driversProvider);

  Future<void> _addVehicle(BuildContext context, WidgetRef ref, T t) => _form(context, ref, t, t.addVehicle, [
        _Field('plate', t.plate),
        _Field('type', t.vehicleType),
        _Field('capacityKg', t.capacityKg, number: true),
      ], '/vehicles', vehiclesProvider);

  Future<void> _form(BuildContext context, WidgetRef ref, T t, String title, List<_Field> fields, String path, FutureProvider<List<Json>> refresh) async {
    final ctrls = {for (final f in fields) f.key: TextEditingController()};
    String? error;
    var busy = false;
    // The controllers are not disposed here: the dialog is still animating out when this future completes.
    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text(title),
          content: SizedBox(
            width: 380,
            child: SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                for (final f in fields)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: TextField(controller: ctrls[f.key], obscureText: f.obscure, keyboardType: f.keyboard, decoration: InputDecoration(labelText: f.label)),
                  ),
                if (error != null) Text(error!, style: TextStyle(color: Colors.red.shade700)),
              ]),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: Text(t.cancel)),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size(96, 44)),
              onPressed: busy
                  ? null
                  : () async {
                      setState(() {
                        busy = true;
                        error = null;
                      });
                      try {
                        final body = <String, dynamic>{};
                        for (final f in fields) {
                          final v = ctrls[f.key]!.text.trim();
                          if (v.isEmpty) continue;
                          body[f.key] = f.number ? num.tryParse(v) : v;
                        }
                        await ref.read(dioProvider).post(path, data: body);
                        ref.invalidate(refresh);
                        if (ctx.mounted) Navigator.pop(ctx);
                        if (context.mounted) toast(context, t.saved);
                      } catch (e) {
                        final err = ApiError.from(e);
                        setState(() {
                          busy = false;
                          error = err.isNetwork ? t.noConnection : err.message;
                        });
                      }
                    },
              child: Text(t.save),
            ),
          ],
        ),
      ),
    );
  }
}

class _Field {
  const _Field(this.key, this.label, {this.obscure = false, this.number = false, this.keyboard});
  final String key;
  final String label;
  final bool obscure;
  final bool number;
  final TextInputType? keyboard;
}
