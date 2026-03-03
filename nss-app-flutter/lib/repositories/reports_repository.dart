import '../core/services/api_client.dart';
import '../models/models.dart';

class ReportsRepository {
  /// Category distribution — events per category with participant/hours counts.
  Future<List<CategoryDistribution>> getCategoryDistribution() async {
    final data = await apiClient.get('/api/reports/categories');
    return (data as List)
        .map((row) => CategoryDistribution.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Top events by impact (participant count * hours).
  Future<List<TopEvent>> getTopEvents({int limit = 10}) async {
    final data = await apiClient.get('/api/reports/top-events', queryParams: {
      'limit': limit.toString(),
    });
    return (data as List)
        .map((row) => TopEvent.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Volunteer hours summary.
  Future<List<VolunteerHoursSummary>> getVolunteerHoursSummary() async {
    final data = await apiClient.get('/api/reports/volunteer-hours');
    return (data as List)
        .map((row) => VolunteerHoursSummary.fromJson(row as Map<String, dynamic>))
        .toList();
  }
}
