import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../auth/auth_provider.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final today = DateFormat.yMMMd().format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Logout',
            onPressed: () => context.read<AuthProvider>().logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: Text(auth.email ?? 'Signed in user'),
              subtitle: Text('${auth.role ?? '-'} • ${auth.department ?? '-'}'),
              trailing: Text(today),
            ),
          ),
          const SizedBox(height: 12),
          const Card(
            child: ListTile(
              leading: Icon(Icons.inventory_2_outlined),
              title: Text('Inventory'),
              subtitle: Text('Inventory screens will be migrated here next.'),
            ),
          ),
          const Card(
            child: ListTile(
              leading: Icon(Icons.local_shipping_outlined),
              title: Text('Delivery checklist'),
              subtitle: Text('Delivery confirmation flow will be added in Flutter.'),
            ),
          ),
        ],
      ),
    );
  }
}
