import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/extensions/context_extensions.dart';
import '../../core/extensions/date_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../providers/auth_provider.dart';
import '../../providers/hours_provider.dart';

class HoursApprovalScreen extends ConsumerWidget {
  const HoursApprovalScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingHoursProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hours Approval'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: pendingAsync.when(
        data: (pending) {
          if (pending.isEmpty) {
            return const EmptyState(
              icon: Icons.check_circle_outline,
              title: 'All caught up!',
              subtitle: 'No pending hours to approve.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(pendingHoursProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: pending.length,
              itemBuilder: (context, index) {
                final p = pending[index];
                return Dismissible(
                  key: ValueKey(p.id),
                  background: Container(
                    alignment: Alignment.centerLeft,
                    padding: const EdgeInsets.only(left: 20),
                    color: const Color(0xFF22C55E),
                    child: const Icon(Icons.check, color: Colors.white),
                  ),
                  secondaryBackground: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    color: const Color(0xFFEF4444),
                    child: const Icon(Icons.close, color: Colors.white),
                  ),
                  confirmDismiss: (direction) async {
                    final currentUser = ref.read(currentUserProvider);
                    if (currentUser == null) return false;

                    if (direction == DismissDirection.startToEnd) {
                      return _approveHours(context, ref, p.id,
                          currentUser.volunteerId);
                    } else {
                      return _showRejectDialog(context, ref, p.id,
                          currentUser.volunteerId);
                    }
                  },
                  child: Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  p.volunteerName ?? 'Unknown',
                                  style:
                                      theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.primary
                                      .withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${p.hoursAttended}h',
                                  style: TextStyle(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          if (p.volunteerRollNumber != null)
                            Text(
                              p.volunteerRollNumber!,
                              style: theme.textTheme.bodySmall,
                            ),
                          if (p.attendanceDate != null)
                            Text(
                              'Date: ${p.attendanceDate!.formattedDate}',
                              style: theme.textTheme.bodySmall,
                            ),
                          const SizedBox(height: 8),
                          Text(
                            'Swipe right to approve, left to reject',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface
                                  .withValues(alpha: 0.4),
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
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
          onRetry: () => ref.invalidate(pendingHoursProvider),
        ),
      ),
    );
  }

  Future<bool> _approveHours(
    BuildContext context,
    WidgetRef ref,
    String participationId,
    String approvedBy,
  ) async {
    try {
      await ref.read(hoursRepositoryProvider).approveHours(
            participationId: participationId,
            approvedBy: approvedBy,
          );
      if (context.mounted) {
        context.showSuccessSnackBar('Hours approved');
      }
      ref.invalidate(pendingHoursProvider);
      return true;
    } catch (e) {
      if (context.mounted) {
        context.showSnackBar(e.toString(), isError: true);
      }
      return false;
    }
  }

  Future<bool> _showRejectDialog(
    BuildContext context,
    WidgetRef ref,
    String participationId,
    String approvedBy,
  ) async {
    final notesController = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Hours'),
        content: TextField(
          controller: notesController,
          decoration: const InputDecoration(
            labelText: 'Reason (optional)',
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (result != true) return false;

    try {
      await ref.read(hoursRepositoryProvider).rejectHours(
            participationId: participationId,
            approvedBy: approvedBy,
            notes: notesController.text.isEmpty ? null : notesController.text,
          );
      if (context.mounted) {
        context.showSnackBar('Hours rejected');
      }
      ref.invalidate(pendingHoursProvider);
      return true;
    } catch (e) {
      if (context.mounted) {
        context.showSnackBar(e.toString(), isError: true);
      }
      return false;
    }
  }
}
