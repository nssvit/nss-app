import 'package:freezed_annotation/freezed_annotation.dart';

part 'reports.freezed.dart';
part 'reports.g.dart';

@freezed
abstract class CategoryDistribution with _$CategoryDistribution {
  const factory CategoryDistribution({
    @JsonKey(name: 'category_id') required int categoryId,
    @JsonKey(name: 'category_name') required String categoryName,
    @JsonKey(name: 'event_count') @Default(0) int eventCount,
    @JsonKey(name: 'color_hex') required String colorHex,
    @JsonKey(name: 'participant_count') @Default(0) int participantCount,
    @JsonKey(name: 'total_hours') @Default(0) num totalHours,
  }) = _CategoryDistribution;

  factory CategoryDistribution.fromJson(Map<String, dynamic> json) =>
      _$CategoryDistributionFromJson(json);
}

@freezed
abstract class TopEvent with _$TopEvent {
  const factory TopEvent({
    @JsonKey(name: 'event_id') required String eventId,
    @JsonKey(name: 'event_name') required String eventName,
    @JsonKey(name: 'start_date') String? startDate,
    @JsonKey(name: 'category_name') required String categoryName,
    @JsonKey(name: 'participant_count') @Default(0) int participantCount,
    @JsonKey(name: 'total_hours') @Default(0) num totalHours,
    @JsonKey(name: 'impact_score') String? impactScore,
    @JsonKey(name: 'event_status') required String eventStatus,
  }) = _TopEvent;

  factory TopEvent.fromJson(Map<String, dynamic> json) =>
      _$TopEventFromJson(json);
}

@freezed
abstract class VolunteerHoursSummary with _$VolunteerHoursSummary {
  const factory VolunteerHoursSummary({
    @JsonKey(name: 'volunteer_id') required String volunteerId,
    @JsonKey(name: 'volunteer_name') required String volunteerName,
    @JsonKey(name: 'total_hours') @Default(0) num totalHours,
    @JsonKey(name: 'approved_hours') @Default(0) num approvedHours,
    @JsonKey(name: 'events_count') @Default(0) int eventsCount,
    @JsonKey(name: 'last_activity') String? lastActivity,
  }) = _VolunteerHoursSummary;

  factory VolunteerHoursSummary.fromJson(Map<String, dynamic> json) =>
      _$VolunteerHoursSummaryFromJson(json);
}

@freezed
abstract class AttendanceSummary with _$AttendanceSummary {
  const factory AttendanceSummary({
    @JsonKey(name: 'event_id') required String eventId,
    @JsonKey(name: 'event_name') required String eventName,
    @JsonKey(name: 'start_date') String? startDate,
    @JsonKey(name: 'category_name') String? categoryName,
    @JsonKey(name: 'total_registered') @Default(0) int totalRegistered,
    @JsonKey(name: 'total_present') @Default(0) int totalPresent,
    @JsonKey(name: 'total_absent') @Default(0) int totalAbsent,
    @JsonKey(name: 'attendance_rate') @Default(0) num attendanceRate,
    @JsonKey(name: 'total_hours') @Default(0) num totalHours,
  }) = _AttendanceSummary;

  factory AttendanceSummary.fromJson(Map<String, dynamic> json) =>
      _$AttendanceSummaryFromJson(json);
}
