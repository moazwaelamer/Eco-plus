import 'package:eco_core/eco_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'pages/catalog_page.dart';
import 'pages/invoices_page.dart';
import 'pages/login_page.dart';
import 'pages/orders_page.dart';
import 'pages/overview_page.dart';
import 'pages/routes_page.dart';
import 'pages/shipments_page.dart';
import 'pages/fleet_page.dart';
import 'pages/map_page.dart';
import 'pages/stock_page.dart';
import 'shell.dart';

/// Roles that use the dashboard. Customers and drivers use the mobile app.
const dashboardRoles = {'admin', 'employee', 'factory'};

String homeFor(User u) => switch (u.role) {
      'admin' => '/overview',
      'factory' => '/catalog',
      _ => '/stock',
    };

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(sessionProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  Page<void> page(GoRouterState st, Widget child) => CustomTransitionPage<void>(
        key: ValueKey(st.uri.path),
        child: child,
        transitionDuration: const Duration(milliseconds: 260),
        transitionsBuilder: (_, a, _, c) => FadeTransition(opacity: CurvedAnimation(parent: a, curve: Curves.easeOutCubic), child: c),
      );

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final session = ref.read(sessionProvider);
      if (session.isLoading) return null;
      final user = session.value;
      final loc = state.matchedLocation;
      if (user == null || !dashboardRoles.contains(user.role)) return loc == '/login' ? null : '/login';
      if (loc == '/login' || loc == '/') return homeFor(user);
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, _) => const Scaffold(body: Center(child: CircularProgressIndicator()))),
      GoRoute(path: '/login', pageBuilder: (_, st) => page(st, const LoginPage())),
      ShellRoute(
        builder: (_, state, child) => DashboardShell(location: state.uri.path, child: child),
        routes: [
          GoRoute(path: '/overview', pageBuilder: (_, st) => page(st, const OverviewPage())),
          GoRoute(path: '/shipments', pageBuilder: (_, st) => page(st, const ShipmentsPage())),
          GoRoute(path: '/routes', pageBuilder: (_, st) => page(st, const RoutesPage())),
          GoRoute(path: '/orders', pageBuilder: (_, st) => page(st, const OrdersPage())),
          GoRoute(path: '/invoices', pageBuilder: (_, st) => page(st, const InvoicesPage())),
          GoRoute(path: '/fleet', pageBuilder: (_, st) => page(st, const FleetPage())),
          GoRoute(path: '/map', pageBuilder: (_, st) => page(st, const MapPage())),
          GoRoute(path: '/stock', pageBuilder: (_, st) => page(st, const StockPage())),
          GoRoute(path: '/catalog', pageBuilder: (_, st) => page(st, const CatalogPage())),
        ],
      ),
    ],
  );
});
