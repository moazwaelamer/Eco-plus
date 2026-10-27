import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/session.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/citizen/citizen_shell.dart';
import '../features/citizen/scan_screen.dart';
import '../features/driver/driver_screen.dart';
import '../features/staff/staff_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(sessionProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final session = ref.read(sessionProvider);
      if (session.isLoading) return null;
      final user = session.value;
      final atLogin = state.matchedLocation == '/login';
      final atRegister = state.matchedLocation == '/register';
      if (user == null) return atLogin || atRegister ? null : '/login';
      return atLogin || atRegister || state.matchedLocation == '/' ? homeFor(user) : null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, _) => const _Splash()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/home', builder: (_, _) => const CitizenShell()),
      GoRoute(path: '/scan', builder: (_, _) => const ScanScreen()),
      GoRoute(path: '/driver', builder: (_, _) => const DriverScreen()),
      GoRoute(path: '/staff', builder: (_, _) => const StaffScreen()),
    ],
  );
});

String homeFor(User user) => switch (user.role) {
      'citizen' || 'business' => '/home',
      'driver' => '/driver',
      _ => '/staff',
    };

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: CircularProgressIndicator()));
}
