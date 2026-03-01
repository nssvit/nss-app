import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/extensions/date_extensions.dart';
import '../../core/extensions/string_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../models/models.dart';
import '../../repositories/audit_repository.dart';

final _auditRepositoryProvider = Provider<AuditRepository>((ref) {
  return AuditRepository();
});

final _auditLogsProvider =
    FutureProvider.autoDispose.family<List<AuditLog>, String?>((ref, action) {
  return ref.read(_auditRepositoryProvider).getAuditLogs(action: action);
});

final _distinctActionsProvider =
    FutureProvider.autoDispose<List<String>>((ref) {
  return ref.read(_auditRepositoryProvider).getDistinctActions();
});

class ActivityLogsScreen extends ConsumerStatefulWidget {
  const ActivityLogsScreen({super.key});

  @override
  ConsumerState<ActivityLogsScreen> createState() =>
      _ActivityLogsScreenState();
}

class _ActivityLogsScreenState extends ConsumerState<ActivityLogsScreen> {
  String? _selectedAction;

  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(_auditLogsProvider(_selectedAction));
    final actionsAsync = ref.watch(_distinctActionsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity Logs'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: Column(
        children: [
          // Filter chips
          SizedBox(
            height: 48,
            child: actionsAsync.when(
              data: (actions) => ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: const Text('All'),
                      selected: _selectedAction == null,
                      onSelected: (_) =>
                          setState(() => _selectedAction = null),
                    ),
                  ),
                  ...actions.map(
                    (a) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(a.snakeToDisplay),
                        selected: _selectedAction == a,
                        onSelected: (_) =>
                            setState(() => _selectedAction = a),
                      ),
                    ),
                  ),
                ],
              ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),
          const SizedBox(height: 4),

          // Logs list
          Expanded(
            child: logsAsync.when(
              data: (logs) {
                if (logs.isEmpty) {
                  return const EmptyState(
                    icon: Icons.history,
                    title: 'No activity logs',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.invalidate(_auditLogsProvider(_selectedAction)),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: logs.length,
                    itemBuilder: (context, index) {
                      final log = logs[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 6),
                        child: ListTile(
                          leading: CircleAvatar(
                            radius: 18,
                            backgroundColor: theme.colorScheme.primary
                                .withValues(alpha: 0.1),
                            child: Icon(
                              _actionIcon(log.action),
                              size: 18,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          title: Text(
                            log.action.snakeToDisplay,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          subtitle: Text(
                            '${log.actorName ?? 'System'} | ${log.targetType ?? ''}',
                            style: theme.textTheme.bodySmall,
                          ),
                          trailing: Text(
                            log.createdAt?.formattedDateTime ?? '',
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontSize: 10,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => AppError(
                message: e.toString(),
                onRetry: () =>
                    ref.invalidate(_auditLogsProvider(_selectedAction)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _actionIcon(String action) {
    if (action.contains('create')) return Icons.add_circle;
    if (action.contains('update')) return Icons.edit;
    if (action.contains('delete')) return Icons.delete;
    if (action.contains('login')) return Icons.login;
    if (action.contains('assign')) return Icons.assignment_ind;
    if (action.contains('approve')) return Icons.check_circle;
    if (action.contains('reject')) return Icons.cancel;
    return Icons.info;
  }
}
