import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/session.dart';
import '../../widgets/brand.dart';
import '../../widgets/common.dart';
import '../../widgets/motion.dart';
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
      Expanded(child: Text(s.hello((user?.name ?? '').split(' ').first), style: t.titleLarge, overflow: TextOverflow.ellipsis)),
      IconButton(
        tooltip: s.notificationsTitle,
        onPressed: () => context.push('/notifications').then((_) => ref.invalidate(unreadProvider)),
        icon: Badge(isLabelVisible: unread > 0, label: Text('$unread'), child: Icon(Icons.notifications_none_rounded, color: c.ink)),
      ),
      const SizedBox(width: 8),
      PopupMenuButton<String>(
        icon: Icon(Icons.more_vert_rounded, color: c.ink),
        onSelected: (v) => switch (v) {
          'lang' => ref.read(arabicProvider.notifier).toggle(),
          'theme' => ref.read(themeModeProvider.notifier).cycle(),
          _ => ref.read(sessionProvider.notifier).logout(),
        },
        itemBuilder: (_) => [
          PopupMenuItem(value: 'lang', child: Text(s.language)),
          PopupMenuItem(value: 'theme', child: Text(s.theme)),
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
        const _Header().fadeUp(),
        const SizedBox(height: 20),
        if (user?.role == 'citizen')
          points.when(
            data: (p) => _PointsHero(p).fadeUp(index: 1),
            loading: () => const Skeleton(height: 200, radius: 28),
            error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(pointsProvider)),
          ),
        const SizedBox(height: 16),
        Pressable(
          onTap: () => context.push('/scan'),
          child: IgnorePointer(
            child: FilledButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.photo_camera_rounded),
          label: Text(s.scanBag),
          style: FilledButton.styleFrom(backgroundColor: EcoColors.bloom, foregroundColor: const Color(0xFF0D1B14)),
        ),
          ),
        ).fadeUp(index: 2),
        const SizedBox(height: 28),
        Text(s.shipments, style: t.titleMedium).fadeUp(index: 3),
        const SizedBox(height: 12),
        shipments.when(
          data: (list) => list.isEmpty
              ? EmptyState(icon: Icons.inventory_2_outlined, title: s.noShipments, body: s.noShipmentsSub)
              : Column(children: [for (final (i, sh) in list.take(3).indexed) Padding(padding: const EdgeInsets.only(bottom: 12), child: _ShipmentCard(sh).fadeUp(index: 4 + i))]),
          loading: () => const Skeleton(height: 110),
          error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(shipmentsProvider)),
        ),
      ]),
    );
  }
}

/// Points as a loyalty card: the big number counts up, the ring shows how close the next level is.
class _PointsHero extends ConsumerWidget {
  const _PointsHero(this.p);
  final Json p;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = Theme.of(context).textTheme;
    const on = EcoColors.onCanopy;
    final balance = (p['balance'] as num).toInt();
    final level = p['level'] as Json;
    final next = p['nextLevel'] as Json?;
    final from = (level['minPoints'] as num).toInt();
    final progress = next == null ? 1.0 : ((balance - from) / ((next['minPoints'] as num).toInt() - from)).clamp(0.0, 1.0);

    return AuroraBackdrop(
      borderRadius: 30,
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(color: EcoColors.bloom, borderRadius: BorderRadius.circular(99)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.workspace_premium_rounded, size: 16, color: Color(0xFF0D1B14)),
            const SizedBox(width: 6),
            Text('${s.level} · ${level['name']}', style: t.labelLarge?.copyWith(color: const Color(0xFF0D1B14), fontWeight: FontWeight.w700)),
          ]),
        ),
        const SizedBox(height: 18),
        Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
                TweenAnimationBuilder<double>(
                  tween: Tween(end: balance.toDouble()),
                  duration: const Duration(milliseconds: 1300),
                  curve: Curves.easeOutCubic,
                  builder: (_, v, _) => Text('${v.round()}', style: t.displayMedium?.copyWith(color: on, fontFeatures: const [FontFeature.tabularFigures()])),
                ),
                const SizedBox(width: 8),
                Text(s.points, style: t.titleMedium?.copyWith(color: on.withValues(alpha: 0.75), fontWeight: FontWeight.w500)),
              ]),
              const SizedBox(height: 6),
              Text(next == null ? s.topLevel : s.toNext((next['pointsToGo'] as num).toInt(), '${next['name']}'), style: t.bodyMedium?.copyWith(color: on.withValues(alpha: 0.85))),
            ]),
          ),
          const SizedBox(width: 12),
          ProgressRing(
            value: progress,
            size: 92,
            stroke: 9,
            child: Text('${(progress * 100).round()}%', style: t.titleMedium?.copyWith(color: on, fontWeight: FontWeight.w700)),
          ),
        ]),
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
          Expanded(child: Text(qr, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w700, letterSpacing: 1))),
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
                  Text(code, style: t.headlineMedium?.copyWith(color: c.onAccent, fontWeight: FontWeight.w700, letterSpacing: 6, fontFeatures: const [FontFeature.tabularFigures()])),
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
          Text(qr, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: 2)),
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
        Text(s.shipments, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        shipments.when(
          data: (list) => list.isEmpty
              ? EmptyState(icon: Icons.inventory_2_outlined, title: s.noShipments, body: s.noShipmentsSub)
              : Column(children: [for (final (i, sh) in list.indexed) Padding(padding: const EdgeInsets.only(bottom: 12), child: _ShipmentCard(sh).fadeUp(index: i))]),
          loading: () => const Skeleton(height: 110),
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
        Text(s.pointsTab, style: t.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Text(s.leaderboard, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
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
                      child: Text('${e['rank']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                    title: Text(e['isMe'] == true ? '${e['name']} · ${s.you}' : '${e['name']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text('${e['level']}'),
                    trailing: Text('${e['points']}', style: t.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  ),
              ]),
            );
          },
          loading: () => const Skeleton(height: 160),
          error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(leaderboardProvider)),
        ),
        const SizedBox(height: 24),
        Text(s.history, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
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
                    trailing: Text('+${i['points']}', style: t.titleMedium?.copyWith(color: c.primary, fontWeight: FontWeight.w700)),
                  ),
              ]),
            );
          },
          loading: () => const Skeleton(height: 160),
          error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(pointsProvider)),
        ),
      ]),
    );
  }
}
