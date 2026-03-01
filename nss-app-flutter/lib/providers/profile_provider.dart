import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import 'auth_provider.dart';
import 'volunteers_provider.dart';

final profileParticipationsProvider =
    FutureProvider.autoDispose<List<EventParticipationWithEvent>>((ref) async {
  final currentUser = ref.watch(currentUserProvider);
  if (currentUser == null) return [];

  final repo = ref.read(volunteerRepositoryProvider);
  return repo.getParticipationHistory(currentUser.volunteerId);
});
