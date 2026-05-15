import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureTokenStorage {
  SecureTokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  static const _tokenKey = 'auth_token';
  static const _userEmailKey = 'user_email';
  static const _userRoleKey = 'user_role';
  static const _userDepartmentKey = 'user_department';

  final FlutterSecureStorage _storage;

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> saveSession({
    required String token,
    required String email,
    required String role,
    required String department,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _userEmailKey, value: email);
    await _storage.write(key: _userRoleKey, value: role);
    await _storage.write(key: _userDepartmentKey, value: department);
  }

  Future<Map<String, String?>> readUser() async {
    return {
      'email': await _storage.read(key: _userEmailKey),
      'role': await _storage.read(key: _userRoleKey),
      'department': await _storage.read(key: _userDepartmentKey),
    };
  }

  Future<void> clear() => _storage.deleteAll();
}
