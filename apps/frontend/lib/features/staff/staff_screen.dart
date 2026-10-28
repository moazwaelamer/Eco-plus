import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/session.dart';
import '../../widgets/brand.dart';

/// Admin, employee and factory work from the web dashboard (not built yet). The mobile app is honest about that.
class StaffScreen extends ConsumerWidget {
  const StaffScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final user = ref.watch(sessionProvider).value;
    final c = context.eco;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const LogoMark(size: 56),
              const SizedBox(height: 20),
              Text(s.hello(user?.name ?? ''), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text('${user?.role}', style: TextStyle(color: c.inkSoft)),
              EmptyState(icon: Icons.dashboard_customize_rounded, title: s.staffTitle, body: s.staffBody),
              OutlinedButton.icon(onPressed: ref.read(sessionProvider.notifier).logout, icon: const Icon(Icons.logout_rounded), label: Text(s.logout)),
            ]),
          ),
        ),
      ),
    );
  }
}
