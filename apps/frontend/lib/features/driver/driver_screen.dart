import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/api.dart';
import '../../core/session.dart';
import '../../widgets/common.dart';

typedef Json = Map<String, dynamic>;

final driverRoutesProvider = FutureProvider.autoDispose<List<Json>>((ref) async {
  final res = await ref.watch(dioProvider).get('/driver/routes');
  return ((res.data as Json)['routes'] as List).cast<Json>();
});

class DriverScreen extends ConsumerWidget {
  const DriverScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final user = ref.watch(sessionProvider).value;
    final routes = ref.watch(driverRoutesProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(driverRoutesProvider),
          child: ListView(padding: const EdgeInsets.fromLTRB(20, 12, 20, 24), children: [
            Row(children: [
              const LogoMark(size: 40),
              const SizedBox(width: 12),
              Expanded(child: Text(s.hello((user?.name ?? '').split(' ').first), style: t.titleLarge?.copyWith(fontWeight: FontWeight.w800))),
              IconButton(icon: Icon(Icons.translate_rounded, color: c.ink), onPressed: ref.read(arabicProvider.notifier).toggle),
              IconButton(icon: Icon(Icons.logout_rounded, color: c.ink), onPressed: ref.read(sessionProvider.notifier).logout),
            ]),
            const SizedBox(height: 20),
            Text(s.today, style: t.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            routes.when(
              data: (list) => list.isEmpty
                  ? EmptyState(icon: Icons.route_rounded, title: s.noRoute, body: s.noRouteSub)
                  : Column(children: [for (final r in list) _RouteCard(r)]),
              loading: () => const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator())),
              error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(driverRoutesProvider)),
            ),
          ]),
        ),
      ),
    );
  }
}

class _RouteCard extends ConsumerWidget {
  const _RouteCard(this.route);
  final Json route;

  Future<void> _start(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(dioProvider).post('/driver/routes/${route['id']}/start');
      ref.invalidate(driverRoutesProvider);
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiError.from(e).message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final stops = (route['stops'] as List).cast<Json>();
    final status = route['status'] as String;
    final vehicle = route['vehicle'] as Json;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      EcoCard(
        color: c.primary,
        child: Row(children: [
          Icon(Icons.local_shipping_rounded, color: c.onPrimary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Directionality(textDirection: TextDirection.ltr, child: Text('${vehicle['plate']}', style: t.titleMedium?.copyWith(color: c.onPrimary, fontWeight: FontWeight.w800))),
              Text(s.stops(stops.length), style: t.bodyMedium?.copyWith(color: c.onPrimary.withValues(alpha: 0.85))),
            ]),
          ),
          if (status == 'planned')
            FilledButton(
              onPressed: () => _start(context, ref),
              style: FilledButton.styleFrom(backgroundColor: c.accent, foregroundColor: c.onAccent, minimumSize: const Size(0, 44)),
              child: Text(s.startRoute),
            ),
        ]),
      ),
      const SizedBox(height: 12),
      for (final stop in stops) _StopTile(stop: stop, canCollect: status == 'in_progress'),
    ]);
  }
}

class _StopTile extends ConsumerWidget {
  const _StopTile({required this.stop, required this.canCollect});
  final Json stop;
  final bool canCollect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final customer = stop['customer'] as Json;
    final done = stop['collectedAt'] != null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: EcoCard(
        child: Row(children: [
          CircleAvatar(
            backgroundColor: done ? c.primary : c.surfaceAlt,
            foregroundColor: done ? c.onPrimary : c.ink,
            child: done ? const Icon(Icons.check_rounded) : Text('${stop['stopOrder']}', style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${customer['name']}', style: t.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              if (customer['phone'] != null)
                Directionality(textDirection: TextDirection.ltr, child: Text('${customer['phone']}', style: t.bodyMedium?.copyWith(color: c.inkSoft))),
            ]),
          ),
          if (canCollect && !done)
            FilledButton(
              onPressed: () => _collect(context, ref),
              style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
              child: Text(s.collect),
            ),
        ]),
      ),
    );
  }

  Future<void> _collect(BuildContext context, WidgetRef ref) async {
    final s = ref.read(stringsProvider);
    final code = await showDialog<String>(context: context, builder: (_) => _CodeDialog(s: s));
    if (code == null || !context.mounted) return;
    try {
      final res = await ref.read(dioProvider).post('/driver/stops/${stop['shipmentId']}/collect', data: {'handoverCode': code});
      ref.invalidate(driverRoutesProvider);
      if (context.mounted && (res.data as Json)['routeFinished'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.routeFinished)));
      }
    } catch (e) {
      final err = ApiError.from(e);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err.code == 'wrong_handover_code' ? s.wrongCode : err.message)));
    }
  }
}

/// Big digits for big thumbs: the driver types a 6 digit code, often outdoors and one-handed.
class _CodeDialog extends StatefulWidget {
  const _CodeDialog({required this.s});
  final S s;
  @override
  State<_CodeDialog> createState() => _CodeDialogState();
}

class _CodeDialogState extends State<_CodeDialog> {
  final _ctrl = TextEditingController();
  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.s.enterCode),
      content: TextField(
        controller: _ctrl,
        autofocus: true,
        keyboardType: TextInputType.number,
        maxLength: 6,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.headlineMedium?.copyWith(letterSpacing: 8, fontWeight: FontWeight.w800),
        onChanged: (_) => setState(() {}),
        decoration: const InputDecoration(counterText: ''),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(widget.s.cancel)),
        FilledButton(
          onPressed: _ctrl.text.length == 6 ? () => Navigator.pop(context, _ctrl.text) : null,
          style: FilledButton.styleFrom(minimumSize: const Size(110, 44)),
          child: Text(widget.s.confirm),
        ),
      ],
    );
  }
}
