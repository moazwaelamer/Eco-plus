import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/ui.dart';

class InvoicesPage extends ConsumerWidget {
  const InvoicesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final isAdmin = ref.watch(sessionProvider).value?.role == 'admin';
    final invoices = ref.watch(invoicesProvider);

    return ListView(children: [
      PageHeader(t.invoices),
      AsyncBody<List<Json>>(
        value: invoices,
        onRetry: () => ref.invalidate(invoicesProvider),
        builder: (list) => list.isEmpty
            ? EmptyState(icon: Icons.request_quote_outlined, title: t.nothingYet, body: '')
            : Column(children: [
                for (final (i, inv) in list.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: EcoCard(
                      child: Row(children: [
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Directionality(textDirection: TextDirection.ltr, child: Text('${inv['number']}', style: tt.titleMedium)),
                            Text('${t.due}: ${(inv['dueAt'] as String).substring(0, 10)}', style: tt.bodySmall?.copyWith(color: c.inkSoft)),
                          ]),
                        ),
                        Text('${money(n(inv['total']))} ${t.currency}', style: tt.titleMedium),
                        const SizedBox(width: 14),
                        StatusPill('${inv['status']}'),
                        if (isAdmin && inv['status'] != 'paid')
                          Padding(
                            padding: const EdgeInsetsDirectional.only(start: 10),
                            child: FilledButton(
                              style: FilledButton.styleFrom(minimumSize: const Size(0, 42), padding: const EdgeInsets.symmetric(horizontal: 16)),
                              onPressed: () async {
                                try {
                                  await ref.read(dioProvider).post('/invoices/${inv['id']}/pay');
                                  ref.invalidate(invoicesProvider);
                                } catch (e) {
                                  if (context.mounted) toast(context, ApiError.from(e).message);
                                }
                              },
                              child: Text(t.markPaid),
                            ),
                          ),
                      ]),
                    ).fadeUp(index: i < 8 ? i : 0),
                  ),
              ]),
      ),
      const SizedBox(height: 32),
    ]);
  }
}
