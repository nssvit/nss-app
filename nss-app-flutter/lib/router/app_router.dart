import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/signup_screen.dart';
import '../features/auth/forgot_password_screen.dart';
import '../features/auth/reset_password_screen.dart';
import '../features/auth/email_confirmation_screen.dart';
import '../features/shell/app_shell.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/events/events_screen.dart';
import '../features/events/event_registration_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/attendance/attendance_screen.dart';
import '../features/attendance/attendance_manager_screen.dart';
import '../features/hours/hours_approval_screen.dart';
import '../features/reports/reports_screen.dart';
import '../features/volunteers/volunteers_screen.dart';
import '../features/roles/role_management_screen.dart';
import '../features/categories/categories_screen.dart';
import '../features/users/user_management_screen.dart';
import '../features/audit/activity_logs_screen.dart';

/// Bridges Riverpod auth state → GoRouter refreshListenable
class _AuthChangeNotifier extends ChangeNotifier {
  AuthState _state = const AuthState();

  AuthState get state => _state;

  void update(AuthState newState) {
    _state = newState;
    notifyListeners();
  }
}

/// Slide-from-bottom page for non-tab routes
CustomTransitionPage<void> _slideUpPage(Widget child, GoRouterState state) {
  return CustomTransitionPage(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final tween = Tween(begin: const Offset(0, 0.05), end: Offset.zero)
          .chain(CurveTween(curve: Curves.easeOutCubic));
      return SlideTransition(
        position: animation.drive(tween),
        child: FadeTransition(
          opacity: animation.drive(CurveTween(curve: Curves.easeOut)),
          child: child,
        ),
      );
    },
    transitionDuration: const Duration(milliseconds: 250),
  );
}

final routerProvider = Provider<GoRouter>((ref) {
  final authChangeNotifier = _AuthChangeNotifier();

  // Set initial value
  authChangeNotifier.update(ref.read(authProvider));

  // Listen for changes without recreating the router
  ref.listen(authProvider, (_, next) {
    authChangeNotifier.update(next);
  });

  final router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: authChangeNotifier,
    redirect: (context, state) {
      final authState = authChangeNotifier.state;
      final isAuth = authState.isAuthenticated;
      final loc = state.matchedLocation;
      final isOnAuth = loc.startsWith('/login') ||
          loc.startsWith('/signup') ||
          loc.startsWith('/forgot-password') ||
          loc.startsWith('/reset-password') ||
          loc.startsWith('/email-confirmation');
      final isOnSplash = loc == '/splash';

      // Still initializing — stay on or go to splash
      if (authState.status == AuthStatus.initial) {
        return isOnSplash ? null : '/splash';
      }

      // Auth resolved — leave splash
      if (isOnSplash) {
        return isAuth ? '/dashboard' : '/login';
      }

      // Not authenticated and not on auth page → go to login
      if (!isAuth && !isOnAuth) return '/login';

      // Authenticated and on auth page → go to dashboard
      if (isAuth && isOnAuth) return '/dashboard';

      // Role-based route guards
      if (isAuth) {
        final currentUser = ref.read(currentUserProvider);
        final isAdminOrHead = currentUser?.isAdminOrHead ?? false;
        final isAdmin = currentUser?.isAdmin ?? false;

        // Management routes require admin or head
        const managementPaths = ['/attendance', '/attendance/manage', '/hours', '/reports'];
        if (managementPaths.contains(loc) && !isAdminOrHead) {
          return '/dashboard';
        }

        // Admin routes require admin
        const adminPaths = ['/volunteers', '/roles', '/categories', '/users', '/activity-logs'];
        if (adminPaths.contains(loc) && !isAdmin) {
          return '/dashboard';
        }
      }

      return null;
    },
    routes: [
      // Splash route (shown during auth init)
      GoRoute(
        path: '/splash',
        builder: (context, state) => const Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.volunteer_activism,
                  size: 64,
                  color: Color(0xFF6366F1),
                ),
                SizedBox(height: 16),
                CircularProgressIndicator(),
              ],
            ),
          ),
        ),
      ),

      // Auth routes (no shell)
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => const ResetPasswordScreen(),
      ),
      GoRoute(
        path: '/email-confirmation',
        builder: (context, state) => const EmailConfirmationScreen(),
      ),

      // Main app with shell
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          // Bottom nav tabs (no transition)
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/events',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: EventsScreen(),
            ),
          ),
          GoRoute(
            path: '/register',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: EventRegistrationScreen(),
            ),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfileScreen(),
            ),
          ),

          // Pushed routes (slide-up transition)
          GoRoute(
            path: '/settings',
            pageBuilder: (context, state) =>
                _slideUpPage(const SettingsScreen(), state),
          ),
          GoRoute(
            path: '/attendance',
            pageBuilder: (context, state) =>
                _slideUpPage(const AttendanceScreen(), state),
          ),
          GoRoute(
            path: '/attendance/manage',
            pageBuilder: (context, state) =>
                _slideUpPage(const AttendanceManagerScreen(), state),
          ),
          GoRoute(
            path: '/hours',
            pageBuilder: (context, state) =>
                _slideUpPage(const HoursApprovalScreen(), state),
          ),
          GoRoute(
            path: '/reports',
            pageBuilder: (context, state) =>
                _slideUpPage(const ReportsScreen(), state),
          ),
          GoRoute(
            path: '/volunteers',
            pageBuilder: (context, state) =>
                _slideUpPage(const VolunteersScreen(), state),
          ),
          GoRoute(
            path: '/roles',
            pageBuilder: (context, state) =>
                _slideUpPage(const RoleManagementScreen(), state),
          ),
          GoRoute(
            path: '/categories',
            pageBuilder: (context, state) =>
                _slideUpPage(const CategoriesScreen(), state),
          ),
          GoRoute(
            path: '/users',
            pageBuilder: (context, state) =>
                _slideUpPage(const UserManagementScreen(), state),
          ),
          GoRoute(
            path: '/activity-logs',
            pageBuilder: (context, state) =>
                _slideUpPage(const ActivityLogsScreen(), state),
          ),
        ],
      ),
    ],
  );

  ref.onDispose(() {
    router.dispose();
    authChangeNotifier.dispose();
  });

  return router;
});
