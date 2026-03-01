import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class AttendanceRepository {
  /// Get attendance summary for all events.
  Future<List<AttendanceSummary>> getAttendanceSummary() async {
    final events = await supabase
        .from('events')
        .select('''
          id, event_name, start_date,
          event_categories(category_name),
          event_participation(id, participation_status, hours_attended)
        ''')
        .eq('is_active', true)
        .order('start_date', ascending: false);

    return (events as List).map((row) {
      final participations = row['event_participation'] as List? ?? [];
      int totalRegistered = participations.length;
      int totalPresent = 0;
      int totalAbsent = 0;
      num totalHours = 0;

      for (final p in participations) {
        final status = p['participation_status'] as String?;
        if (status == 'present' || status == 'partially_present') {
          totalPresent++;
        } else if (status == 'absent') {
          totalAbsent++;
        }
        totalHours += (p['hours_attended'] as num?) ?? 0;
      }

      final rate = totalRegistered > 0
          ? (totalPresent / totalRegistered * 100)
          : 0.0;

      return AttendanceSummary(
        eventId: row['id'] as String,
        eventName: (row['event_name'] as String?) ?? '',
        startDate: row['start_date']?.toString(),
        categoryName: row['event_categories']?['category_name'] as String?,
        totalRegistered: totalRegistered,
        totalPresent: totalPresent,
        totalAbsent: totalAbsent,
        attendanceRate: rate,
        totalHours: totalHours,
      );
    }).toList();
  }

  /// Get events available for attendance marking.
  Future<List<EventWithStats>> getEventsForAttendance({int limit = 50}) async {
    final res = await supabase
        .from('events')
        .select('''
          *,
          event_categories(category_name, color_hex),
          event_participation(id)
        ''')
        .eq('is_active', true)
        .inFilter('event_status', ['ongoing', 'completed', 'registration_closed'])
        .order('start_date', ascending: false)
        .limit(limit);

    return (res as List).map((row) {
      final category = row['event_categories'];
      final participations = row['event_participation'] as List? ?? [];

      return EventWithStats(
        id: row['id'] as String,
        eventName: (row['event_name'] as String?) ?? '',
        description: row['description'] as String?,
        startDate: row['start_date']?.toString() ?? '',
        endDate: row['end_date']?.toString() ?? '',
        location: row['location'] as String?,
        minParticipants: row['min_participants'] as int?,
        maxParticipants: row['max_participants'] as int?,
        eventStatus: (row['event_status'] as String?) ?? 'draft',
        declaredHours: (row['declared_hours'] as num?) ?? 0,
        categoryId: (row['category_id'] as int?) ?? 0,
        registrationDeadline: row['registration_deadline']?.toString(),
        isActive: true,
        createdBy: (row['created_by'] as String?) ?? '',
        createdAt: row['created_at']?.toString(),
        updatedAt: row['updated_at']?.toString(),
        categoryName: category?['category_name'] as String?,
        categoryColor: category?['color_hex'] as String?,
        participantCount: participations.length,
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
    // Get all participants
    final existing = await supabase
        .from('event_participation')
        .select('id, volunteer_id, participation_status')
        .eq('event_id', eventId);

    for (final row in existing as List) {
      final volId = row['volunteer_id'] as String;
      final partId = row['id'] as String;
      final isPresent = presentVolunteerIds.contains(volId);

      await supabase.from('event_participation').update({
        'participation_status': isPresent ? 'present' : 'absent',
        'hours_attended': isPresent ? declaredHours : 0,
        'attendance_date': DateTime.now().toIso8601String(),
        'recorded_by_volunteer_id': recordedBy,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', partId);
    }
  }

  /// Update a single participation record.
  Future<void> updateParticipationStatus({
    required String participationId,
    required String status,
    num? hoursAttended,
    String? notes,
  }) async {
    final updates = <String, dynamic>{
      'participation_status': status,
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (hoursAttended != null) updates['hours_attended'] = hoursAttended;
    if (notes != null) updates['notes'] = notes;

    await supabase
        .from('event_participation')
        .update(updates)
        .eq('id', participationId);
  }
}
