import '../core/services/api_client.dart';
import '../models/models.dart';

class VolunteerRepository {
  /// Fetch all active volunteers with stats.
  /// Server-side join eliminates the N+1 problem from the old Supabase version.
  Future<List<VolunteerWithStats>> getVolunteers() async {
    final data = await apiClient.get('/api/volunteers');
    return (data as List)
        .map((row) => VolunteerWithStats.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Fetch a single volunteer by ID.
  Future<Volunteer?> getVolunteerById(String id) async {
    try {
      final data = await apiClient.get('/api/volunteers/$id');
      return Volunteer.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.isNotFound) return null;
      rethrow;
    }
  }

  /// Update a volunteer's profile.
  Future<void> updateVolunteer(String id, Map<String, dynamic> updates) async {
    await apiClient.put('/api/volunteers/$id', body: updates);
  }

  /// Get volunteer participation history.
  Future<List<EventParticipationWithEvent>> getParticipationHistory(
      String volunteerId) async {
    final data = await apiClient.get('/api/volunteers/$volunteerId/participation');
    return (data as List)
        .map((row) => EventParticipationWithEvent.fromJson(row as Map<String, dynamic>))
        .toList();
  }
}
