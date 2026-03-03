import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_client.dart';
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

  const AuthState({
    this.status = AuthStatus.initial,
    this.currentUser,
    this.error,
  });

  AuthState copyWith({
    AuthStatus? status,
    CurrentUser? currentUser,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      currentUser: currentUser ?? this.currentUser,
      error: error,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

// Auth notifier — Riverpod v3 Notifier pattern
class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    // Wire up 401 handler so any API call can trigger logout
    apiClient.onUnauthorized = () {
      state = const AuthState(status: AuthStatus.unauthenticated);
    };

    // Defer init to after build() completes
    Future.microtask(() => _init());

    return const AuthState();
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  /// Check for a persisted token and fetch user profile.
  void _init() {
    if (apiClient.hasToken) {
      _fetchCurrentUser();
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// Fetch the current user profile from /api/me.
  Future<void> _fetchCurrentUser() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final user = await _repo.fetchCurrentUser();
      if (user != null) {
        state = AuthState(
          status: AuthStatus.authenticated,
          currentUser: user,
        );
      } else {
        await apiClient.clearToken();
        state = const AuthState(
          status: AuthStatus.unauthenticated,
          error: 'No volunteer profile found for this account.',
        );
      }
    } catch (e) {
      debugPrint('[AUTH] fetchCurrentUser error: $e');
      await apiClient.clearToken();
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
      debugPrint('[AUTH] signIn success, fetching user profile...');
      await _fetchCurrentUser();
    } catch (e, stack) {
      debugPrint('[AUTH] signIn error: $e');
      debugPrint('[AUTH] Stack: $stack');
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.toString().replaceFirst('Exception: ', ''),
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
      // Don't set authenticated — wait for email verification
      state = const AuthState(status: AuthStatus.unauthenticated);
    } catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.toString().replaceFirst('Exception: ', ''),
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

  /// Refresh current user data from API.
  Future<void> refreshUser() async {
    if (apiClient.hasToken) {
      await _fetchCurrentUser();
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
