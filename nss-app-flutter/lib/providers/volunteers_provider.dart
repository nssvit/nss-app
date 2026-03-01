import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/volunteer_repository.dart';

final volunteerRepositoryProvider = Provider<VolunteerRepository>((ref) {
  return VolunteerRepository();
});

final volunteersProvider =
    FutureProvider.autoDispose<List<VolunteerWithStats>>((ref) async {
  final repo = ref.read(volunteerRepositoryProvider);
  return repo.getVolunteers();
});

final volunteerByIdProvider =
    FutureProvider.autoDispose.family<Volunteer?, String>((ref, id) async {
  final repo = ref.read(volunteerRepositoryProvider);
  return repo.getVolunteerById(id);
});

final participationHistoryProvider = FutureProvider.autoDispose
    .family<List<EventParticipationWithEvent>, String>((ref, volunteerId) async {
  final repo = ref.read(volunteerRepositoryProvider);
  return repo.getParticipationHistory(volunteerId);
});
