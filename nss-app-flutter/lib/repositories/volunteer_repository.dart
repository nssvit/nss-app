import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class VolunteerRepository {
  /// Fetch all active volunteers with stats.
  /// Uses RPC or manual join since Supabase doesn't support aggregates in select.
  Future<List<VolunteerWithStats>> getVolunteers() async {
    final res = await supabase
        .from('volunteers')
        .select()
        .eq('is_active', true)
        .order('first_name');

    final volunteers = <VolunteerWithStats>[];
    for (final row in res as List) {
      final volunteerId = row['id'] as String;

      // Get participation stats
      final statsRes = await supabase
          .from('event_participation')
          .select('id, hours_attended, approval_status')
          .eq('volunteer_id', volunteerId);

      final participations = statsRes as List;
      final eventsParticipated = participations.length;
      num totalHours = 0;
      num approvedHours = 0;
      for (final p in participations) {
        final hours = (p['hours_attended'] as num?) ?? 0;
        final status = p['approval_status'] as String?;
        if (status != 'rejected') totalHours += hours;
        if (status == 'approved') approvedHours += hours;
      }

      // Get top role
      final roleRes = await supabase
          .from('user_roles')
          .select('role_definitions(role_name, hierarchy_level)')
          .eq('volunteer_id', volunteerId)
          .eq('is_active', true);

      String? roleName;
      int topLevel = -1;
      for (final r in roleRes as List) {
        final rd = r['role_definitions'];
        if (rd != null) {
          final level = rd['hierarchy_level'] as int? ?? 0;
          if (level > topLevel) {
            topLevel = level;
            roleName = rd['role_name'] as String?;
          }
        }
      }

      volunteers.add(VolunteerWithStats(
        id: volunteerId,
        firstName: (row['first_name'] as String?) ?? '',
        lastName: (row['last_name'] as String?) ?? '',
        email: (row['email'] as String?) ?? '',
        rollNumber: (row['roll_number'] as String?) ?? '',
        branch: (row['branch'] as String?) ?? '',
        year: (row['year'] as String?) ?? '',
        phoneNo: row['phone_no'] as String?,
        birthDate: row['birth_date']?.toString(),
        gender: row['gender'] as String?,
        nssJoinYear: row['nss_join_year'] as int?,
        address: row['address'] as String?,
        profilePic: row['profile_pic'] as String?,
        isActive: row['is_active'] as bool? ?? true,
        authUserId: row['auth_user_id'] as String?,
        createdAt: row['created_at']?.toString(),
        updatedAt: row['updated_at']?.toString(),
        eventsParticipated: eventsParticipated,
        totalHours: totalHours,
        approvedHours: approvedHours,
        roleName: roleName,
      ));
    }
    return volunteers;
  }

  /// Fetch a single volunteer by ID.
  Future<Volunteer?> getVolunteerById(String id) async {
    final res = await supabase
        .from('volunteers')
        .select()
        .eq('id', id)
        .maybeSingle();

    if (res == null) return null;
    return Volunteer.fromJson(res);
  }

  /// Update a volunteer's profile.
  Future<void> updateVolunteer(String id, Map<String, dynamic> updates) async {
    updates['updated_at'] = DateTime.now().toIso8601String();
    await supabase.from('volunteers').update(updates).eq('id', id);
  }

  /// Get volunteer participation history.
  Future<List<EventParticipationWithEvent>> getParticipationHistory(
      String volunteerId) async {
    final res = await supabase
        .from('event_participation')
        .select('''
          *,
          events(event_name, start_date, event_categories(category_name))
        ''')
        .eq('volunteer_id', volunteerId)
        .order('created_at', ascending: false);

    return (res as List).map((row) {
      final event = row['events'];
      return EventParticipationWithEvent(
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
        createdAt: row['created_at']?.toString(),
        registeredAt: row['registered_at']?.toString(),
        updatedAt: row['updated_at']?.toString(),
        eventName: event?['event_name'] as String?,
        startDate: event?['start_date']?.toString(),
        categoryName: event?['event_categories']?['category_name'] as String?,
      );
    }).toList();
  }
}
