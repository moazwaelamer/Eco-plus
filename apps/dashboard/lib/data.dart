import 'package:eco_core/eco_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

typedef Json = Map<String, dynamic>;

List<Json> _items(Object? data) => ((data as Json)['items'] as List).cast<Json>();

String todayIso() {
  final n = DateTime.now();
  return '${n.year.toString().padLeft(4, '0')}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
}

FutureProvider<List<Json>> listProvider(String path, {Map<String, dynamic>? query}) =>
    FutureProvider.autoDispose<List<Json>>((ref) async => _items((await ref.watch(dioProvider).get(path, queryParameters: {'limit': 50, ...?query})).data));

final shipmentsByStatus = FutureProvider.autoDispose.family<List<Json>, String?>((ref, status) async =>
    _items((await ref.watch(dioProvider).get('/shipments', queryParameters: {'limit': 50, 'status': ?status})).data));

final driversProvider = listProvider('/drivers');
final vehiclesProvider = listProvider('/vehicles');
final ordersProvider = listProvider('/orders');
final invoicesProvider = listProvider('/invoices');
final routesTodayProvider = FutureProvider.autoDispose<List<Json>>((ref) async =>
    _items((await ref.watch(dioProvider).get('/routes', queryParameters: {'limit': 50, 'date': todayIso()})).data));
final routesProvider = listProvider('/routes');

final stockProvider = FutureProvider.autoDispose<Json>((ref) async => (await ref.watch(dioProvider).get('/warehouse/stock')).data as Json);
final catalogProvider = FutureProvider.autoDispose<List<Json>>((ref) async => _items((await ref.watch(dioProvider).get('/catalog')).data));

num n(Object? v) => v is num ? v : num.tryParse('$v') ?? 0;
