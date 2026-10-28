import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'strings.dart';

class _Nav {
  const _Nav(this.path, this.icon, this.label);
  final String path;
  final IconData icon;
  final String Function(T) label;
}

final _all = <String, List<_Nav>>{
  'admin': [
    _Nav('/overview', Icons.space_dashboard_rounded, (t) => t.overview),
    _Nav('/shipments', Icons.local_shipping_rounded, (t) => t.shipments),
    _Nav('/routes', Icons.route_rounded, (t) => t.routes),
    _Nav('/orders', Icons.receipt_long_rounded, (t) => t.orders),
    _Nav('/invoices', Icons.request_quote_rounded, (t) => t.invoices),
    _Nav('/fleet', Icons.directions_car_rounded, (t) => t.fleet),
    _Nav('/map', Icons.map_rounded, (t) => t.map),
    _Nav('/stock', Icons.warehouse_rounded, (t) => t.stock),
  ],
  'factory': [
    _Nav('/catalog', Icons.storefront_rounded, (t) => t.catalog),
    _Nav('/orders', Icons.receipt_long_rounded, (t) => t.orders),
    _Nav('/invoices', Icons.request_quote_rounded, (t) => t.invoices),
  ],
  'employee': [_Nav('/stock', Icons.warehouse_rounded, (t) => t.stock)],
};

class DashboardShell extends ConsumerWidget {
  const DashboardShell({super.key, required this.location, required this.child});
  final String location;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final user = ref.watch(sessionProvider).value;
    final items = _all[user?.role] ?? const [];
    final wide = MediaQuery.sizeOf(context).width >= 900;

    final sidebar = _Sidebar(items: items, location: location, user: user, t: t);
    if (wide) {
      return Scaffold(
        body: Row(children: [
          SizedBox(width: 260, child: sidebar),
          Expanded(child: _Content(child: child)),
        ]),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Wordmark(size: 22), actions: const [SizedBox(width: 8)]),
      drawer: Drawer(width: 280, child: sidebar),
      body: _Content(child: child),
    );
  }
}

class _Content extends StatelessWidget {
  const _Content({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 1180), child: Padding(padding: const EdgeInsets.fromLTRB(24, 24, 24, 0), child: child)),
        ),
      );
}

class _Sidebar extends ConsumerWidget {
  const _Sidebar({required this.items, required this.location, required this.user, required this.t});
  final List<_Nav> items;
  final String location;
  final User? user;
  final T t;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    return Container(
      decoration: BoxDecoration(color: c.surface, border: BorderDirectional(end: BorderSide(color: c.line))),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 24),
              child: Row(children: [
                const LogoMark(size: 36),
                const SizedBox(width: 12),
                Wordmark(size: 24, color: c.ink, accent: c.primary),
              ]),
            ),
            for (final (i, n) in items.indexed)
              _NavTile(
                nav: n,
                label: n.label(t),
                selected: location.startsWith(n.path),
                onTap: () {
                  if (Scaffold.maybeOf(context)?.isDrawerOpen ?? false) Navigator.pop(context);
                  context.go(n.path);
                },
              ).fadeUp(index: i),
            const Spacer(),
            Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(user?.name ?? '', style: tt.titleSmall, overflow: TextOverflow.ellipsis),
                  Text(user?.role ?? '', style: tt.bodySmall?.copyWith(color: c.inkSoft)),
                ]),
              ),
              IconButton(tooltip: t.language, icon: const Icon(Icons.translate_rounded), onPressed: ref.read(arabicProvider.notifier).toggle),
              IconButton(tooltip: t.theme, icon: const Icon(Icons.brightness_6_rounded), onPressed: ref.read(themeModeProvider.notifier).cycle),
              IconButton(tooltip: t.logout, icon: const Icon(Icons.logout_rounded), onPressed: ref.read(sessionProvider.notifier).logout),
            ]),
          ]),
        ),
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  const _NavTile({required this.nav, required this.label, required this.selected, required this.onTap});
  final _Nav nav;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.eco;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Pressable(
        onTap: onTap,
        scale: 0.98,
        child: AnimatedContainer(
          duration: Motion.base,
          curve: Motion.curve,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(color: selected ? EcoColors.bloom : Colors.transparent, borderRadius: BorderRadius.circular(14)),
          child: Row(children: [
            Icon(nav.icon, size: 22, color: selected ? const Color(0xFF0D1B14) : c.inkSoft),
            const SizedBox(width: 12),
            Text(label, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: selected ? const Color(0xFF0D1B14) : c.ink, fontWeight: selected ? FontWeight.w700 : FontWeight.w600)),
          ]),
        ),
      ),
    );
  }
}
