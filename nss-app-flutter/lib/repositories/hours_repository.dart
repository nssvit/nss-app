import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class HoursRepository {
  /// Get all pending hours awaiting approval.
  Future<List<EventParticipationWithVolunteer>> getPendingHours() async {
    final res = await supabase
        .from('event_participation')
        .select('''
          *,
          volunteers(first_name, last_name, email, roll_number),
          events(event_name)
        ''')
        .eq('approval_status', 'pending')
        .neq('participation_status', 'registered')
        .order('updated_at', ascending: false);

    return (res as List).map((row) {
      final vol = row['volunteers'];
      return EventParticipationWithVolunteer(
        id: row['id'] as String,
        eventId: row['event_id'] as String,
        volunteerId: row['volunteer_id'] as String,
        participationStatus: (row['participation_status'] as String?) ?? 'registered',
        hoursAttended: (row['hours_attended'] as num?) ?? 0,
        approvalStatus: row['approval_status'] as String? ?? 'pending',
        approvedBy: row['approved_by'] as String?,
        approvedAt: row['approved_at']?.toString(),
        approvalNotes: row['approval_notes'] as String?,
        notes: row['notes'] as String?,
        attendanceDate: row['attendance_date']?.toString(),
        recordedByVolunteerId: row['recorded_by_volunteer_id'] as String?,
        createdAt: row['created_at']?.toString(),
        registeredAt: row['registered_at']?.toString(),
        updatedAt: row['updated_at']?.toString(),
        volunteerName: vol != null
            ? '${(vol['first_name'] as String?) ?? ''} ${(vol['last_name'] as String?) ?? ''}'.trim()
            : null,
        volunteerEmail: vol?['email'] as String?,
        volunteerRollNumber: vol?['roll_number'] as String?,
      );
    }).toList();
  }

  /// Approve hours for a participation record.
  Future<void> approveHours({
    required String participationId,
    required String approvedBy,
    String? notes,
  }) async {
    await supabase.from('event_participation').update({
      'approval_status': 'approved',
      'approved_by': approvedBy,
      'approved_at': DateTime.now().toIso8601String(),
      'approval_notes': notes,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', participationId);
  }

  /// Reject hours for a participation record.
  Future<void> rejectHours({
    required String participationId,
    required String approvedBy,
    String? notes,
  }) async {
    await supabase.from('event_participation').update({
      'approval_status': 'rejected',
      'approved_by': approvedBy,
      'approved_at': DateTime.now().toIso8601String(),
      'approval_notes': notes,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', participationId);
  }
}
