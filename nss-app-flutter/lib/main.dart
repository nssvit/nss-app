import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/services/api_client.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: '.env');

  final baseUrl = dotenv.env['API_BASE_URL'] ?? '';
  debugPrint('[INIT] API_BASE_URL=${baseUrl.isNotEmpty ? "${baseUrl.substring(0, 20)}..." : "EMPTY"}');

  // Initialize API client (loads persisted token)
  await apiClient.init(baseUrl);

  runApp(
    const ProviderScope(
      child: NSSApp(),
    ),
  );
}
