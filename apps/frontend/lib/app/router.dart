import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/session.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/citizen/citizen_shell.dart';
import '../features/citizen/scan_screen.dart';
import '../features/driver/driver_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/staff/staff_screen.dart';
import '../features/staff/weigh_screen.dart';

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
      GoRoute(path: '/', pageBuilder: (_, st) => _page(st, const _Splash())),
      GoRoute(path: '/login', pageBuilder: (_, st) => _page(st, const LoginScreen())),
      GoRoute(path: '/register', pageBuilder: (_, st) => _page(st, const RegisterScreen())),
      GoRoute(path: '/home', pageBuilder: (_, st) => _page(st, const CitizenShell())),
      GoRoute(path: '/scan', pageBuilder: (_, st) => _page(st, const ScanScreen(), rise: true)),
      GoRoute(path: '/notifications', pageBuilder: (_, st) => _page(st, const NotificationsScreen(), rise: true)),
      GoRoute(path: '/driver', pageBuilder: (_, st) => _page(st, const DriverScreen())),
      GoRoute(path: '/weigh', pageBuilder: (_, st) => _page(st, const WeighScreen())),
      GoRoute(path: '/staff', pageBuilder: (_, st) => _page(st, const StaffScreen())),
    ],
  );
});

/// Screens fade in; screens opened on top (like the scan flow) also rise a little.
CustomTransitionPage<void> _page(GoRouterState state, Widget child, {bool rise = false}) => CustomTransitionPage<void>(
      key: state.pageKey,
      child: child,
      transitionDuration: const Duration(milliseconds: 360),
      reverseTransitionDuration: const Duration(milliseconds: 240),
      transitionsBuilder: (context, animation, secondary, child) {
        final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
        return FadeTransition(
          opacity: curved,
          child: rise ? SlideTransition(position: Tween(begin: const Offset(0, 0.06), end: Offset.zero).animate(curved), child: child) : child,
        );
      },
    );

String homeFor(User user) => switch (user.role) {
      'citizen' || 'business' => '/home',
      'driver' => '/driver',
      'employee' => '/weigh',
      _ => '/staff',
    };

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: CircularProgressIndicator()));
}
