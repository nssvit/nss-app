import '../core/services/api_client.dart';
import '../models/models.dart';

class EventRepository {
  /// Fetch all active events with stats.
  Future<List<EventWithStats>> getEvents({String? currentVolunteerId}) async {
    final data = await apiClient.get('/api/events');
    return (data as List)
        .map((row) => EventWithStats.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Fetch a single event by ID with full details.
  Future<EventWithStats?> getEventById(String id) async {
    try {
      final data = await apiClient.get('/api/events/$id');
      if (data == null) return null;
      final map = data as Map<String, dynamic>;

      // Build EventWithStats from the detailed response
      final participations = map['participations'] as List? ?? [];
      final category = map['category'] as Map<String, dynamic>?;

      return EventWithStats(
        id: map['id'] as String,
        eventName: (map['event_name'] as String?) ?? 'Untitled Event',
        description: map['description'] as String?,
        startDate: map['start_date']?.toString() ?? '',
        endDate: map['end_date']?.toString() ?? '',
        location: map['location'] as String?,
        minParticipants: map['min_participants'] as int?,
        maxParticipants: map['max_participants'] as int?,
        eventStatus: (map['event_status'] as String?) ?? 'draft',
        declaredHours: (map['declared_hours'] as num?) ?? 0,
        categoryId: (map['category_id'] as int?) ?? 0,
        registrationDeadline: map['registration_deadline']?.toString(),
        isActive: map['is_active'] as bool? ?? true,
        createdBy: (map['created_by_volunteer_id'] as String?) ?? '',
        createdAt: map['created_at']?.toString(),
        updatedAt: map['updated_at']?.toString(),
        categoryName: category?['category_name'] as String?,
        categoryColor: category?['color_hex'] as String?,
        participantCount: participations.length,
      );
    } on ApiException catch (e) {
      if (e.isNotFound) return null;
      rethrow;
    }
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
    await apiClient.post('/api/events/$eventId/register');
  }

  /// Get event participants.
  Future<List<EventParticipationWithVolunteer>> getEventParticipants(
      String eventId) async {
    final data = await apiClient.get('/api/events/$eventId/participants');
    return (data as List).map((row) {
      final map = row as Map<String, dynamic>;
      return EventParticipationWithVolunteer(
        id: (map['participant_id'] as String?) ?? '',
        eventId: eventId,
        volunteerId: (map['volunteer_id'] as String?) ?? '',
        participationStatus: (map['participation_status'] as String?) ?? 'registered',
        hoursAttended: (map['hours_attended'] as num?) ?? 0,
        approvalStatus: (map['approval_status'] as String?) ?? 'pending',
        approvedBy: map['approved_by'] as String?,
        approvedAt: map['approved_at']?.toString(),
        notes: map['notes'] as String?,
        attendanceDate: map['attendance_date']?.toString(),
        registeredAt: map['registration_date']?.toString(),
        volunteerName: map['volunteer_name'] as String?,
        volunteerRollNumber: map['roll_number'] as String?,
      );
    }).toList();
  }

  /// Create a new event.
  Future<Event> createEvent(Map<String, dynamic> data) async {
    final res = await apiClient.post('/api/events', body: data);
    // The API returns { success: true, event_id: "..." }
    // We need to fetch the full event to return it
    final eventId = (res as Map<String, dynamic>)['event_id'] as String?;
    if (eventId != null) {
      final event = await getEventById(eventId);
      if (event != null) {
        return Event(
          id: event.id,
          eventName: event.eventName,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          minParticipants: event.minParticipants,
          maxParticipants: event.maxParticipants,
          eventStatus: event.eventStatus,
          declaredHours: event.declaredHours,
          categoryId: event.categoryId,
          registrationDeadline: event.registrationDeadline,
          isActive: event.isActive,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        );
      }
    }
    // Fallback: return event from create data
    return Event(
      id: eventId ?? '',
      eventName: (data['event_name'] as String?) ?? '',
      startDate: data['start_date']?.toString() ?? '',
      endDate: data['end_date']?.toString() ?? '',
      eventStatus: (data['event_status'] as String?) ?? 'planned',
      declaredHours: (data['declared_hours'] as num?) ?? 0,
      categoryId: (data['category_id'] as int?) ?? 0,
      isActive: true,
      createdBy: '',
    );
  }

  /// Update an event.
  Future<void> updateEvent(String id, Map<String, dynamic> updates) async {
    await apiClient.put('/api/events/$id', body: updates);
  }

  /// Soft-delete an event.
  Future<void> deleteEvent(String id) async {
    await apiClient.delete('/api/events/$id');
  }
}
