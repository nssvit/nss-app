import '../core/services/api_client.dart';
import '../models/models.dart';

class HoursRepository {
  /// Get all pending hours awaiting approval.
  Future<List<EventParticipationWithVolunteer>> getPendingHours() async {
    final data = await apiClient.get('/api/hours/pending');
    return (data as List).map((row) {
      final map = row as Map<String, dynamic>;
      final volunteer = map['volunteer'] as Map<String, dynamic>?;
      final event = map['event'] as Map<String, dynamic>?;

      return EventParticipationWithVolunteer(
        id: map['id'] as String,
        eventId: (map['event_id'] as String?) ?? '',
        volunteerId: (map['volunteer_id'] as String?) ?? '',
        participationStatus: (map['participation_status'] as String?) ?? 'registered',
        hoursAttended: (map['hours_attended'] as num?) ?? 0,
        approvalStatus: (map['approval_status'] as String?) ?? 'pending',
        approvedBy: map['approved_by'] as String?,
        approvedAt: map['approved_at']?.toString(),
        approvalNotes: map['approval_notes'] as String?,
        notes: map['notes'] as String?,
        attendanceDate: map['attendance_date']?.toString(),
        recordedByVolunteerId: map['recorded_by_volunteer_id'] as String?,
        createdAt: map['created_at']?.toString(),
        updatedAt: map['updated_at']?.toString(),
        volunteerName: volunteer != null
            ? '${(volunteer['first_name'] as String?) ?? ''} ${(volunteer['last_name'] as String?) ?? ''}'.trim()
            : null,
        volunteerEmail: volunteer?['email'] as String?,
        volunteerRollNumber: volunteer?['roll_number'] as String?,
      );
    }).toList();
  }

  /// Approve hours for a participation record.
  Future<void> approveHours({
    required String participationId,
    required String approvedBy,
    String? notes,
  }) async {
    await apiClient.post('/api/hours/approve', body: {
      'participation_id': participationId,
      if (notes != null) 'notes': notes,
    });
  }

  /// Reject hours for a participation record.
  Future<void> rejectHours({
    required String participationId,
    required String approvedBy,
    String? notes,
  }) async {
    await apiClient.post('/api/hours/reject', body: {
      'participation_id': participationId,
      if (notes != null) 'notes': notes,
    });
  }
}
