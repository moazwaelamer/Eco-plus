import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/session.dart';
import '../../widgets/common.dart';
import 'citizen_data.dart';

class CitizenShell extends ConsumerStatefulWidget {
  const CitizenShell({super.key});
  @override
  ConsumerState<CitizenShell> createState() => _CitizenShellState();
}

class _CitizenShellState extends ConsumerState<CitizenShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final user = ref.watch(sessionProvider).value;
    final earnsPoints = user?.role == 'citizen';
    final pages = [const _HomeTab(), const _ShipmentsTab(), if (earnsPoints) const _PointsTab()];
    if (_index >= pages.length) _index = 0;

    return Scaffold(
      body: SafeArea(child: AnimatedSwitcher(duration: const Duration(milliseconds: 200), child: KeyedSubtree(key: ValueKey(_index), child: pages[_index]))),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home_rounded), label: s.home),
          NavigationDestination(icon: const Icon(Icons.local_shipping_outlined), selectedIcon: const Icon(Icons.local_shipping_rounded), label: s.shipments),
          if (earnsPoints) NavigationDestination(icon: const Icon(Icons.emoji_events_outlined), selectedIcon: const Icon(Icons.emoji_events_rounded), label: s.pointsTab),
        ],
      ),
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final user = ref.watch(sessionProvider).value;
    final unread = ref.watch(unreadProvider).value ?? 0;
    final t = Theme.of(context).textTheme;
    return Row(children: [
      const LogoMark(size: 40),
      const SizedBox(width: 12),
      Expanded(child: Text(s.hello((user?.name ?? '').split(' ').first), style: t.titleLarge?.copyWith(fontWeight: FontWeight.w800), overflow: TextOverflow.ellipsis)),
      Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: Icon(Icons.notifications_none_rounded, color: c.ink)),
      const SizedBox(width: 8),
      PopupMenuButton<String>(
        icon: Icon(Icons.more_vert_rounded, color: c.ink),
        onSelected: (v) => v == 'lang' ? ref.read(arabicProvider.notifier).toggle() : ref.read(sessionProvider.notifier).logout(),
        itemBuilder: (_) => [
          PopupMenuItem(value: 'lang', child: Text(s.language)),
          PopupMenuItem(value: 'out', child: Text(s.logout)),
        ],
      ),
    ]);
  }
}

class _HomeTab extends ConsumerWidget {
  const _HomeTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final user = ref.watch(sessionProvider).value;
    final points = ref.watch(pointsProvider);
    final shipments = ref.watch(shipmentsProvider);
    final t = Theme.of(context).textTheme;

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(pointsProvider);
        ref.invalidate(shipmentsProvider);
        ref.invalidate(unreadProvider);
      },
      child: ListView(padding: const EdgeInsets.fromLTRB(20, 12, 20, 24), children: [
        const _Header(),
        const SizedBox(height: 20),
        if (user?.role == 'citizen')
          points.when(
            data: (p) => _PointsHero(p),
            loading: () => const _Skeleton(height: 190),
            error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(pointsProvider)),
          ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: () => context.push('/scan'),
          icon: const Icon(Icons.photo_camera_rounded),
          label: Text(s.scanBag),
          style: FilledButton.styleFrom(backgroundColor: context.eco.accent, foregroundColor: context.eco.onAccent),
        ),
        const SizedBox(height: 28),
        Text(s.shipments, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        shipments.when(
          data: (list) => list.isEmpty
              ? EmptyState(icon: Icons.inventory_2_outlined, title: s.noShipments, body: s.noShipmentsSub)
              : Column(children: [for (final sh in list.take(3)) Padding(padding: const EdgeInsets.only(bottom: 12), child: _ShipmentCard(sh))]),
          loading: () => const _Skeleton(height: 110),
          error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(shipmentsProvider)),
        ),
      ]),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton({required this.height});
  final double height;
  @override
  Widget build(BuildContext context) =>
      Container(height: height, decoration: BoxDecoration(color: context.eco.surfaceAlt, borderRadius: BorderRadius.circular(kRadius)));
}

/// Points as a loyalty card: the big number, the level, and how far the next level is.
class _PointsHero extends ConsumerWidget {
  const _PointsHero(this.p);
  final Json p;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final balance = (p['balance'] as num).toInt();
    final level = p['level'] as Json;
    final next = p['nextLevel'] as Json?;
    final from = (level['minPoints'] as num).toInt();
    final progress = next == null ? 1.0 : ((balance - from) / ((next['minPoints'] as num).toInt() - from)).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [c.primary, Color.lerp(c.primary, Colors.black, 0.4)!]),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: c.accent, borderRadius: BorderRadius.circular(99)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.workspace_premium_rounded, size: 16, color: c.onAccent),
              const SizedBox(width: 6),
              Text('${s.level} · ${level['name']}', style: t.labelLarge?.copyWith(color: c.onAccent, fontWeight: FontWeight.w800)),
            ]),
          ),
        ]),
        const SizedBox(height: 18),
        Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
          TweenAnimationBuilder<double>(
            tween: Tween(end: balance.toDouble()),
            duration: const Duration(milliseconds: 900),
            curve: Curves.easeOutCubic,
            builder: (_, v, _) => Text('${v.round()}', style: t.displayMedium?.copyWith(color: c.onPrimary, fontWeight: FontWeight.w800, height: 1, fontFeatures: const [FontFeature.tabularFigures()])),
          ),
          const SizedBox(width: 8),
          Text(s.points, style: t.titleMedium?.copyWith(color: c.onPrimary.withValues(alpha: 0.8))),
        ]),
        const SizedBox(height: 20),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(value: progress, minHeight: 10, backgroundColor: Colors.white.withValues(alpha: 0.18), valueColor: AlwaysStoppedAnimation(c.accent)),
        ),
        const SizedBox(height: 10),
        Text(
          next == null ? s.topLevel : s.toNext((next['pointsToGo'] as num).toInt(), '${next['name']}'),
          style: t.bodyMedium?.copyWith(color: c.onPrimary.withValues(alpha: 0.85)),
        ),
      ]),
    );
  }
}

class _ShipmentCard extends ConsumerWidget {
  const _ShipmentCard(this.sh);
  final Json sh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final status = sh['status'] as String;
    final code = sh['handoverCode'] as String?;
    final qr = sh['qrCode'] as String;
    final showCode = status == 'assigned' && code != null;

    return EcoCard(
      onTap: () => _showQr(context, qr, s),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(qr, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w800, letterSpacing: 1))),
          StatusChip(status),
        ]),
        if (showCode) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: c.accent, borderRadius: BorderRadius.circular(16)),
            child: Row(children: [
              Icon(Icons.key_rounded, color: c.onAccent),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(s.handoverCode, style: t.labelMedium?.copyWith(color: c.onAccent)),
                  Text(code, style: t.headlineMedium?.copyWith(color: c.onAccent, fontWeight: FontWeight.w800, letterSpacing: 6, fontFeatures: const [FontFeature.tabularFigures()])),
                ]),
              ),
              IconButton(
                icon: Icon(Icons.copy_rounded, color: c.onAccent),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: code));
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.copied)));
                },
              ),
            ]),
          ),
          const SizedBox(height: 8),
          Text(s.giveCode, style: t.bodySmall?.copyWith(color: c.inkSoft)),
        ],
      ]),
    );
  }

  void _showQr(BuildContext context, String qr, S s) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
            child: QrImageView(data: qr, size: 220, backgroundColor: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(qr, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, letterSpacing: 2)),
        ]),
      ),
    );
  }
}

class _ShipmentsTab extends ConsumerWidget {
  const _ShipmentsTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final shipments = ref.watch(shipmentsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(shipmentsProvider),
      child: ListView(padding: const EdgeInsets.fromLTRB(20, 16, 20, 24), children: [
        Text(s.shipments, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 16),
        shipments.when(
          data: (list) => list.isEmpty
              ? EmptyState(icon: Icons.inventory_2_outlined, title: s.noShipments, body: s.noShipmentsSub)
              : Column(children: [for (final sh in list) Padding(padding: const EdgeInsets.only(bottom: 12), child: _ShipmentCard(sh))]),
          loading: () => const _Skeleton(height: 110),
          error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(shipmentsProvider)),
        ),
      ]),
    );
  }
}

class _PointsTab extends ConsumerWidget {
  const _PointsTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final points = ref.watch(pointsProvider);
    final board = ref.watch(leaderboardProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(pointsProvider);
        ref.invalidate(leaderboardProvider);
      },
      child: ListView(padding: const EdgeInsets.fromLTRB(20, 16, 20, 24), children: [
        Text(s.pointsTab, style: t.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 16),
        Text(s.leaderboard, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        board.when(
          data: (b) {
            final entries = ((b['entries'] ?? b['top'] ?? const []) as List).cast<Json>();
            return EcoCard(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(children: [
                for (final e in entries)
                  ListTile(
                    leading: CircleAvatar(
                      backgroundColor: e['isMe'] == true ? c.accent : c.surfaceAlt,
                      foregroundColor: e['isMe'] == true ? c.onAccent : c.ink,
                      child: Text('${e['rank']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                    ),
                    title: Text(e['isMe'] == true ? '${e['name']} · ${s.you}' : '${e['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text('${e['level']}'),
                    trailing: Text('${e['points']}', style: t.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  ),
              ]),
            );
          },
          loading: () => const _Skeleton(height: 160),
          error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(leaderboardProvider)),
        ),
        const SizedBox(height: 24),
        Text(s.history, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        points.when(
          data: (p) {
            final items = ((p['history'] as Json)['items'] as List).cast<Json>();
            if (items.isEmpty) return EmptyState(icon: Icons.stars_outlined, title: s.noHistory, body: s.noShipmentsSub);
            return EcoCard(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(children: [
                for (final i in items)
                  ListTile(
                    leading: Icon(Icons.add_circle_rounded, color: c.primary),
                    title: Text('${(i['weighing'] as Json?)?['materialType']?['name'] ?? ''}'),
                    subtitle: Text('${(i['weighing'] as Json?)?['actualWeightKg'] ?? ''} kg'),
                    trailing: Text('+${i['points']}', style: t.titleMedium?.copyWith(color: c.primary, fontWeight: FontWeight.w800)),
                  ),
              ]),
            );
          },
          loading: () => const _Skeleton(height: 160),
          error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(pointsProvider)),
        ),
      ]),
    );
  }
}
