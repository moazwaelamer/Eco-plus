import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/ui.dart';

class ShipmentsPage extends ConsumerStatefulWidget {
  const ShipmentsPage({super.key});
  @override
  ConsumerState<ShipmentsPage> createState() => _ShipmentsPageState();
}

class _ShipmentsPageState extends ConsumerState<ShipmentsPage> {
  String? _status = 'created';
  final _selected = <int>{};
  int? _driver;
  int? _vehicle;
  String _date = todayIso();
  bool _busy = false;

  Future<void> _create() async {
    final t = ref.read(stringsProvider);
    if (_selected.isEmpty) return toast(context, t.pickShipments);
    if (_driver == null || _vehicle == null) return toast(context, t.pickDriverVehicle);
    setState(() => _busy = true);
    try {
      await ref.read(dioProvider).post('/routes', data: {'driverId': _driver, 'vehicleId': _vehicle, 'routeDate': _date, 'shipmentIds': _selected.toList()});
      if (!mounted) return;
      setState(_selected.clear);
      ref.invalidate(shipmentsByStatus);
      ref.invalidate(routesProvider);
      toast(context, t.routeCreated);
    } catch (e) {
      if (mounted) toast(context, ApiError.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final list = ref.watch(shipmentsByStatus(_status));
    final drivers = ref.watch(driversProvider);
    final vehicles = ref.watch(vehiclesProvider);
    final wide = MediaQuery.sizeOf(context).width >= 1000;

    final listView = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Wrap(spacing: 8, children: [
        for (final s in <String?>['created', 'assigned', 'collected', null])
          ChoiceChip(
            label: Text(s == null ? t.all : t.status(s)),
            selected: _status == s,
            showCheckmark: false,
            selectedColor: EcoColors.bloom,
            labelStyle: TextStyle(color: _status == s ? const Color(0xFF0D1B14) : c.ink, fontWeight: FontWeight.w600),
            onSelected: (_) => setState(() {
              _status = s;
              _selected.clear();
            }),
          ),
      ]),
      const SizedBox(height: 16),
      AsyncBody<List<Json>>(
        value: list,
        onRetry: () => ref.invalidate(shipmentsByStatus),
        builder: (items) => items.isEmpty
            ? EmptyState(icon: Icons.inventory_2_outlined, title: t.nothingYet, body: '')
            : Column(children: [
                for (final (i, s) in items.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: EcoCard(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Row(children: [
                        if (s['status'] == 'created')
                          Checkbox(value: _selected.contains(s['id']), onChanged: (v) => setState(() => v == true ? _selected.add(s['id'] as int) : _selected.remove(s['id']))),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Directionality(textDirection: TextDirection.ltr, child: Text('${s['qrCode']}', style: tt.titleSmall?.copyWith(letterSpacing: 0.8))),
                            Text('${((s['request'] as Json)['scan'] as Json)['contentType']} · ${t.fill} ${(n(((s['request'] as Json)['scan'] as Json)['fillLevel']) * 100).round()}%', style: tt.bodySmall?.copyWith(color: c.inkSoft)),
                          ]),
                        ),
                        StatusPill('${s['status']}'),
                        const SizedBox(width: 6),
                      ]),
                    ).fadeUp(index: i < 8 ? i : 0),
                  ),
              ]),
      ),
    ]);

    final planner = EcoCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(t.planRoute, style: tt.titleLarge),
        const SizedBox(height: 4),
        Text(t.selected(_selected.length), style: tt.bodyMedium?.copyWith(color: c.inkSoft)),
        const SizedBox(height: 16),
        drivers.when(
          data: (d) => d.isEmpty
              ? Text(t.noDrivers, style: TextStyle(color: c.amber))
              : DropdownButtonFormField<int>(
                  initialValue: _driver,
                  decoration: InputDecoration(labelText: t.driver),
                  items: [for (final x in d) DropdownMenuItem(value: x['userId'] as int, child: Text('${(x['user'] as Json)['name']}'))],
                  onChanged: (v) => setState(() => _driver = v),
                ),
          loading: () => const Skeleton(height: 56, radius: 16),
          error: (_, _) => const SizedBox(),
        ),
        const SizedBox(height: 12),
        vehicles.when(
          data: (v) => DropdownButtonFormField<int>(
            initialValue: _vehicle,
            decoration: InputDecoration(labelText: t.vehicle),
            items: [for (final x in v.where((x) => x['isActive'] == true)) DropdownMenuItem(value: x['id'] as int, child: Directionality(textDirection: TextDirection.ltr, child: Text('${x['plate']}')))],
            onChanged: (x) => setState(() => _vehicle = x),
          ),
          loading: () => const Skeleton(height: 56, radius: 16),
          error: (_, _) => const SizedBox(),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () async {
            final picked = await showDatePicker(context: context, initialDate: DateTime.parse(_date), firstDate: DateTime.now().subtract(const Duration(days: 1)), lastDate: DateTime.now().add(const Duration(days: 60)));
            if (picked != null) setState(() => _date = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}');
          },
          icon: const Icon(Icons.event_rounded),
          label: Text('${t.date}: $_date'),
        ),
        const SizedBox(height: 16),
        FilledButton(onPressed: _busy ? null : _create, child: _busy ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)) : Text(t.createRoute)),
      ]),
    );

    return ListView(children: [
      PageHeader(t.shipments),
      if (wide)
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: listView), const SizedBox(width: 20), SizedBox(width: 340, child: planner)])
      else ...[planner, const SizedBox(height: 20), listView],
      const SizedBox(height: 32),
    ]);
  }
}
