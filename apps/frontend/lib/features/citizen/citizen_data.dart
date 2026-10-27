import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api.dart';

typedef Json = Map<String, dynamic>;

final pointsProvider = FutureProvider.autoDispose<Json>((ref) async {
  final res = await ref.watch(dioProvider).get('/me/points', queryParameters: {'limit': 20});
  return res.data as Json;
});

final shipmentsProvider = FutureProvider.autoDispose<List<Json>>((ref) async {
  final res = await ref.watch(dioProvider).get('/shipments', queryParameters: {'limit': 30});
  return ((res.data as Json)['items'] as List).cast<Json>();
});

final leaderboardProvider = FutureProvider.autoDispose<Json>((ref) async {
  final res = await ref.watch(dioProvider).get('/leaderboard');
  return res.data as Json;
});

final unreadProvider = FutureProvider.autoDispose<int>((ref) async {
  final res = await ref.watch(dioProvider).get('/notifications', queryParameters: {'limit': 1});
  return ((res.data as Json)['unreadCount'] as num?)?.toInt() ?? 0;
});
