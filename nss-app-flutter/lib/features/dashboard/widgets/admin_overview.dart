import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/widgets/widgets.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/dashboard_provider.dart';

class AdminOverview extends ConsumerWidget {
  const AdminOverview({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);
    final currentUser = ref.watch(currentUserProvider);
    final isAdmin = currentUser?.isAdmin ?? false;
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(dashboardStatsProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Stats grid
          statsAsync.when(
            data: (stats) => GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                StatCard(
                  title: 'Total Events',
                  value: stats.totalEvents.toString(),
                  icon: Icons.event,
                  color: const Color(0xFF3B82F6),
                  onTap: () => context.go('/events'),
                ),
                StatCard(
                  title: 'Active Volunteers',
                  value: stats.activeVolunteers.toString(),
                  icon: Icons.people,
                  color: const Color(0xFF22C55E),
                  onTap: isAdmin ? () => context.go('/volunteers') : null,
                ),
                StatCard(
                  title: 'Total Hours',
                  value: stats.totalHours.toStringAsFixed(0),
                  icon: Icons.schedule,
                  color: const Color(0xFFA855F7),
                  onTap: () => context.go('/reports'),
                ),
                StatCard(
                  title: 'Ongoing Projects',
                  value: stats.ongoingProjects.toString(),
                  icon: Icons.trending_up,
                  color: const Color(0xFFF59E0B),
                ),
              ],
            ),
            loading: () => GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: List.generate(4, (_) => const ShimmerCard(height: 100)),
            ),
            error: (e, _) => AppError(
              message: e.toString(),
              onRetry: () => ref.invalidate(dashboardStatsProvider),
            ),
          ),
          const SizedBox(height: 24),

          // Quick actions
          Text(
            'Quick Actions',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: [
              _QuickActionTile(
                icon: Icons.checklist,
                label: 'Mark\nAttendance',
                color: const Color(0xFF22C55E),
                onTap: () => context.go('/attendance/manage'),
              ),
              _QuickActionTile(
                icon: Icons.schedule,
                label: 'Approve\nHours',
                color: const Color(0xFFA855F7),
                onTap: () => context.go('/hours'),
              ),
              _QuickActionTile(
                icon: Icons.bar_chart,
                label: 'View\nReports',
                color: const Color(0xFFF59E0B),
                onTap: () => context.go('/reports'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Quick Action Tile ──────────────────────────────────────────────────────

class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionTile({
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
          border: Border.all(
            color: color.withValues(alpha: 0.15),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
                height: 1.2,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
