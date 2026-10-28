import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/api.dart';
import '../../core/session.dart';
import '../../widgets/brand.dart';
import '../../widgets/common.dart';

typedef Json = Map<String, dynamic>;

final materialsProvider = FutureProvider.autoDispose<List<Json>>((ref) async => ((await ref.watch(dioProvider).get('/materials')).data as List).cast<Json>());

/// Employee: find a shipment by its QR code, then accept it with material, weight and grade, or reject it with a reason.
class WeighScreen extends ConsumerStatefulWidget {
  const WeighScreen({super.key});

  @override
  ConsumerState<WeighScreen> createState() => _WeighScreenState();
}

class _WeighScreenState extends ConsumerState<WeighScreen> {
  final _qr = TextEditingController();
  final _weight = TextEditingController();
  final _grade = TextEditingController(text: 'A');
  final _reason = TextEditingController();
  Json? _shipment;
  int? _materialId;
  bool _accept = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_qr, _weight, _grade, _reason]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _run(Future<void> Function() job) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await job();
    } catch (e) {
      final err = ApiError.from(e);
      if (mounted) setState(() => _error = err.isNetwork ? ref.read(stringsProvider).noConnection : err.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _find() => _run(() async {
        final res = await ref.read(dioProvider).get('/shipments/by-qr/${Uri.encodeComponent(_qr.text.trim())}');
        setState(() => _shipment = res.data as Json);
      });

  Future<void> _collect() => _run(() async {
        await ref.read(dioProvider).post('/shipments/${_shipment!['id']}/collect');
        await _refreshShipment();
      });

  Future<void> _refreshShipment() async {
    final res = await ref.read(dioProvider).get('/shipments/${_shipment!['id']}');
    setState(() => _shipment = res.data as Json);
  }

  Future<void> _save() => _run(() async {
        final kg = double.tryParse(_weight.text.trim().replaceAll(',', '.'));
        await ref.read(dioProvider).post('/shipments/${_shipment!['id']}/weigh', data: {
          'actualWeightKg': ?kg,
          'accepted': _accept,
          if (_accept) 'materialTypeId': _materialId,
          if (_accept && _grade.text.trim().isNotEmpty) 'grade': _grade.text.trim(),
          if (!_accept) 'rejectReason': _reason.text.trim(),
        });
        await _refreshShipment();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ref.read(stringsProvider).weighedOk)));
      });

  void _reset() => setState(() {
        _shipment = null;
        _qr.clear();
        _weight.clear();
        _reason.clear();
        _materialId = null;
        _accept = true;
        _error = null;
      });

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    final status = _shipment?['status'] as String?;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: ListView(padding: const EdgeInsets.fromLTRB(20, 12, 20, 24), children: [
              Row(children: [
                const LogoMark(size: 40),
                const SizedBox(width: 12),
                Expanded(child: Text(s.weighTitle, style: t.titleLarge?.copyWith(fontWeight: FontWeight.w800))),
                IconButton(icon: Icon(Icons.translate_rounded, color: c.ink), onPressed: ref.read(arabicProvider.notifier).toggle),
                IconButton(icon: Icon(Icons.logout_rounded, color: c.ink), onPressed: ref.read(sessionProvider.notifier).logout),
              ]),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(
                  child: TextField(controller: _qr, enabled: _shipment == null, textCapitalization: TextCapitalization.characters, decoration: InputDecoration(labelText: s.qrCode), onSubmitted: (_) => _find()),
                ),
                const SizedBox(width: 10),
                FilledButton(style: FilledButton.styleFrom(minimumSize: const Size(96, 56)), onPressed: _busy || _shipment != null ? null : _find, child: Text(s.findShipment)),
              ]),
              if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: TextStyle(color: Colors.red.shade700))),
              if (_shipment != null) ...[
                const SizedBox(height: 20),
                EcoCard(
                  child: Row(children: [
                    Expanded(child: Text('#${_shipment!['id']}  ${_shipment!['qrCode']}', style: t.titleMedium)),
                    StatusChip(status ?? ''),
                  ]),
                ),
                const SizedBox(height: 16),
                if (status == 'weighed' || status == 'rejected')
                  _Done(text: s.alreadyWeighed, again: s.weighAnother, onAgain: _reset)
                else if (status != 'collected')
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(s.notCollectedYet, style: TextStyle(color: c.inkSoft)),
                    const SizedBox(height: 12),
                    if (status == 'created') FilledButton(onPressed: _busy ? null : _collect, child: Text(s.markCollected)),
                  ])
                else
                  _Form(
                    s: s,
                    accept: _accept,
                    busy: _busy,
                    materialId: _materialId,
                    weight: _weight,
                    grade: _grade,
                    reason: _reason,
                    onAccept: (v) => setState(() => _accept = v),
                    onMaterial: (v) => setState(() => _materialId = v),
                    onSave: _save,
                  ),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}

class _Form extends ConsumerWidget {
  const _Form({required this.s, required this.accept, required this.busy, required this.materialId, required this.weight, required this.grade, required this.reason, required this.onAccept, required this.onMaterial, required this.onSave});
  final S s;
  final bool accept;
  final bool busy;
  final int? materialId;
  final TextEditingController weight;
  final TextEditingController grade;
  final TextEditingController reason;
  final ValueChanged<bool> onAccept;
  final ValueChanged<int?> onMaterial;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materials = ref.watch(materialsProvider);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      SegmentedButton<bool>(
        segments: [ButtonSegment(value: true, label: Text(s.acceptShipment), icon: const Icon(Icons.check_rounded)), ButtonSegment(value: false, label: Text(s.rejectShipment), icon: const Icon(Icons.close_rounded))],
        selected: {accept},
        onSelectionChanged: (v) => onAccept(v.first),
      ),
      const SizedBox(height: 16),
      TextField(controller: weight, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: s.weightKg)),
      const SizedBox(height: 12),
      if (accept) ...[
        materials.when(
          data: (list) => DropdownButtonFormField<int>(
            initialValue: materialId,
            decoration: InputDecoration(labelText: s.materialLabel),
            items: [for (final m in list) DropdownMenuItem(value: m['id'] as int, child: Text('${m['name']}'))],
            onChanged: onMaterial,
          ),
          loading: () => const LinearProgressIndicator(),
          error: (e, _) => ErrorState(error: e, onRetry: () => ref.invalidate(materialsProvider)),
        ),
        const SizedBox(height: 12),
        TextField(controller: grade, textCapitalization: TextCapitalization.characters, decoration: InputDecoration(labelText: s.grade)),
      ] else
        TextField(controller: reason, decoration: InputDecoration(labelText: s.rejectReason)),
      const SizedBox(height: 20),
      FilledButton(onPressed: busy ? null : onSave, child: Text(s.saveWeighing)),
    ]);
  }
}

class _Done extends StatelessWidget {
  const _Done({required this.text, required this.again, required this.onAgain});
  final String text;
  final String again;
  final VoidCallback onAgain;

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(text, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        OutlinedButton(onPressed: onAgain, child: Text(again)),
      ]);
}
