import '../core/services/api_client.dart';
import '../models/models.dart';

class DashboardRepository {
  /// Fetch dashboard stats (total events, active volunteers, total hours, ongoing).
  Future<DashboardStats> getDashboardStats() async {
    final data = await apiClient.get('/api/dashboard/stats');
    return DashboardStats.fromJson(data as Map<String, dynamic>);
  }

  /// Fetch monthly activity trends.
  Future<List<ActivityTrend>> getMonthlyTrends() async {
    final data = await apiClient.get('/api/dashboard/trends');
    return (data as List)
        .map((row) => ActivityTrend.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Fetch volunteer-specific dashboard stats (own participation history).
  Future<Map<String, dynamic>> getVolunteerDashboardData(
      String volunteerId) async {
    final data = await apiClient.get('/api/dashboard/volunteer');
    final list = data as List;

    int eventsParticipated = list.length;
    num totalHours = 0;
    num approvedHours = 0;

    for (final p in list) {
      final hours = (p['hours_attended'] as num?) ?? 0;
      final status = p['approval_status'] as String?;
      if (status != 'rejected') totalHours += hours;
      if (status == 'approved') approvedHours += hours;
    }

    return {
      'eventsParticipated': eventsParticipated,
      'totalHours': totalHours,
      'approvedHours': approvedHours,
      'participations': list,
    };
  }
}
