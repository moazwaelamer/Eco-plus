import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/api.dart';
import '../../widgets/brand.dart';
import '../../widgets/common.dart';
import '../../widgets/motion.dart';

typedef Json = Map<String, dynamic>;

final notificationsProvider = FutureProvider.autoDispose<List<Json>>((ref) async {
  final res = await ref.watch(dioProvider).get('/notifications', queryParameters: {'limit': 50});
  return ((res.data as Json)['items'] as List).cast<Json>();
});

/// Newest first; unread ones are marked and a tap marks one as read.
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final list = ref.watch(notificationsProvider);

    Future<void> markAll() async {
      await ref.read(dioProvider).post('/notifications/read-all');
      ref.invalidate(notificationsProvider);
    }

    Future<void> markOne(Json n) async {
      if (n['isRead'] == true) return;
      await ref.read(dioProvider).patch('/notifications/${n['id']}/read');
      ref.invalidate(notificationsProvider);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(s.notificationsTitle),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
        actions: [TextButton(onPressed: markAll, child: Text(s.markAllRead))],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsProvider),
        child: list.when(
          data: (items) => items.isEmpty
              ? ListView(children: [EmptyState(icon: Icons.notifications_none_rounded, title: s.noNotifications, body: s.noNotificationsSub)])
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final n = items[i];
                    final unread = n['isRead'] != true;
                    return Pressable(
                      onTap: () => markOne(n),
                      child: EcoCard(
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Container(
                            margin: const EdgeInsets.only(top: 6),
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(shape: BoxShape.circle, color: unread ? c.primary : Colors.transparent),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('${n['title']}', style: t.titleSmall?.copyWith(fontWeight: unread ? FontWeight.w700 : FontWeight.w500)),
                              const SizedBox(height: 4),
                              Text('${n['body']}', style: t.bodyMedium?.copyWith(color: c.inkSoft)),
                            ]),
                          ),
                        ]),
                      ).fadeUp(index: i < 8 ? i : 0),
                    );
                  },
                ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorState(error: e, onRetry: () => ref.invalidate(notificationsProvider))]),
        ),
      ),
    );
  }
}
