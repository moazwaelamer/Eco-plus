import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/strings.dart';
import '../../app/theme.dart';
import '../../core/api.dart';
import '../../core/session.dart';
import '../../widgets/brand.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _pw = TextEditingController();
  final _bizName = TextEditingController();
  final _bizType = TextEditingController();
  bool _business = false;
  bool _hide = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _pw, _bizName, _bizType]) {
      c.dispose();
    }
    super.dispose();
  }

  // Same rules as the API, so the user hears about a mistake before sending.
  String? _vName(String? v, S s) => (v ?? '').trim().length < 2 ? s.errName : null;
  String? _vPhone(String? v, S s) => RegExp(r'^\+?[0-9]{8,15}$').hasMatch((v ?? '').trim()) ? null : s.errPhone;
  String? _vEmail(String? v, S s) {
    final t = (v ?? '').trim();
    return t.isEmpty || RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(t) ? null : s.errEmail;
  }

  String? _vPassword(String? v, S s) {
    final t = v ?? '';
    return t.length >= 8 && t.length <= 72 && RegExp(r'[A-Za-z]').hasMatch(t) && RegExp(r'[0-9]').hasMatch(t) ? null : s.errPassword;
  }

  String? _vRequired(String? v, S s) => (v ?? '').trim().length < 2 ? s.errRequired : null;

  Future<void> _submit() async {
    final s = ref.read(stringsProvider);
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(sessionProvider.notifier).register({
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
        if (_email.text.trim().isNotEmpty) 'email': _email.text.trim().toLowerCase(),
        'password': _pw.text,
        'role': _business ? 'business' : 'citizen',
        if (_business) 'businessName': _bizName.text.trim(),
        if (_business) 'businessType': _bizType.text.trim(),
      });
    } catch (e) {
      final err = ApiError.from(e);
      if (mounted) setState(() => _error = err.isNetwork ? s.noConnection : (err.status == 409 ? s.errConflict : err.message));
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
      appBar: AppBar(actions: [TextButton(onPressed: ref.read(arabicProvider.notifier).toggle, child: Text(s.language))]),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _form,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const LogoMark(size: 48),
                  const SizedBox(height: 16),
                  Text(s.createAccount, style: t.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(s.registerSub, style: t.bodyMedium?.copyWith(color: c.inkSoft)),
                  const SizedBox(height: 20),
                  Text(s.accountType, style: t.labelLarge?.copyWith(color: c.inkSoft)),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: SegmentedButton<bool>(
                      segments: [
                        ButtonSegment(value: false, icon: const Icon(Icons.person_rounded), label: Text(s.citizen)),
                        ButtonSegment(value: true, icon: const Icon(Icons.storefront_rounded), label: Text(s.business)),
                      ],
                      selected: {_business},
                      showSelectedIcon: false,
                      onSelectionChanged: (v) => setState(() => _business = v.first),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(controller: _name, textInputAction: TextInputAction.next, validator: (v) => _vName(v, s), decoration: InputDecoration(labelText: s.fullName, prefixIcon: const Icon(Icons.badge_outlined))),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    textDirection: TextDirection.ltr,
                    validator: (v) => _vPhone(v, s),
                    decoration: InputDecoration(labelText: s.phone, prefixIcon: const Icon(Icons.phone_outlined)),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    textDirection: TextDirection.ltr,
                    validator: (v) => _vEmail(v, s),
                    decoration: InputDecoration(labelText: s.email, prefixIcon: const Icon(Icons.alternate_email_rounded)),
                  ),
                  if (_business) ...[
                    const SizedBox(height: 12),
                    TextFormField(controller: _bizName, textInputAction: TextInputAction.next, validator: (v) => _vRequired(v, s), decoration: InputDecoration(labelText: s.businessName, prefixIcon: const Icon(Icons.store_outlined))),
                    const SizedBox(height: 12),
                    TextFormField(controller: _bizType, textInputAction: TextInputAction.next, validator: (v) => _vRequired(v, s), decoration: InputDecoration(labelText: s.businessType, prefixIcon: const Icon(Icons.category_outlined))),
                  ],
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pw,
                    obscureText: _hide,
                    validator: (v) => _vPassword(v, s),
                    onFieldSubmitted: (_) => _submit(),
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
                    child: _busy ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)) : Text(s.createAccount),
                  ),
                  const SizedBox(height: 8),
                  Center(child: TextButton(onPressed: () => context.go('/login'), child: Text(s.haveAccount))),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
