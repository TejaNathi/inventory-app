import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app/app.dart';
import 'core/api/api_client.dart';
import 'core/storage/secure_token_storage.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/auth_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final tokenStorage = SecureTokenStorage();
  final apiClient = ApiClient(tokenStorage: tokenStorage);
  final authProvider = AuthProvider(
    authService: AuthService(apiClient: apiClient),
    tokenStorage: tokenStorage,
  );

  await authProvider.bootstrap();

  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: apiClient),
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
      ],
      child: const InventoryMobileApp(),
    ),
  );
}
