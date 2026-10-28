import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/form_dialog.dart';
import '../widgets/ui.dart';

/// Admin: the factories that buy and the materials that are collected, with their point factors and prices.
class SetupPage extends ConsumerWidget {
  const SetupPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final tt = Theme.of(context).textTheme;
    final c = context.eco;

    Widget section(String title, String addLabel, VoidCallback onAdd, Widget body) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(title, style: tt.titleLarge)),
            FilledButton.icon(style: FilledButton.styleFrom(minimumSize: const Size(0, 44)), onPressed: onAdd, icon: const Icon(Icons.add_rounded), label: Text(addLabel)),
          ]),
          const SizedBox(height: 12),
          body,
        ]);

    Widget row(String title, String detail, int i) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: EcoCard(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Row(children: [
              Expanded(child: Text(title, style: tt.titleMedium)),
              Flexible(child: Text(detail, style: TextStyle(color: c.inkSoft), overflow: TextOverflow.ellipsis)),
            ]),
          ).fadeUp(index: i < 8 ? i + 1 : 0),
        );

    return ListView(children: [
      PageHeader(t.setup),
      section(
        t.factories,
        t.addFactory,
        () => showFormDialog(context, ref, t, t.addFactory, [FormFieldSpec('name', t.fullName), FormFieldSpec('contact', t.contact), FormFieldSpec('address', t.address)], '/factories', factoriesProvider),
        AsyncBody<List<Json>>(
          value: ref.watch(factoriesProvider),
          onRetry: () => ref.invalidate(factoriesProvider),
          builder: (list) => list.isEmpty
              ? EmptyState(icon: Icons.factory_outlined, title: t.nothingYet, body: '')
              : Column(children: [for (final (i, f) in list.indexed) row('${f['name']}', '${f['contact'] ?? ''}', i)]),
        ),
      ),
      const SizedBox(height: 28),
      section(
        t.materials,
        t.addMaterial,
        () => showFormDialog(context, ref, t, t.addMaterial, [FormFieldSpec('name', t.fullName), FormFieldSpec('pointFactor', t.pointFactor, number: true), FormFieldSpec('pricePerKg', t.pricePerKg, number: true)], '/materials', materialsProvider),
        AsyncBody<List<Json>>(
          value: ref.watch(materialsProvider),
          onRetry: () => ref.invalidate(materialsProvider),
          builder: (list) => Column(children: [for (final (i, m) in list.indexed) row('${m['name']}', '${t.pointFactor} ${n(m['pointFactor'])} · ${n(m['pricePerKg'])} ${t.currency}/${t.kg}', i)]),
        ),
      ),
      const SizedBox(height: 32),
    ]);
  }
}
