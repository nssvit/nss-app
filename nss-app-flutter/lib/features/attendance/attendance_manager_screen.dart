import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_constants.dart';
import '../../core/extensions/context_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/events_provider.dart';

class AttendanceManagerScreen extends ConsumerStatefulWidget {
  const AttendanceManagerScreen({super.key});

  @override
  ConsumerState<AttendanceManagerScreen> createState() =>
      _AttendanceManagerScreenState();
}

class _AttendanceManagerScreenState
    extends ConsumerState<AttendanceManagerScreen> {
  String? _selectedEventId;
  final Set<String> _presentIds = {};
  bool _saving = false;
  String? _initializedForEventId;

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(eventsForAttendanceProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mark Attendance'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
        actions: [
          if (_selectedEventId != null)
            TextButton(
              onPressed: _saving ? null : _saveAttendance,
              child: _saving
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save'),
            ),
        ],
      ),
      body: Column(
        children: [
          // Event selector
          Padding(
            padding: const EdgeInsets.all(16),
            child: eventsAsync.when(
              data: (events) => DropdownButtonFormField<String>(
                value: _selectedEventId,
                decoration: const InputDecoration(
                  labelText: 'Select Event',
                  prefixIcon: Icon(Icons.event),
                ),
                items: events
                    .map((e) => DropdownMenuItem(
                          value: e.id,
                          child: Text(
                            e.eventName,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ))
                    .toList(),
                onChanged: (v) {
                  setState(() {
                    _selectedEventId = v;
                    _presentIds.clear();
                    _initializedForEventId = null;
                  });
                },
              ),
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('Error: $e'),
            ),
          ),

          // Participants list
          if (_selectedEventId != null)
            Expanded(
              child: _buildParticipantsList(theme),
            ),
        ],
      ),
    );
  }

  Widget _buildParticipantsList(ThemeData theme) {
    final participantsAsync =
        ref.watch(eventParticipantsProvider(_selectedEventId!));

    return participantsAsync.when(
      data: (participants) {
        if (participants.isEmpty) {
          return const EmptyState(
            icon: Icons.people_outline,
            title: 'No participants',
            subtitle: 'No volunteers have registered for this event.',
          );
        }

        // Initialize present IDs from existing data (only once per event)
        if (_initializedForEventId != _selectedEventId) {
          _presentIds.clear();
          for (final p in participants) {
            if (p.participationStatus == 'present' ||
                p.participationStatus == 'partially_present') {
              _presentIds.add(p.volunteerId);
            }
          }
          _initializedForEventId = _selectedEventId;
        }

        return Column(
          children: [
            // Bulk actions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    '${_presentIds.length}/${participants.length} present',
                    style: theme.textTheme.bodySmall,
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => setState(() {
                      _presentIds.addAll(
                          participants.map((p) => p.volunteerId));
                    }),
                    child: const Text('All Present'),
                  ),
                  TextButton(
                    onPressed: () =>
                        setState(() => _presentIds.clear()),
                    child: const Text('Clear'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: participants.length,
                itemBuilder: (context, index) {
                  final p = participants[index];
                  final isPresent =
                      _presentIds.contains(p.volunteerId);

                  return CheckboxListTile(
                    value: isPresent,
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          _presentIds.add(p.volunteerId);
                        } else {
                          _presentIds.remove(p.volunteerId);
                        }
                      });
                    },
                    title: Text(p.volunteerName ?? 'Unknown'),
                    subtitle: Text(p.volunteerRollNumber ?? ''),
                    secondary: CircleAvatar(
                      backgroundColor: isPresent
                          ? const Color(0xFF22C55E).withValues(alpha: 0.2)
                          : theme.colorScheme.onSurface
                              .withValues(alpha: 0.1),
                      child: Icon(
                        isPresent ? Icons.check : Icons.person,
                        color: isPresent
                            ? const Color(0xFF22C55E)
                            : theme.colorScheme.onSurface
                                .withValues(alpha: 0.4),
                        size: 20,
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AppError(message: e.toString()),
    );
  }

  Future<void> _saveAttendance() async {
    if (_selectedEventId == null) return;

    setState(() => _saving = true);
    try {
      final currentUser = ref.read(currentUserProvider);
      final event =
          await ref.read(eventRepositoryProvider).getEventById(_selectedEventId!);

      await ref.read(attendanceRepositoryProvider).syncAttendance(
            eventId: _selectedEventId!,
            presentVolunteerIds: _presentIds.toList(),
            declaredHours: event?.declaredHours ?? 0,
            recordedBy: currentUser?.volunteerId ?? '',
          );

      if (mounted) {
        context.showSuccessSnackBar('Attendance saved');
        ref.invalidate(eventParticipantsProvider(_selectedEventId!));
        ref.invalidate(attendanceSummaryProvider);
      }
    } catch (e) {
      if (mounted) {
        context.showSnackBar(e.toString(), isError: true);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
