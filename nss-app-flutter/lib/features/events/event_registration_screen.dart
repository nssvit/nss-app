import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_constants.dart';
import '../../core/extensions/context_extensions.dart';
import '../../core/extensions/date_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../providers/auth_provider.dart';
import '../../providers/events_provider.dart';

class EventRegistrationScreen extends ConsumerWidget {
  const EventRegistrationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(registrationEventsProvider);
    final currentUser = ref.watch(currentUserProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Event Registration'),
      ),
      body: eventsAsync.when(
        data: (events) {
          if (events.isEmpty) {
            return const EmptyState(
              icon: Icons.event_available,
              title: 'No events open for registration',
              subtitle: 'Check back later for upcoming events.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async =>
                ref.invalidate(registrationEventsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: events.length,
              itemBuilder: (context, index) {
                final event = events[index];
                final alreadyRegistered =
                    event.userParticipationStatus != null;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event.eventName,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (event.description != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            event.description!,
                            style: theme.textTheme.bodySmall,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Icon(Icons.calendar_today,
                                size: 14,
                                color: theme.colorScheme.onSurface
                                    .withValues(alpha: 0.5)),
                            const SizedBox(width: 4),
                            Text(
                              event.startDate.formattedDate,
                              style: theme.textTheme.bodySmall,
                            ),
                            const SizedBox(width: 16),
                            Icon(Icons.people,
                                size: 14,
                                color: theme.colorScheme.onSurface
                                    .withValues(alpha: 0.5)),
                            const SizedBox(width: 4),
                            Text(
                              '${event.participantCount}${event.maxParticipants != null ? '/${event.maxParticipants}' : ''}',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: alreadyRegistered
                              ? OutlinedButton.icon(
                                  onPressed: null,
                                  icon: const Icon(Icons.check),
                                  label: const Text('Registered'),
                                )
                              : ElevatedButton(
                                  onPressed: currentUser == null
                                      ? null
                                      : () => _register(
                                            context,
                                            ref,
                                            event.id,
                                            currentUser.volunteerId,
                                          ),
                                  child: const Text('Register'),
                                ),
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
          onRetry: () => ref.invalidate(registrationEventsProvider),
        ),
      ),
    );
  }

  Future<void> _register(
    BuildContext context,
    WidgetRef ref,
    String eventId,
    String volunteerId,
  ) async {
    try {
      await ref
          .read(eventRepositoryProvider)
          .registerForEvent(eventId, volunteerId);
      if (context.mounted) {
        context.showSuccessSnackBar('Successfully registered!');
        ref.invalidate(registrationEventsProvider);
        ref.invalidate(eventsProvider);
      }
    } catch (e) {
      if (context.mounted) {
        context.showSnackBar(e.toString(), isError: true);
      }
    }
  }
}
