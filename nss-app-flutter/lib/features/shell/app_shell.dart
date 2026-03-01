import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class AppShell extends ConsumerStatefulWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _currentIndex = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final location = GoRouterState.of(context).matchedLocation;
    final paths = ['/dashboard', '/events', '/register', '/profile'];
    final idx = paths.indexOf(location);
    if (idx >= 0 && idx != _currentIndex) {
      setState(() => _currentIndex = idx);
    }
  }

  void _onNavTap(int index) {
    final currentUser = ref.read(currentUserProvider);
    final isAdminOrHead = currentUser?.isAdminOrHead ?? false;

    // "More" tab — show bottom sheet instead of navigating
    if (isAdminOrHead && index == 4) {
      _showMoreSheet(context);
      return;
    }

    final paths = ['/dashboard', '/events', '/register', '/profile'];
    if (index < paths.length) {
      setState(() => _currentIndex = index);
      context.go(paths[index]);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(currentUserProvider);
    final isAdminOrHead = currentUser?.isAdminOrHead ?? false;

    // Determine if we're on a tab route (show bottom nav) or a pushed route (hide it)
    final location = GoRouterState.of(context).matchedLocation;
    final tabPaths = ['/dashboard', '/events', '/register', '/profile'];
    final isOnTab = tabPaths.contains(location);

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: isOnTab
          ? NavigationBar(
              selectedIndex: _currentIndex.clamp(0, isAdminOrHead ? 4 : 3),
              onDestinationSelected: _onNavTap,
              destinations: [
                const NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard),
                  label: 'Dashboard',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.event_outlined),
                  selectedIcon: Icon(Icons.event),
                  label: 'Events',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.app_registration_outlined),
                  selectedIcon: Icon(Icons.app_registration),
                  label: 'Register',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.person_outlined),
                  selectedIcon: Icon(Icons.person),
                  label: 'Profile',
                ),
                if (isAdminOrHead)
                  const NavigationDestination(
                    icon: Icon(Icons.more_horiz_outlined),
                    selectedIcon: Icon(Icons.more_horiz),
                    label: 'More',
                  ),
              ],
            )
          : null,
    );
  }

  void _showMoreSheet(BuildContext context) {
    final currentUser = ref.read(currentUserProvider);
    final isAdmin = currentUser?.isAdmin ?? false;
    final theme = Theme.of(context);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),

              // Management section
              _SectionLabel('Management', theme),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                children: [
                  _MoreTile(
                    icon: Icons.fact_check_outlined,
                    label: 'Attendance',
                    color: const Color(0xFF3B82F6),
                    onTap: () {
                      Navigator.pop(ctx);
                      context.go('/attendance');
                    },
                  ),
                  _MoreTile(
                    icon: Icons.checklist_outlined,
                    label: 'Mark\nAttendance',
                    color: const Color(0xFF22C55E),
                    onTap: () {
                      Navigator.pop(ctx);
                      context.go('/attendance/manage');
                    },
                  ),
                  _MoreTile(
                    icon: Icons.schedule_outlined,
                    label: 'Hours\nApproval',
                    color: const Color(0xFFA855F7),
                    onTap: () {
                      Navigator.pop(ctx);
                      context.go('/hours');
                    },
                  ),
                  _MoreTile(
                    icon: Icons.bar_chart_outlined,
                    label: 'Reports',
                    color: const Color(0xFFF59E0B),
                    onTap: () {
                      Navigator.pop(ctx);
                      context.go('/reports');
                    },
                  ),
                ],
              ),

              // Admin section
              if (isAdmin) ...[
                const SizedBox(height: 20),
                _SectionLabel('Admin', theme),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  children: [
                    _MoreTile(
                      icon: Icons.people_outlined,
                      label: 'Volunteers',
                      color: const Color(0xFF06B6D4),
                      onTap: () {
                        Navigator.pop(ctx);
                        context.go('/volunteers');
                      },
                    ),
                    _MoreTile(
                      icon: Icons.admin_panel_settings_outlined,
                      label: 'Roles',
                      color: const Color(0xFFEF4444),
                      onTap: () {
                        Navigator.pop(ctx);
                        context.go('/roles');
                      },
                    ),
                    _MoreTile(
                      icon: Icons.category_outlined,
                      label: 'Categories',
                      color: const Color(0xFF8B5CF6),
                      onTap: () {
                        Navigator.pop(ctx);
                        context.go('/categories');
                      },
                    ),
                    _MoreTile(
                      icon: Icons.manage_accounts_outlined,
                      label: 'Users',
                      color: const Color(0xFF14B8A6),
                      onTap: () {
                        Navigator.pop(ctx);
                        context.go('/users');
                      },
                    ),
                    _MoreTile(
                      icon: Icons.history_outlined,
                      label: 'Activity\nLogs',
                      color: const Color(0xFF64748B),
                      onTap: () {
                        Navigator.pop(ctx);
                        context.go('/activity-logs');
                      },
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 16),
              const Divider(),
              // Settings
              ListTile(
                leading: const Icon(Icons.settings_outlined),
                title: const Text('Settings'),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  context.go('/settings');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String title;
  final ThemeData theme;

  const _SectionLabel(this.title, this.theme);

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title.toUpperCase(),
        style: theme.textTheme.labelSmall?.copyWith(
          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
          fontWeight: FontWeight.w600,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

class _MoreTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _MoreTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
                height: 1.2,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
