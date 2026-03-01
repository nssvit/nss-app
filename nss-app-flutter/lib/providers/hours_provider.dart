import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/hours_repository.dart';

final hoursRepositoryProvider = Provider<HoursRepository>((ref) {
  return HoursRepository();
});

final pendingHoursProvider =
    FutureProvider.autoDispose<List<EventParticipationWithVolunteer>>((ref) async {
  final repo = ref.read(hoursRepositoryProvider);
  return repo.getPendingHours();
});
