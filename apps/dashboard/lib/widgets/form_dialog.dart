import 'package:eco_core/eco_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data.dart';
import '../strings.dart';
import 'ui.dart';

/// A small create form: one text field per spec, POSTed as JSON to [path]; API errors show inside the dialog.
Future<void> showFormDialog(BuildContext context, WidgetRef ref, T t, String title, List<FormFieldSpec> fields, String path, FutureProvider<List<Json>> refresh) async {
  final ctrls = {for (final f in fields) f.key: TextEditingController()};
  String? error;
  var busy = false;
  // The controllers are not disposed here: the dialog is still animating out when this future completes.
  await showDialog<void>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: Text(title),
        content: SizedBox(
          width: 380,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              for (final f in fields)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: TextField(controller: ctrls[f.key], obscureText: f.obscure, keyboardType: f.keyboard, decoration: InputDecoration(labelText: f.label)),
                ),
              if (error != null) Text(error!, style: TextStyle(color: Colors.red.shade700)),
            ]),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(t.cancel)),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size(96, 44)),
            onPressed: busy
                ? null
                : () async {
                    setState(() {
                      busy = true;
                      error = null;
                    });
                    try {
                      final body = <String, dynamic>{};
                      for (final f in fields) {
                        final v = ctrls[f.key]!.text.trim();
                        if (v.isEmpty) continue;
                        body[f.key] = f.number ? num.tryParse(v) : v;
                      }
                      await ref.read(dioProvider).post(path, data: body);
                      ref.invalidate(refresh);
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (context.mounted) toast(context, t.saved);
                    } catch (e) {
                      final err = ApiError.from(e);
                      setState(() {
                        busy = false;
                        error = err.isNetwork ? t.noConnection : err.message;
                      });
                    }
                  },
            child: Text(t.save),
          ),
        ],
      ),
    ),
  );
}

class FormFieldSpec {
  const FormFieldSpec(this.key, this.label, {this.obscure = false, this.number = false, this.keyboard});
  final String key;
  final String label;
  final bool obscure;
  final bool number;
  final TextInputType? keyboard;
}
