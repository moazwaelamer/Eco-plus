import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/api.dart';
import '../../core/session.dart';
import '../../widgets/common.dart';

/// Demo accounts exist only in a database filled by the development seed.
const _demo = [
  ('citizen@ecoplus.test', Icons.person_rounded, 'عميل', 'Citizen'),
  ('driver@ecoplus.test', Icons.local_shipping_rounded, 'سائق', 'Driver'),
  ('employee@ecoplus.test', Icons.scale_rounded, 'موظف', 'Employee'),
  ('admin@ecoplus.test', Icons.admin_panel_settings_rounded, 'مشرف', 'Admin'),
  ('factory@ecoplus.test', Icons.factory_rounded, 'مصنع', 'Factory'),
];
const _demoPassword = 'Test1234!';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _id = TextEditingController();
  final _pw = TextEditingController();
  bool _busy = false;
  bool _hide = true;
  String? _error;

  @override
  void dispose() {
    _id.dispose();
    _pw.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final s = ref.read(stringsProvider);
    if (_id.text.trim().isEmpty || _pw.text.isEmpty) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(sessionProvider.notifier).login(_id.text.trim(), _pw.text);
    } catch (e) {
      final err = ApiError.from(e);
      if (mounted) setState(() => _error = err.isNetwork ? s.noConnection : (err.status == 401 ? s.wrongCredentials : err.message));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final c = context.eco;
    final t = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: TextButton(onPressed: ref.read(arabicProvider.notifier).toggle, child: Text(s.language)),
                ),
                const SizedBox(height: 8),
                // Hero: the brand on a deep green panel with a lime leaf, so the first screen already feels like the product.
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [c.primary, Color.lerp(c.primary, Colors.black, 0.35)!],
                    ),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const LogoMark(size: 52),
                    const SizedBox(height: 28),
                    Text(s.appName, style: t.displaySmall?.copyWith(color: c.onPrimary, fontWeight: FontWeight.w800, height: 1.1)),
                    const SizedBox(height: 6),
                    Text(s.tagline, style: t.titleMedium?.copyWith(color: c.onPrimary.withValues(alpha: 0.85))),
                  ]),
                ),
                const SizedBox(height: 28),
                Text(s.welcomeBack, style: t.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(s.loginSub, style: t.bodyMedium?.copyWith(color: c.inkSoft)),
                const SizedBox(height: 20),
                TextField(
                  controller: _id,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.username],
                  decoration: InputDecoration(labelText: s.identifier, prefixIcon: const Icon(Icons.alternate_email_rounded)),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _pw,
                  obscureText: _hide,
                  onSubmitted: (_) => _submit(),
                  autofillHints: const [AutofillHints.password],
                  decoration: InputDecoration(
                    labelText: s.password,
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    suffixIcon: IconButton(icon: Icon(_hide ? Icons.visibility_rounded : Icons.visibility_off_rounded), onPressed: () => setState(() => _hide = !_hide)),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Row(children: [
                    Icon(Icons.error_outline_rounded, size: 18, color: c.danger),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!, style: t.bodyMedium?.copyWith(color: c.danger))),
                  ]),
                ],
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)) : Text(s.login),
                ),
                const SizedBox(height: 28),
                Text(s.tryDemo, style: t.labelLarge?.copyWith(color: c.inkSoft)),
                const SizedBox(height: 10),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (final d in _demo)
                    ActionChip(
                      avatar: Icon(d.$2, size: 18, color: c.primary),
                      label: Text(s.ar ? d.$3 : d.$4),
                      backgroundColor: c.surface,
                      side: BorderSide(color: c.line),
                      onPressed: () {
                        _id.text = d.$1;
                        _pw.text = _demoPassword;
                        _submit();
                      },
                    ),
                ]),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
