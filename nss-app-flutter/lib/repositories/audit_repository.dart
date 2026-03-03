import '../core/services/api_client.dart';
import '../models/models.dart';

class AuditRepository {
  /// Fetch audit logs with optional filtering.
  Future<List<AuditLog>> getAuditLogs({
    String? action,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
    };
    if (action != null && action.isNotEmpty) {
      queryParams['action'] = action;
    }

    final data = await apiClient.get('/api/audit', queryParams: queryParams);
    return (data as List)
        .map((row) => AuditLog.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Get distinct action types for filter chips.
  Future<List<String>> getDistinctActions() async {
    final data = await apiClient.get('/api/audit/actions');
    return (data as List).cast<String>();
  }
}
