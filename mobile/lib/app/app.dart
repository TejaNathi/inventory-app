import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../features/auth/auth_provider.dart';
import 'routes.dart';
import 'theme.dart';

class InventoryMobileApp extends StatelessWidget {
  const InventoryMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return MaterialApp.router(
      title: 'ThinkMetal Inventory',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      routerConfig: buildRouter(authProvider),
    );
  }
}
