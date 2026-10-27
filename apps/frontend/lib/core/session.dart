import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api.dart';

class User {
  User({required this.id, required this.name, required this.role, this.phone, this.email});
  final int id;
  final String name;
  final String role;
  final String? phone;
  final String? email;

  factory User.fromJson(Map<String, dynamic> j) =>
      User(id: j['id'] as int, name: j['name'] as String, role: j['role'] as String, phone: j['phone'] as String?, email: j['email'] as String?);

  bool get isCustomer => role == 'citizen' || role == 'business';
}

/// null = logged out. Loading while the saved token is being checked at start-up.
final sessionProvider = AsyncNotifierProvider<SessionNotifier, User?>(SessionNotifier.new);

class SessionNotifier extends AsyncNotifier<User?> {
  @override
  Future<User?> build() async {
    ref.listen(sessionExpiredProvider, (_, _) => state = const AsyncData(null));
    final tokens = ref.read(tokenStoreProvider);
    if (await tokens.access == null) return null;
    try {
      final res = await ref.read(dioProvider).get('/me');
      return User.fromJson(res.data as Map<String, dynamic>);
    } catch (e) {
      final err = ApiError.from(e);
      if (err.status == 401) await tokens.clear();
      // A network problem at start-up should not log the user out; show the login screen and let them retry.
      return null;
    }
  }

  Future<void> login(String identifier, String password) async {
    final res = await ref.read(dioProvider).post('/auth/login', data: {'identifier': identifier, 'password': password});
    final data = res.data as Map<String, dynamic>;
    await ref.read(tokenStoreProvider).save(data['accessToken'] as String, data['refreshToken'] as String);
    state = AsyncData(User.fromJson(data['user'] as Map<String, dynamic>));
  }

  /// Creates the account and logs in with the tokens the API returns.
  Future<void> register(Map<String, dynamic> body) async {
    final res = await ref.read(dioProvider).post('/auth/register', data: body);
    final data = res.data as Map<String, dynamic>;
    await ref.read(tokenStoreProvider).save(data['accessToken'] as String, data['refreshToken'] as String);
    state = AsyncData(User.fromJson(data['user'] as Map<String, dynamic>));
  }

  Future<void> logout() async {
    final tokens = ref.read(tokenStoreProvider);
    final refresh = await tokens.refresh;
    if (refresh != null) {
      try {
        await ref.read(dioProvider).post('/auth/logout', data: {'refreshToken': refresh});
      } catch (_) {}
    }
    await tokens.clear();
    state = const AsyncData(null);
  }
}
