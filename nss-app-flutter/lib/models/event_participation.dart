import 'package:freezed_annotation/freezed_annotation.dart';

part 'event_participation.freezed.dart';
part 'event_participation.g.dart';

@freezed
abstract class EventParticipation with _$EventParticipation {
  const factory EventParticipation({
    required String id,
    @JsonKey(name: 'event_id') required String eventId,
    @JsonKey(name: 'volunteer_id') required String volunteerId,
    @JsonKey(name: 'participation_status') required String participationStatus,
    @JsonKey(name: 'hours_attended') @Default(0) num hoursAttended,
    @JsonKey(name: 'approval_status') @Default('pending') String approvalStatus,
    @JsonKey(name: 'approved_by') String? approvedBy,
    @JsonKey(name: 'approved_at') String? approvedAt,
    @JsonKey(name: 'approval_notes') String? approvalNotes,
    String? notes,
    @JsonKey(name: 'attendance_date') String? attendanceDate,
    @JsonKey(name: 'recorded_by_volunteer_id') String? recordedByVolunteerId,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'registered_at') String? registeredAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _EventParticipation;

  factory EventParticipation.fromJson(Map<String, dynamic> json) =>
      _$EventParticipationFromJson(json);
}

@freezed
abstract class EventParticipationWithVolunteer with _$EventParticipationWithVolunteer {
  const factory EventParticipationWithVolunteer({
    required String id,
    @JsonKey(name: 'event_id') required String eventId,
    @JsonKey(name: 'volunteer_id') required String volunteerId,
    @JsonKey(name: 'participation_status') required String participationStatus,
    @JsonKey(name: 'hours_attended') @Default(0) num hoursAttended,
    @JsonKey(name: 'approval_status') @Default('pending') String approvalStatus,
    @JsonKey(name: 'approved_by') String? approvedBy,
    @JsonKey(name: 'approved_at') String? approvedAt,
    @JsonKey(name: 'approval_notes') String? approvalNotes,
    String? notes,
    @JsonKey(name: 'attendance_date') String? attendanceDate,
    @JsonKey(name: 'recorded_by_volunteer_id') String? recordedByVolunteerId,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'registered_at') String? registeredAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
    @JsonKey(name: 'volunteer_name') String? volunteerName,
    @JsonKey(name: 'volunteer_email') String? volunteerEmail,
    @JsonKey(name: 'volunteer_roll_number') String? volunteerRollNumber,
  }) = _EventParticipationWithVolunteer;

  factory EventParticipationWithVolunteer.fromJson(Map<String, dynamic> json) =>
      _$EventParticipationWithVolunteerFromJson(json);
}

@freezed
abstract class EventParticipationWithEvent with _$EventParticipationWithEvent {
  const factory EventParticipationWithEvent({
    required String id,
    @JsonKey(name: 'event_id') required String eventId,
    @JsonKey(name: 'volunteer_id') required String volunteerId,
    @JsonKey(name: 'participation_status') required String participationStatus,
    @JsonKey(name: 'hours_attended') @Default(0) num hoursAttended,
    @JsonKey(name: 'approval_status') @Default('pending') String approvalStatus,
    @JsonKey(name: 'approved_by') String? approvedBy,
    @JsonKey(name: 'approved_at') String? approvedAt,
    @JsonKey(name: 'approval_notes') String? approvalNotes,
    String? notes,
    @JsonKey(name: 'attendance_date') String? attendanceDate,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'registered_at') String? registeredAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
    @JsonKey(name: 'event_name') String? eventName,
    @JsonKey(name: 'start_date') String? startDate,
    @JsonKey(name: 'category_name') String? categoryName,
    @JsonKey(name: 'approved_hours') num? approvedHours,
  }) = _EventParticipationWithEvent;

  factory EventParticipationWithEvent.fromJson(Map<String, dynamic> json) =>
      _$EventParticipationWithEventFromJson(json);
}
