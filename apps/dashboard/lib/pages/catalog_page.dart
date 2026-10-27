import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/ui.dart';

class CatalogPage extends ConsumerStatefulWidget {
  const CatalogPage({super.key});
  @override
  ConsumerState<CatalogPage> createState() => _CatalogPageState();
}

class _CatalogPageState extends ConsumerState<CatalogPage> {
  final _qty = <String, TextEditingController>{};
  bool _busy = false;

  TextEditingController _ctrl(String key) => _qty.putIfAbsent(key, TextEditingController.new);

  @override
  void dispose() {
    for (final c in _qty.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _order(List<Json> items) async {
    final t = ref.read(stringsProvider);
    final lines = <Json>[];
    for (final it in items) {
      final q = double.tryParse(_ctrl('${it['materialTypeId']}|${it['grade']}').text.trim());
      if (q != null && q > 0) lines.add({'materialTypeId': it['materialTypeId'], 'grade': it['grade'], 'quantityKg': q});
    }
    if (lines.isEmpty) return toast(context, t.cartEmpty);
    setState(() => _busy = true);
    try {
      await ref.read(dioProvider).post('/orders', data: {'items': lines});
      if (!mounted) return;
      for (final c in _qty.values) {
        c.clear();
      }
      ref.invalidate(catalogProvider);
      ref.invalidate(ordersProvider);
      toast(context, t.orderPlaced);
    } catch (e) {
      final err = ApiError.from(e);
      if (mounted) toast(context, err.code == 'insufficient_stock' ? t.insufficient : err.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final catalog = ref.watch(catalogProvider);

    return ListView(children: [
      PageHeader(t.catalog),
      AsyncBody<List<Json>>(
        value: catalog,
        onRetry: () => ref.invalidate(catalogProvider),
        builder: (items) => items.isEmpty
            ? EmptyState(icon: Icons.storefront_outlined, title: t.nothingYet, body: '')
            : Column(children: [
                for (final (i, it) in items.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: EcoCard(
                      child: Row(children: [
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('${it['material']} · ${it['grade']}', style: tt.titleMedium),
                            const SizedBox(height: 2),
                            Text('${t.availableKg}: ${n(it['availableKg'])} ${t.kg}  ·  ${money(n(it['pricePerKg']))} ${t.currency}/${t.kg}', style: tt.bodySmall?.copyWith(color: c.inkSoft)),
                          ]),
                        ),
                        SizedBox(
                          width: 150,
                          child: TextField(
                            controller: _ctrl('${it['materialTypeId']}|${it['grade']}'),
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            textAlign: TextAlign.center,
                            decoration: InputDecoration(labelText: t.quantity, contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12)),
                          ),
                        ),
                      ]),
                    ).fadeUp(index: i < 8 ? i : 0),
                  ),
                const SizedBox(height: 8),
                FilledButton.icon(
                  onPressed: _busy ? null : () => _order(items),
                  icon: const Icon(Icons.shopping_bag_rounded),
                  label: _busy ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)) : Text(t.placeOrder),
                ),
              ]),
      ),
      const SizedBox(height: 32),
    ]);
  }
}
