import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/event_repository.dart';
import 'auth_provider.dart';

final eventRepositoryProvider = Provider<EventRepository>((ref) {
  return EventRepository();
});

final eventsProvider =
    FutureProvider.autoDispose<List<EventWithStats>>((ref) async {
  final repo = ref.read(eventRepositoryProvider);
  final currentUser = ref.watch(currentUserProvider);
  return repo.getEvents(currentVolunteerId: currentUser?.volunteerId);
});

final registrationEventsProvider =
    FutureProvider.autoDispose<List<EventWithStats>>((ref) async {
  final repo = ref.read(eventRepositoryProvider);
  return repo.getRegistrationOpenEvents();
});

final eventByIdProvider =
    FutureProvider.autoDispose.family<EventWithStats?, String>((ref, id) async {
  final repo = ref.read(eventRepositoryProvider);
  return repo.getEventById(id);
});

final eventParticipantsProvider = FutureProvider.autoDispose
    .family<List<EventParticipationWithVolunteer>, String>((ref, eventId) async {
  final repo = ref.read(eventRepositoryProvider);
  return repo.getEventParticipants(eventId);
});
