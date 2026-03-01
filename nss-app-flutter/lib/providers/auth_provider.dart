import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide Provider;
import '../core/utils/supabase_client.dart';
import '../models/current_user.dart';
import '../repositories/auth_repository.dart';

// Repository provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

// Auth state
enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthState {
  final AuthStatus status;
  final CurrentUser? currentUser;
  final String? error;
  final Session? session;

  const AuthState({
    this.status = AuthStatus.initial,
    this.currentUser,
    this.error,
    this.session,
  });

  AuthState copyWith({
    AuthStatus? status,
    CurrentUser? currentUser,
    String? error,
    Session? session,
  }) {
    return AuthState(
      status: status ?? this.status,
      currentUser: currentUser ?? this.currentUser,
      error: error,
      session: session ?? this.session,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

// Auth notifier — Riverpod v3 Notifier pattern
class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    // Listen to auth state changes
    final sub = supabase.auth.onAuthStateChange.listen((event) {
      switch (event.event) {
        case AuthChangeEvent.signedIn:
        case AuthChangeEvent.tokenRefreshed:
          if (event.session != null) {
            _fetchCurrentUser(event.session!.user.id);
          }
          break;
        case AuthChangeEvent.signedOut:
          state = const AuthState(status: AuthStatus.unauthenticated);
          break;
        default:
          break;
      }
    });

    ref.onDispose(() => sub.cancel());

    // Defer init to after build() completes (state can't be set during build)
    Future.microtask(() => _init());

    // Return initial status (splash screen shown while this is active)
    return const AuthState();
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  void _init() {
    final session = currentSession;
    if (session != null) {
      _fetchCurrentUser(session.user.id);
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> _fetchCurrentUser(String authUserId) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final user = await _repo.fetchCurrentUser(authUserId);
      if (user != null) {
        state = AuthState(
          status: AuthStatus.authenticated,
          currentUser: user,
          session: currentSession,
        );
      } else {
        state = const AuthState(
          status: AuthStatus.unauthenticated,
          error: 'No volunteer profile found for this account.',
        );
      }
    } catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      debugPrint('[AUTH] signIn attempt for $email');
      await _repo.signIn(email: email, password: password);
      debugPrint('[AUTH] signIn success');
      // onAuthStateChange will handle the rest
    } on AuthException catch (e) {
      debugPrint('[AUTH] AuthException: ${e.message}');
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.message,
      );
    } catch (e, stack) {
      debugPrint('[AUTH] Exception: $e');
      debugPrint('[AUTH] Stack: $stack');
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: 'Login failed: ${e.runtimeType} - $e',
      );
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String rollNumber,
    required String branch,
    required String year,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      await _repo.signUp(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        rollNumber: rollNumber,
        branch: branch,
        year: year,
      );
      // Don't set authenticated — wait for email confirmation
      state = const AuthState(status: AuthStatus.unauthenticated);
    } on AuthException catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.message,
      );
    } catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
    }
  }

  Future<void> resetPassword(String email) async {
    await _repo.resetPassword(email);
  }

  Future<void> signOut() async {
    await _repo.signOut();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Refresh current user data from DB.
  Future<void> refreshUser() async {
    final authUser = currentAuthUser;
    if (authUser != null) {
      await _fetchCurrentUser(authUser.id);
    }
  }
}

// Providers
final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

final currentUserProvider = Provider<CurrentUser?>((ref) {
  return ref.watch(authProvider).currentUser;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});
