import '../../core/api/api_client.dart';

class AuthSession {
  const AuthSession({
    required this.token,
    required this.email,
    required this.role,
    required this.department,
  });

  final String token;
  final String email;
  final String role;
  final String department;
}

class AuthService {
  const AuthService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/api/login',
      data: {
        'email': email,
        'password': password,
      },
    );

    final data = response.data ?? <String, dynamic>{};
    final user = data['user'] as Map<String, dynamic>? ?? <String, dynamic>{};

    return AuthSession(
      token: data['token'] as String? ?? '',
      email: user['email'] as String? ?? email,
      role: user['role'] as String? ?? '',
      department: user['department'] as String? ?? '',
    );
  }
}
