import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class AuditRepository {
  /// Fetch audit logs with optional filtering.
  Future<List<AuditLog>> getAuditLogs({
    String? action,
    int limit = 50,
  }) async {
    var query = supabase
        .from('audit_logs')
        .select('''
          *,
          volunteers!audit_logs_actor_id_fkey(first_name, last_name)
        ''');

    if (action != null && action.isNotEmpty) {
      query = query.eq('action', action);
    }

    final res = await query
        .order('created_at', ascending: false)
        .limit(limit);

    return (res as List).map((row) {
      final actor = row['volunteers'];
      return AuditLog(
        id: row['id'] as String,
        action: (row['action'] as String?) ?? '',
        actorId: row['actor_id'] as String?,
        targetType: row['target_type'] as String?,
        targetId: row['target_id'] as String?,
        details: (row['details'] as Map<String, dynamic>?) ?? {},
        createdAt: row['created_at']?.toString(),
        actorName: actor != null
            ? '${(actor['first_name'] as String?) ?? ''} ${(actor['last_name'] as String?) ?? ''}'.trim()
            : null,
      );
    }).toList();
  }

  /// Get distinct action types for filter chips.
  Future<List<String>> getDistinctActions() async {
    final res = await supabase
        .from('audit_logs')
        .select('action')
        .order('action');

    final actions = <String>{};
    for (final row in res as List) {
      final action = row['action'] as String?;
      if (action != null) actions.add(action);
    }
    return actions.toList();
  }
}
