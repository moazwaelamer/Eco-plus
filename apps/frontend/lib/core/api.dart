import 'dart:io' show Platform;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _definedUrl = String.fromEnvironment('API_URL');

/// Local development: the Android emulator reaches the host machine at 10.0.2.2; everything else uses localhost.
String get apiBaseUrl {
  if (_definedUrl.isNotEmpty) return _definedUrl;
  if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

class TokenStore {
  const TokenStore();
  static const _storage = FlutterSecureStorage();

  Future<String?> get access => _storage.read(key: 'access');
  Future<String?> get refresh => _storage.read(key: 'refresh');

  Future<void> save(String access, String refresh) async {
    await _storage.write(key: 'access', value: access);
    await _storage.write(key: 'refresh', value: refresh);
  }

  Future<void> clear() async {
    await _storage.delete(key: 'access');
    await _storage.delete(key: 'refresh');
  }
}

/// The API's one error shape is { code, message, details?, requestId }.
class ApiError implements Exception {
  ApiError(this.status, this.code, this.message);
  final int status;
  final String code;
  final String message;

  bool get isNetwork => status == 0;

  factory ApiError.from(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['code'] is String) {
        return ApiError(e.response?.statusCode ?? 0, data['code'] as String, '${data['message'] ?? ''}');
      }
      return ApiError(e.response?.statusCode ?? 0, 'network', e.message ?? 'network error');
    }
    return ApiError(0, 'unknown', '$e');
  }

  @override
  String toString() => 'ApiError($status $code: $message)';
}

final tokenStoreProvider = Provider((_) => const TokenStore());

/// Called when a refresh fails, so the session can drop back to the login screen.
final sessionExpiredProvider = NotifierProvider<_ExpiredNotifier, int>(_ExpiredNotifier.new);

class _ExpiredNotifier extends Notifier<int> {
  @override
  int build() => 0;
  void fire() => state++;
}

final dioProvider = Provider<Dio>((ref) {
  final tokens = ref.watch(tokenStoreProvider);
  final dio = Dio(BaseOptions(baseUrl: apiBaseUrl, connectTimeout: const Duration(seconds: 10), receiveTimeout: const Duration(seconds: 20)));
  final plain = Dio(BaseOptions(baseUrl: apiBaseUrl)); // no interceptors, used for refresh itself

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await tokens.access;
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
      handler.next(options);
    },
    onError: (e, handler) async {
      final retried = e.requestOptions.extra['retried'] == true;
      final isAuthCall = e.requestOptions.path.startsWith('/auth/');
      if (e.response?.statusCode == 401 && !retried && !isAuthCall) {
        final refresh = await tokens.refresh;
        if (refresh != null) {
          try {
            final res = await plain.post('/auth/refresh', data: {'refreshToken': refresh});
            await tokens.save(res.data['accessToken'] as String, res.data['refreshToken'] as String);
            final opts = e.requestOptions..extra['retried'] = true;
            opts.headers['Authorization'] = 'Bearer ${res.data['accessToken']}';
            return handler.resolve(await dio.fetch(opts));
          } catch (_) {
            await tokens.clear();
            ref.read(sessionExpiredProvider.notifier).fire();
          }
        }
      }
      handler.next(e);
    },
  ));
  return dio;
});
