import '../core/services/api_client.dart';
import '../models/models.dart';

class AttendanceRepository {
  /// Get attendance summary for all events.
  Future<List<AttendanceSummary>> getAttendanceSummary() async {
    final data = await apiClient.get('/api/reports/attendance-summary');
    return (data as List)
        .map((row) => AttendanceSummary.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Get events available for attendance marking.
  Future<List<EventWithStats>> getEventsForAttendance({int limit = 50}) async {
    final data = await apiClient.get('/api/attendance/events', queryParams: {
      'limit': limit.toString(),
    });
    // Response contains simplified event records
    return (data as List).map((row) {
      final map = row as Map<String, dynamic>;
      return EventWithStats(
        id: map['id'] as String,
        eventName: (map['event_name'] as String?) ?? '',
        startDate: map['start_date']?.toString() ?? '',
        endDate: '',
        eventStatus: '',
        declaredHours: (map['declared_hours'] as num?) ?? 0,
        categoryId: 0,
        isActive: true,
        createdBy: '',
        location: map['location'] as String?,
      );
    }).toList();
  }

  /// Bulk mark attendance for volunteers in an event.
  Future<void> syncAttendance({
    required String eventId,
    required List<String> presentVolunteerIds,
    required num declaredHours,
    required String recordedBy,
  }) async {
    await apiClient.post('/api/attendance/sync', body: {
      'event_id': eventId,
      'volunteer_ids': presentVolunteerIds,
      'status': 'present',
      'hours_attended': declaredHours,
    });
  }

  /// Update a single participation record.
  Future<void> updateParticipationStatus({
    required String participationId,
    required String status,
    num? hoursAttended,
    String? notes,
  }) async {
    await apiClient.patch('/api/attendance/participation/$participationId', body: {
      'participation_status': status,
      if (hoursAttended != null) 'hours_attended': hoursAttended,
      if (notes != null) 'notes': notes,
    });
  }
}
