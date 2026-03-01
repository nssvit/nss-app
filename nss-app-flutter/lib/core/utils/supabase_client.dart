import 'package:supabase_flutter/supabase_flutter.dart';

/// Convenience accessor for the Supabase client singleton.
SupabaseClient get supabase => Supabase.instance.client;

/// Convenience accessor for the current auth session.
Session? get currentSession => supabase.auth.currentSession;

/// Convenience accessor for the current auth user.
User? get currentAuthUser => supabase.auth.currentUser;
