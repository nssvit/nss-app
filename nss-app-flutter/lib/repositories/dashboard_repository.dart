import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class DashboardRepository {
  /// Fetch dashboard stats (total events, active volunteers, total hours, ongoing).
  Future<DashboardStats> getDashboardStats() async {
    // Total active events
    final eventsRes = await supabase
        .from('events')
        .select('id')
        .eq('is_active', true);

    // Active volunteers
    final volunteersRes = await supabase
        .from('volunteers')
        .select('id')
        .eq('is_active', true);

    // Total approved hours
    final hoursRes = await supabase
        .from('event_participation')
        .select('hours_attended')
        .eq('approval_status', 'approved');

    num totalHours = 0;
    for (final row in hoursRes as List) {
      totalHours += (row['hours_attended'] as num?) ?? 0;
    }

    // Ongoing events
    final ongoingRes = await supabase
        .from('events')
        .select('id')
        .eq('is_active', true)
        .eq('event_status', 'ongoing');

    return DashboardStats(
      totalEvents: (eventsRes as List).length,
      activeVolunteers: (volunteersRes as List).length,
      totalHours: totalHours,
      ongoingProjects: (ongoingRes as List).length,
    );
  }

  /// Fetch monthly activity trends.
  Future<List<ActivityTrend>> getMonthlyTrends() async {
    // Get events grouped by month using raw date extraction
    final eventsRes = await supabase
        .from('events')
        .select('start_date, id')
        .eq('is_active', true)
        .order('start_date');

    // Group events by month
    final monthMap = <String, ActivityTrend>{};

    for (final row in eventsRes as List) {
      final dateStr = row['start_date']?.toString();
      if (dateStr == null) continue;
      final dt = DateTime.tryParse(dateStr);
      if (dt == null) continue;

      final key = '${dt.year}-${dt.month.toString().padLeft(2, '0')}';
      final months = [
        '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      final existing = monthMap[key];
      if (existing != null) {
        monthMap[key] = existing.copyWith(
          eventsCount: existing.eventsCount + 1,
        );
      } else {
        monthMap[key] = ActivityTrend(
          month: months[dt.month],
          monthNumber: dt.month,
          yearNumber: dt.year,
          eventsCount: 1,
          volunteersCount: 0,
          hoursSum: 0,
        );
      }
    }

    return monthMap.values.toList()
      ..sort((a, b) {
        final yearCmp = a.yearNumber.compareTo(b.yearNumber);
        if (yearCmp != 0) return yearCmp;
        return a.monthNumber.compareTo(b.monthNumber);
      });
  }

  /// Fetch volunteer-specific dashboard stats.
  Future<Map<String, dynamic>> getVolunteerDashboardData(
      String volunteerId) async {
    final participations = await supabase
        .from('event_participation')
        .select('''
          *,
          events(event_name, start_date, event_status, event_categories(category_name))
        ''')
        .eq('volunteer_id', volunteerId);

    final list = participations as List;
    int eventsParticipated = list.length;
    num totalHours = 0;
    num approvedHours = 0;

    for (final p in list) {
      final hours = (p['hours_attended'] as num?) ?? 0;
      final status = p['approval_status'] as String?;
      if (status != 'rejected') totalHours += hours;
      if (status == 'approved') approvedHours += hours;
    }

    return {
      'eventsParticipated': eventsParticipated,
      'totalHours': totalHours,
      'approvedHours': approvedHours,
      'participations': list,
    };
  }
}
