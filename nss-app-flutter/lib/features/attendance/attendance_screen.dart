import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/extensions/date_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../providers/attendance_provider.dart';

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(attendanceSummaryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Summary'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: summaryAsync.when(
        data: (summaries) {
          if (summaries.isEmpty) {
            return const EmptyState(
              icon: Icons.fact_check,
              title: 'No attendance data',
              subtitle: 'Attendance summaries will appear after events.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async =>
                ref.invalidate(attendanceSummaryProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: summaries.length,
              itemBuilder: (context, index) {
                final s = summaries[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.eventName,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (s.categoryName != null)
                          Text(
                            s.categoryName!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        if (s.startDate != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            s.startDate!.formattedDate,
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _StatChip(
                              label: 'Registered',
                              value: s.totalRegistered.toString(),
                              color: const Color(0xFF3B82F6),
                            ),
                            const SizedBox(width: 8),
                            _StatChip(
                              label: 'Present',
                              value: s.totalPresent.toString(),
                              color: const Color(0xFF22C55E),
                            ),
                            const SizedBox(width: 8),
                            _StatChip(
                              label: 'Absent',
                              value: s.totalAbsent.toString(),
                              color: const Color(0xFFEF4444),
                            ),
                            const SizedBox(width: 8),
                            _StatChip(
                              label: 'Rate',
                              value: '${s.attendanceRate.toStringAsFixed(0)}%',
                              color: const Color(0xFFA855F7),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => AppError(
          message: e.toString(),
          onRetry: () => ref.invalidate(attendanceSummaryProvider),
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatChip({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
                fontSize: 14,
              ),
            ),
            Text(
              label,
              style: TextStyle(fontSize: 10, color: color),
            ),
          ],
        ),
      ),
    );
  }
}
