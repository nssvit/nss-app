import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class ReportsRepository {
  /// Category distribution — events per category with participant/hours counts.
  Future<List<CategoryDistribution>> getCategoryDistribution() async {
    final categories = await supabase
        .from('event_categories')
        .select('''
          id, category_name, color_hex,
          events(id, event_participation(id, hours_attended, approval_status))
        ''')
        .eq('is_active', true);

    return (categories as List).map((row) {
      final events = row['events'] as List? ?? [];
      int eventCount = events.length;
      int participantCount = 0;
      num totalHours = 0;

      for (final e in events) {
        final parts = e['event_participation'] as List? ?? [];
        participantCount += parts.length;
        for (final p in parts) {
          if (p['approval_status'] == 'approved') {
            totalHours += (p['hours_attended'] as num?) ?? 0;
          }
        }
      }

      return CategoryDistribution(
        categoryId: (row['id'] as int?) ?? 0,
        categoryName: (row['category_name'] as String?) ?? '',
        colorHex: (row['color_hex'] as String?) ?? '#000000',
        eventCount: eventCount,
        participantCount: participantCount,
        totalHours: totalHours,
      );
    }).toList();
  }

  /// Top events by impact (participant count * hours).
  Future<List<TopEvent>> getTopEvents({int limit = 10}) async {
    final events = await supabase
        .from('events')
        .select('''
          id, event_name, start_date, event_status,
          event_categories(category_name),
          event_participation(id, hours_attended, approval_status)
        ''')
        .eq('is_active', true)
        .order('start_date', ascending: false)
        .limit(50);

    final topEvents = (events as List).map((row) {
      final parts = row['event_participation'] as List? ?? [];
      int participantCount = parts.length;
      num totalHours = 0;
      for (final p in parts) {
        if (p['approval_status'] == 'approved') {
          totalHours += (p['hours_attended'] as num?) ?? 0;
        }
      }
      final impactScore = participantCount * totalHours.toDouble();

      return TopEvent(
        eventId: row['id'] as String,
        eventName: (row['event_name'] as String?) ?? '',
        startDate: row['start_date']?.toString(),
        categoryName:
            row['event_categories']?['category_name'] as String? ?? 'Unknown',
        participantCount: participantCount,
        totalHours: totalHours,
        impactScore: impactScore.toStringAsFixed(1),
        eventStatus: (row['event_status'] as String?) ?? 'draft',
      );
    }).toList();

    topEvents.sort((a, b) {
      final scoreA = double.tryParse(a.impactScore ?? '0') ?? 0;
      final scoreB = double.tryParse(b.impactScore ?? '0') ?? 0;
      return scoreB.compareTo(scoreA);
    });

    return topEvents.take(limit).toList();
  }

  /// Volunteer hours summary.
  Future<List<VolunteerHoursSummary>> getVolunteerHoursSummary() async {
    final volunteers = await supabase
        .from('volunteers')
        .select('''
          id, first_name, last_name,
          event_participation(hours_attended, approval_status, updated_at)
        ''')
        .eq('is_active', true);

    final summaries = <VolunteerHoursSummary>[];
    for (final row in volunteers as List) {
      final parts = row['event_participation'] as List? ?? [];
      if (parts.isEmpty) continue;

      num totalHours = 0;
      num approvedHours = 0;
      String? lastActivity;

      for (final p in parts) {
        final hours = (p['hours_attended'] as num?) ?? 0;
        final status = p['approval_status'] as String?;
        if (status != 'rejected') totalHours += hours;
        if (status == 'approved') approvedHours += hours;

        final updatedAt = p['updated_at']?.toString();
        if (updatedAt != null &&
            (lastActivity == null || updatedAt.compareTo(lastActivity) > 0)) {
          lastActivity = updatedAt;
        }
      }

      summaries.add(VolunteerHoursSummary(
        volunteerId: row['id'] as String,
        volunteerName: '${(row['first_name'] as String?) ?? ''} ${(row['last_name'] as String?) ?? ''}'.trim(),
        totalHours: totalHours,
        approvedHours: approvedHours,
        eventsCount: parts.length,
        lastActivity: lastActivity,
      ));
    }

    summaries.sort((a, b) => b.approvedHours.compareTo(a.approvedHours));
    return summaries;
  }
}
