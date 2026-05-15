import 'package:flutter/foundation.dart';

import '../../core/storage/secure_token_storage.dart';
import 'auth_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({
    required AuthService authService,
    required SecureTokenStorage tokenStorage,
  })  : _authService = authService,
        _tokenStorage = tokenStorage;

  final AuthService _authService;
  final SecureTokenStorage _tokenStorage;

  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _email;
  String? _role;
  String? _department;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get email => _email;
  String? get role => _role;
  String? get department => _department;
  String? get error => _error;

  Future<void> bootstrap() async {
    final token = await _tokenStorage.readToken();
    if (token == null || token.isEmpty) return;

    final user = await _tokenStorage.readUser();
    _email = user['email'];
    _role = user['role'];
    _department = user['department'];
    _isAuthenticated = true;
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final session = await _authService.login(
        email: email,
        password: password,
      );

      await _tokenStorage.saveSession(
        token: session.token,
        email: session.email,
        role: session.role,
        department: session.department,
      );

      _email = session.email;
      _role = session.role;
      _department = session.department;
      _isAuthenticated = true;
    } catch (err) {
      _error = 'Login failed. Please check your credentials.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _tokenStorage.clear();
    _isAuthenticated = false;
    _email = null;
    _role = null;
    _department = null;
    notifyListeners();
  }
}
