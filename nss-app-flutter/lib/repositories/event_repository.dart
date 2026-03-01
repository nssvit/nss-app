import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class EventRepository {
  /// Fetch all active events with stats.
  Future<List<EventWithStats>> getEvents({String? currentVolunteerId}) async {
    final res = await supabase
        .from('events')
        .select('''
          *,
          event_categories(category_name, color_hex),
          event_participation(id, volunteer_id, participation_status)
        ''')
        .eq('is_active', true)
        .order('start_date', ascending: false);

    return (res as List).map((row) {
      final category = row['event_categories'];
      final participations = row['event_participation'] as List? ?? [];

      String? userStatus;
      if (currentVolunteerId != null) {
        for (final p in participations) {
          if (p['volunteer_id'] == currentVolunteerId) {
            userStatus = p['participation_status'] as String?;
            break;
          }
        }
      }

      return EventWithStats(
        id: row['id'] as String,
        eventName: (row['event_name'] as String?) ?? 'Untitled Event',
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
        isActive: row['is_active'] as bool? ?? true,
        createdBy: (row['created_by_volunteer_id'] as String?) ?? '',
        createdAt: row['created_at']?.toString(),
        updatedAt: row['updated_at']?.toString(),
        categoryName: category?['category_name'] as String?,
        categoryColor: category?['color_hex'] as String?,
        participantCount: participations.length,
        userParticipationStatus: userStatus,
      );
    }).toList();
  }

  /// Fetch a single event by ID with full details.
  Future<EventWithStats?> getEventById(String id) async {
    final res = await supabase
        .from('events')
        .select('''
          *,
          event_categories(category_name, color_hex),
          event_participation(id)
        ''')
        .eq('id', id)
        .maybeSingle();

    if (res == null) return null;

    final category = res['event_categories'];
    final participations = res['event_participation'] as List? ?? [];

    return EventWithStats(
      id: res['id'] as String,
      eventName: (res['event_name'] as String?) ?? 'Untitled Event',
      description: res['description'] as String?,
      startDate: res['start_date']?.toString() ?? '',
      endDate: res['end_date']?.toString() ?? '',
      location: res['location'] as String?,
      minParticipants: res['min_participants'] as int?,
      maxParticipants: res['max_participants'] as int?,
      eventStatus: (res['event_status'] as String?) ?? 'draft',
      declaredHours: (res['declared_hours'] as num?) ?? 0,
      categoryId: (res['category_id'] as int?) ?? 0,
      registrationDeadline: res['registration_deadline']?.toString(),
      isActive: res['is_active'] as bool? ?? true,
      createdBy: (res['created_by'] as String?) ?? '',
      createdAt: res['created_at']?.toString(),
      updatedAt: res['updated_at']?.toString(),
      categoryName: category?['category_name'] as String?,
      categoryColor: category?['color_hex'] as String?,
      participantCount: participations.length,
    );
  }

  /// Get events with registration open for self-registration.
  Future<List<EventWithStats>> getRegistrationOpenEvents() async {
    final events = await getEvents();
    return events
        .where((e) => e.eventStatus == 'registration_open')
        .toList();
  }

  /// Register the current user for an event.
  Future<void> registerForEvent(String eventId, String volunteerId) async {
    await supabase.from('event_participation').insert({
      'event_id': eventId,
      'volunteer_id': volunteerId,
      'participation_status': 'registered',
      'hours_attended': 0,
      'approval_status': 'pending',
    });
  }

  /// Get event participants.
  Future<List<EventParticipationWithVolunteer>> getEventParticipants(
      String eventId) async {
    final res = await supabase
        .from('event_participation')
        .select('''
          *,
          volunteers!event_participation_volunteer_id_volunteers_id_fk(first_name, last_name, email, roll_number)
        ''')
        .eq('event_id', eventId);

    return (res as List).map((row) {
      final vol = row['volunteers'];
      return EventParticipationWithVolunteer(
        id: row['id'] as String,
        eventId: row['event_id'] as String,
        volunteerId: row['volunteer_id'] as String,
        participationStatus: (row['participation_status'] as String?) ?? 'registered',
        hoursAttended: (row['hours_attended'] as num?) ?? 0,
        approvalStatus: (row['approval_status'] as String?) ?? 'pending',
        approvedBy: row['approved_by'] as String?,
        approvedAt: row['approved_at']?.toString(),
        approvalNotes: row['approval_notes'] as String?,
        notes: row['notes'] as String?,
        attendanceDate: row['attendance_date']?.toString(),
        recordedByVolunteerId: row['recorded_by_volunteer_id'] as String?,
        createdAt: row['created_at']?.toString(),
        registeredAt: row['registration_date']?.toString(),
        updatedAt: row['updated_at']?.toString(),
        volunteerName: vol != null
            ? '${(vol['first_name'] as String?) ?? ''} ${(vol['last_name'] as String?) ?? ''}'.trim()
            : null,
        volunteerEmail: vol?['email'] as String?,
        volunteerRollNumber: vol?['roll_number'] as String?,
      );
    }).toList();
  }

  /// Create a new event (admin/head only — RLS enforced).
  Future<Event> createEvent(Map<String, dynamic> data) async {
    final res = await supabase
        .from('events')
        .insert(data)
        .select()
        .single();
    return Event.fromJson(res);
  }

  /// Update an event.
  Future<void> updateEvent(String id, Map<String, dynamic> updates) async {
    updates['updated_at'] = DateTime.now().toIso8601String();
    await supabase.from('events').update(updates).eq('id', id);
  }

  /// Soft-delete an event.
  Future<void> deleteEvent(String id) async {
    await supabase
        .from('events')
        .update({
          'is_active': false,
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', id);
  }
}
