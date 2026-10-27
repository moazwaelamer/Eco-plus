import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/api.dart';
import '../../widgets/common.dart';
import 'citizen_data.dart';

const _materials = ['plastic', 'paper', 'cardboard', 'glass', 'aluminium', 'metal', 'mixed'];

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});
  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  final _picker = ImagePicker();
  XFile? _photo;
  Uint8List? _bytes;
  String _material = 'plastic';
  double _fill = 0.7;
  ({double lat, double lng})? _where;
  bool _locating = false;
  bool _busy = false;
  String? _error;
  Json? _result;

  Future<void> _pick(ImageSource source) async {
    final file = await _picker.pickImage(source: source, maxWidth: 1600, imageQuality: 82);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() {
      _photo = file;
      _bytes = bytes;
    });
  }

  void _photoSheet(S s) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(leading: const Icon(Icons.photo_camera_rounded), title: Text(s.camera), onTap: () { Navigator.pop(ctx); _pick(ImageSource.camera); }),
          ListTile(leading: const Icon(Icons.photo_library_rounded), title: Text(s.gallery), onTap: () { Navigator.pop(ctx); _pick(ImageSource.gallery); }),
        ]),
      ),
    );
  }

  Future<void> _locate() async {
    final s = ref.read(stringsProvider);
    setState(() {
      _locating = true;
      _error = null;
    });
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) throw Exception('denied');
      final p = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 12)));
      setState(() => _where = (lat: p.latitude, lng: p.longitude));
    } catch (_) {
      if (mounted) setState(() => _error = s.locationDenied);
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _submit() async {
    final s = ref.read(stringsProvider);
    if (_where == null) {
      setState(() => _error = s.needLocation);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final dio = ref.read(dioProvider);
    try {
      String? imageUrl;
      if (_bytes != null) {
        final name = _photo!.name.isEmpty ? 'bag.jpg' : _photo!.name;
        final up = await dio.post('/uploads/image', data: FormData.fromMap({'file': MultipartFile.fromBytes(_bytes!, filename: name)}));
        imageUrl = (up.data as Json)['url'] as String;
      }
      final scan = await dio.post('/scans', data: {
        'imageUrl': ?imageUrl,
        'contentType': _material,
        'fillLevel': double.parse(_fill.toStringAsFixed(2)),
        'lat': _where!.lat,
        'lng': _where!.lng,
      });
      final req = await dio.post('/pickup-requests', data: {'scanId': (scan.data as Json)['id']});
      ref.invalidate(shipmentsProvider);
      ref.invalidate(unreadProvider);
      setState(() => _result = req.data as Json);
    } catch (e) {
      final err = ApiError.from(e);
      if (mounted) setState(() => _error = err.isNetwork ? s.noConnection : err.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    if (_result != null) return _ResultView(result: _result!);
    final c = context.eco;
    final t = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: Text(s.scanTitle, style: const TextStyle(fontWeight: FontWeight.w800))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: ListView(padding: const EdgeInsets.fromLTRB(20, 4, 20, 32), children: [
              _label(t, c, s.photo),
              GestureDetector(
                onTap: () => _photoSheet(s),
                child: Container(
                  height: 200,
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(kRadius),
                    border: Border.all(color: c.line, width: 1.5),
                  ),
                  child: _bytes == null
                      ? Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Container(width: 64, height: 64, decoration: BoxDecoration(color: c.accent, shape: BoxShape.circle), child: Icon(Icons.photo_camera_rounded, color: c.onAccent, size: 30)),
                          const SizedBox(height: 12),
                          Text(s.photoHint, style: t.bodyMedium?.copyWith(color: c.inkSoft)),
                        ])
                      : Stack(fit: StackFit.expand, children: [
                          Image.memory(_bytes!, fit: BoxFit.cover),
                          Positioned(
                            bottom: 10,
                            right: 10,
                            left: 10,
                            child: Align(
                              alignment: AlignmentDirectional.centerEnd,
                              child: Chip(avatar: const Icon(Icons.edit_rounded, size: 16), label: Text(s.changePhoto), backgroundColor: c.surface),
                            ),
                          ),
                        ]),
                ),
              ),
              const SizedBox(height: 24),
              _label(t, c, s.material),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final m in _materials)
                  ChoiceChip(
                    label: Text(s.mat(m)),
                    selected: _material == m,
                    showCheckmark: false,
                    selectedColor: c.accent,
                    labelStyle: TextStyle(color: _material == m ? c.onAccent : c.ink, fontWeight: FontWeight.w700),
                    backgroundColor: c.surface,
                    side: BorderSide(color: _material == m ? c.accent : c.line),
                    onSelected: (_) => setState(() => _material = m),
                  ),
              ]),
              const SizedBox(height: 24),
              Row(children: [
                Expanded(child: _label(t, c, s.fillLevel, bottom: 0)),
                Text('${(_fill * 100).round()}%', style: t.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: c.primary)),
              ]),
              Slider(value: _fill, min: 0, max: 1, divisions: 20, onChanged: (v) => setState(() => _fill = v)),
              const SizedBox(height: 16),
              _label(t, c, s.location),
              EcoCard(
                padding: const EdgeInsets.all(14),
                child: Row(children: [
                  Icon(_where == null ? Icons.location_searching_rounded : Icons.check_circle_rounded, color: _where == null ? c.inkSoft : c.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _where == null
                        ? Text(s.needLocation, style: t.bodyMedium?.copyWith(color: c.inkSoft))
                        : Directionality(textDirection: TextDirection.ltr, child: Text('${s.locationSet}\n${_where!.lat.toStringAsFixed(5)}, ${_where!.lng.toStringAsFixed(5)}', style: t.bodyMedium)),
                  ),
                  _locating
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                      : TextButton(onPressed: _locate, child: Text(s.useMyLocation)),
                ]),
              ),
              if (kDebugMode)
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: TextButton.icon(
                    onPressed: () => setState(() => _where = (lat: 30.0444, lng: 31.2357)),
                    icon: const Icon(Icons.bug_report_outlined, size: 18),
                    label: Text(s.testLocation),
                  ),
                ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Row(children: [
                  Icon(Icons.error_outline_rounded, size: 18, color: c.danger),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: t.bodyMedium?.copyWith(color: c.danger))),
                ]),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _busy ? null : _submit,
                child: _busy ? Row(mainAxisSize: MainAxisSize.min, children: [const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5)), const SizedBox(width: 12), Text(s.sending)]) : Text(s.requestPickup),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _label(TextTheme t, EcoColors c, String text, {double bottom = 10}) =>
      Padding(padding: EdgeInsets.only(bottom: bottom), child: Text(text, style: t.titleSmall?.copyWith(fontWeight: FontWeight.w800, color: c.inkSoft)));
}

/// ready and merge produce a shipment with a QR code; wait stores nothing and explains why.
class _ResultView extends ConsumerWidget {
  const _ResultView({required this.result});
  final Json result;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final decision = result['decision'] as String;
    final shipment = result['shipment'] as Json?;
    final waiting = decision == 'wait' || shipment == null;
    final (title, body) = switch (decision) {
      'merge' => (s.resultMerge, s.resultMergeSub),
      'wait' => (s.resultWait, s.resultWaitSub),
      _ => (s.resultReady, s.resultReadySub),
    };

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(color: waiting ? c.amber.withValues(alpha: 0.18) : c.accent, shape: BoxShape.circle),
                  child: Icon(waiting ? Icons.hourglass_bottom_rounded : Icons.check_rounded, size: 44, color: waiting ? c.amber : c.onAccent),
                ),
                const SizedBox(height: 20),
                Text(title, style: t.headlineSmall?.copyWith(fontWeight: FontWeight.w800), textAlign: TextAlign.center),
                const SizedBox(height: 8),
                Text(body, style: t.bodyLarge?.copyWith(color: c.inkSoft), textAlign: TextAlign.center),
                if (!waiting) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                    child: QrImageView(data: shipment['qrCode'] as String, size: 170, backgroundColor: Colors.white),
                  ),
                  const SizedBox(height: 10),
                  Text(s.shipmentCode, style: t.labelMedium?.copyWith(color: c.inkSoft)),
                  Text('${shipment['qrCode']}', style: t.titleLarge?.copyWith(fontWeight: FontWeight.w800, letterSpacing: 1.5)),
                ],
                const SizedBox(height: 28),
                FilledButton(onPressed: () => context.go('/home'), child: Text(waiting ? s.done : s.viewShipments)),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
