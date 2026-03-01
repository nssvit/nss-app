import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: '.env');

  final url = dotenv.env['SUPABASE_URL'] ?? '';
  final anonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  debugPrint('[INIT] SUPABASE_URL=${url.isNotEmpty ? "${url.substring(0, 20)}..." : "EMPTY"}');
  debugPrint('[INIT] ANON_KEY=${anonKey.isNotEmpty ? "${anonKey.substring(0, 20)}..." : "EMPTY"}');

  // Initialize Supabase
  await Supabase.initialize(
    url: url,
    anonKey: anonKey,
  );

  runApp(
    const ProviderScope(
      child: NSSApp(),
    ),
  );
}
