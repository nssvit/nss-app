import 'package:freezed_annotation/freezed_annotation.dart';

part 'dashboard_stats.freezed.dart';
part 'dashboard_stats.g.dart';

@freezed
abstract class DashboardStats with _$DashboardStats {
  const factory DashboardStats({
    @JsonKey(name: 'total_events') @Default(0) int totalEvents,
    @JsonKey(name: 'active_volunteers') @Default(0) int activeVolunteers,
    @JsonKey(name: 'total_hours') @Default(0) num totalHours,
    @JsonKey(name: 'ongoing_projects') @Default(0) int ongoingProjects,
  }) = _DashboardStats;

  factory DashboardStats.fromJson(Map<String, dynamic> json) =>
      _$DashboardStatsFromJson(json);
}

@freezed
abstract class ActivityTrend with _$ActivityTrend {
  const factory ActivityTrend({
    required String month,
    @JsonKey(name: 'month_number') required int monthNumber,
    @JsonKey(name: 'year_number') required int yearNumber,
    @JsonKey(name: 'events_count') @Default(0) int eventsCount,
    @JsonKey(name: 'volunteers_count') @Default(0) int volunteersCount,
    @JsonKey(name: 'hours_sum') @Default(0) num hoursSum,
  }) = _ActivityTrend;

  factory ActivityTrend.fromJson(Map<String, dynamic> json) =>
      _$ActivityTrendFromJson(json);
}

@freezed
abstract class UserStats with _$UserStats {
  const factory UserStats({
    @JsonKey(name: 'total_users') @Default(0) int totalUsers,
    @JsonKey(name: 'active_users') @Default(0) int activeUsers,
    @JsonKey(name: 'pending_users') @Default(0) int pendingUsers,
    @JsonKey(name: 'admin_count') @Default(0) int adminCount,
  }) = _UserStats;

  factory UserStats.fromJson(Map<String, dynamic> json) =>
      _$UserStatsFromJson(json);
}
