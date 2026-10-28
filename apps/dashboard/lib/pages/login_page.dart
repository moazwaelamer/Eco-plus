import 'package:eco_core/eco_core.dart';
import 'package:eco_ui/eco_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../router.dart';
import '../strings.dart';

const _demo = [
  ('admin@ecoplus.test', Icons.admin_panel_settings_rounded, 'مشرف', 'Admin'),
  ('factory@ecoplus.test', Icons.factory_rounded, 'مصنع', 'Factory'),
  ('employee@ecoplus.test', Icons.scale_rounded, 'موظف', 'Employee'),
];

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _id = TextEditingController();
  final _pw = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _id.dispose();
    _pw.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final t = ref.read(stringsProvider);
    if (_id.text.trim().isEmpty || _pw.text.isEmpty) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(sessionProvider.notifier).login(_id.text.trim(), _pw.text);
      final u = ref.read(sessionProvider).value;
      if (u != null && !dashboardRoles.contains(u.role)) {
        await ref.read(sessionProvider.notifier).logout();
        if (mounted) setState(() => _error = t.notForYou);
      }
    } catch (e) {
      final err = ApiError.from(e);
      if (mounted) setState(() => _error = err.isNetwork ? t.noConnection : (err.status == 401 ? t.wrongCredentials : err.message));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final c = context.eco;
    final tt = Theme.of(context).textTheme;
    final wide = MediaQuery.sizeOf(context).width >= 900;

    final form = Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(28),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Align(alignment: AlignmentDirectional.centerEnd, child: TextButton(onPressed: ref.read(arabicProvider.notifier).toggle, child: Text(t.language))),
            if (!wide) ...[const LogoMark(size: 52, animate: true), const SizedBox(height: 16)],
            Text(t.login, style: tt.headlineLarge).fadeUp(index: 1),
            const SizedBox(height: 4),
            Text(t.loginSub, style: tt.bodyMedium?.copyWith(color: c.inkSoft)).fadeUp(index: 2),
            const SizedBox(height: 24),
            TextField(controller: _id, keyboardType: TextInputType.emailAddress, textInputAction: TextInputAction.next, decoration: InputDecoration(labelText: t.identifier, prefixIcon: const Icon(Icons.alternate_email_rounded))).fadeUp(index: 3),
            const SizedBox(height: 12),
            TextField(controller: _pw, obscureText: true, onSubmitted: (_) => _submit(), decoration: InputDecoration(labelText: t.password, prefixIcon: const Icon(Icons.lock_outline_rounded))).fadeUp(index: 4),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Row(children: [Icon(Icons.error_outline_rounded, size: 18, color: c.danger), const SizedBox(width: 8), Expanded(child: Text(_error!, style: tt.bodyMedium?.copyWith(color: c.danger)))]),
            ],
            const SizedBox(height: 20),
            FilledButton(onPressed: _busy ? null : _submit, child: _busy ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)) : Text(t.login)).fadeUp(index: 5),
            const SizedBox(height: 24),
            Text(t.demo, style: tt.labelLarge?.copyWith(color: c.inkSoft)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final d in _demo)
                ActionChip(
                  avatar: Icon(d.$2, size: 18, color: c.primary),
                  label: Text(t.ar ? d.$3 : d.$4),
                  backgroundColor: c.surface,
                  side: BorderSide(color: c.line),
                  onPressed: () {
                    _id.text = d.$1;
                    _pw.text = 'Test1234!';
                    _submit();
                  },
                ),
            ]).fadeUp(index: 6),
          ]),
        ),
      ),
    );

    return Scaffold(
      body: wide
          ? Row(children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: AuroraBackdrop(
                    borderRadius: 36,
                    padding: const EdgeInsets.all(48),
                    child: SizedBox.expand(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        const LogoMark(size: 64, animate: true),
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Wordmark(size: 56, color: EcoColors.onCanopy).fadeUp(index: 2),
                          const SizedBox(height: 12),
                          Text(t.dashboard, style: tt.headlineSmall?.copyWith(color: EcoColors.onCanopy.withValues(alpha: 0.85), fontWeight: FontWeight.w500)).fadeUp(index: 3),
                        ]),
                      ]),
                    ),
                  ),
                ),
              ),
              Expanded(child: form),
            ])
          : form,
    );
  }
}
