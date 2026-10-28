import 'package:eco_core/eco_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import 'ui.dart';

/// Turns a record on or off with PATCH `path` { isActive }, then reloads [refresh]. Errors come back as a toast.
class ActiveSwitch extends ConsumerWidget {
  const ActiveSwitch({super.key, required this.value, required this.path, required this.refresh});
  final bool value;
  final String path;
  final FutureProvider<List<Json>> refresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    return Tooltip(
      message: t.activeLabel,
      child: Switch(
        value: value,
        onChanged: (v) async {
          try {
            await ref.read(dioProvider).patch(path, data: {'isActive': v});
            ref.invalidate(refresh);
          } catch (e) {
            final err = ApiError.from(e);
            if (context.mounted) toast(context, err.isNetwork ? t.noConnection : err.message);
          }
        },
      ),
    );
  }
}
