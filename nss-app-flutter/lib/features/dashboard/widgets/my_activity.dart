import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../providers/dashboard_provider.dart';

class MyActivity extends ConsumerWidget {
  const MyActivity({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(volunteerDashboardProvider);
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(volunteerDashboardProvider);
      },
      child: dashboardAsync.when(
        data: (data) {
          final eventsParticipated = data['eventsParticipated'] as int? ?? 0;
          final totalHours = data['totalHours'] as num? ?? 0;
          final approvedHours = data['approvedHours'] as num? ?? 0;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Horizontal scroll stat pills
              SizedBox(
                height: 100,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _StatPill(
                      icon: Icons.event,
                      value: eventsParticipated.toString(),
                      label: 'Events',
                      color: const Color(0xFF3B82F6),
                    ),
                    const SizedBox(width: 12),
                    _StatPill(
                      icon: Icons.schedule,
                      value: totalHours.toStringAsFixed(0),
                      label: 'Total Hours',
                      color: const Color(0xFFA855F7),
                    ),
                    const SizedBox(width: 12),
                    _StatPill(
                      icon: Icons.check_circle,
                      value: approvedHours.toStringAsFixed(0),
                      label: 'Approved',
                      color: const Color(0xFF22C55E),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Recent activity
              Text(
                'Your Activity',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              if (eventsParticipated == 0)
                const EmptyState(
                  icon: Icons.event_available,
                  title: 'No events yet',
                  subtitle: 'Register for events to see your activity here.',
                )
              else
                ..._buildRecentEvents(data['participations'] as List? ?? [],
                    theme),
            ],
          );
        },
        loading: () => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SizedBox(
              height: 100,
              child: Row(
                children: List.generate(
                  3,
                  (index) => const Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: 12),
                      child: ShimmerCard(height: 100),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            ...List.generate(3, (index) => const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: ShimmerCard(height: 72),
            )),
          ],
        ),
        error: (e, _) => AppError(
          message: e.toString(),
          onRetry: () => ref.invalidate(volunteerDashboardProvider),
        ),
      ),
    );
  }

  List<Widget> _buildRecentEvents(List participations, ThemeData theme) {
    final recent = participations.take(10).toList();
    return recent.map((p) {
      final event = p['events'];
      final eventName = event?['event_name'] ?? 'Unknown Event';
      final status = p['participation_status'] as String? ?? 'registered';
      final hours = (p['hours_attended'] as num?) ?? 0;

      return Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: _statusColor(status).withValues(alpha: 0.2),
            child: Icon(
              _statusIcon(status),
              color: _statusColor(status),
              size: 20,
            ),
          ),
          title: Text(
            eventName,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          subtitle: Text('$status | ${hours}h'),
          trailing: Text(
            p['approval_status'] as String? ?? '',
            style: TextStyle(
              fontSize: 11,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ),
      );
    }).toList();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'present':
        return const Color(0xFF22C55E);
      case 'absent':
        return const Color(0xFFEF4444);
      case 'partially_present':
        return const Color(0xFFEAB308);
      default:
        return const Color(0xFF3B82F6);
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'present':
        return Icons.check_circle;
      case 'absent':
        return Icons.cancel;
      case 'partially_present':
        return Icons.access_time;
      default:
        return Icons.event;
    }
  }
}

// ─── Stat Pill ──────────────────────────────────────────────────────────────

class _StatPill extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _StatPill({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 130,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 22),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
