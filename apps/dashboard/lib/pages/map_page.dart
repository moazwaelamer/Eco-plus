import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../data.dart';
import '../strings.dart';
import '../widgets/ui.dart';

/// Every shipment on a map, coloured by status. Tiles come from OpenStreetMap, so no API key is needed.
class MapPage extends ConsumerWidget {
  const MapPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final points = ref.watch(pointsProvider);
    Color colorOf(String s) => switch (s) {
          'created' => c.amber,
          'assigned' => c.primary,
          'weighed' => c.inkSoft,
          'rejected' || 'cancelled' => Colors.red.shade700,
          _ => c.primary.withValues(alpha: .6),
        };
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      PageHeader(t.map),
      Expanded(
        child: AsyncBody<List<Json>>(
          value: points,
          onRetry: () => ref.invalidate(pointsProvider),
          skeletonHeight: 400,
          builder: (list) {
            final pts = [for (final p in list) (LatLng(n(p['gpsLat']).toDouble(), n(p['gpsLng']).toDouble()), '${p['status']}')];
            return ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: pts.isEmpty ? const LatLng(30.0444, 31.2357) : pts.first.$1,
                  initialZoom: 11,
                ),
                children: [
                  TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.ecoplus.dashboard'),
                  MarkerLayer(markers: [
                    for (final (pos, status) in pts)
                      Marker(
                        point: pos,
                        width: 34,
                        height: 34,
                        child: Tooltip(message: t.status(status), child: Icon(Icons.location_on_rounded, color: colorOf(status), size: 34)),
                      ),
                  ]),
                ],
              ),
            );
          },
        ),
      ),
    ]);
  }
}
