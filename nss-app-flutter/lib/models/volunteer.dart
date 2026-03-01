import 'package:freezed_annotation/freezed_annotation.dart';

part 'volunteer.freezed.dart';
part 'volunteer.g.dart';

@freezed
abstract class Volunteer with _$Volunteer {
  const factory Volunteer({
    required String id,
    @JsonKey(name: 'first_name') required String firstName,
    @JsonKey(name: 'last_name') required String lastName,
    required String email,
    @JsonKey(name: 'roll_number') required String rollNumber,
    required String branch,
    required String year,
    @JsonKey(name: 'phone_no') String? phoneNo,
    @JsonKey(name: 'birth_date') String? birthDate,
    String? gender,
    @JsonKey(name: 'nss_join_year') int? nssJoinYear,
    String? address,
    @JsonKey(name: 'profile_pic') String? profilePic,
    @JsonKey(name: 'is_active') @Default(true) bool isActive,
    @JsonKey(name: 'auth_user_id') String? authUserId,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _Volunteer;

  factory Volunteer.fromJson(Map<String, dynamic> json) =>
      _$VolunteerFromJson(json);
}

@freezed
abstract class VolunteerWithStats with _$VolunteerWithStats {
  const factory VolunteerWithStats({
    required String id,
    @JsonKey(name: 'first_name') required String firstName,
    @JsonKey(name: 'last_name') required String lastName,
    required String email,
    @JsonKey(name: 'roll_number') required String rollNumber,
    required String branch,
    required String year,
    @JsonKey(name: 'phone_no') String? phoneNo,
    @JsonKey(name: 'birth_date') String? birthDate,
    String? gender,
    @JsonKey(name: 'nss_join_year') int? nssJoinYear,
    String? address,
    @JsonKey(name: 'profile_pic') String? profilePic,
    @JsonKey(name: 'is_active') @Default(true) bool isActive,
    @JsonKey(name: 'auth_user_id') String? authUserId,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
    @JsonKey(name: 'events_participated') @Default(0) int eventsParticipated,
    @JsonKey(name: 'total_hours') @Default(0) num totalHours,
    @JsonKey(name: 'approved_hours') @Default(0) num approvedHours,
    @JsonKey(name: 'role_name') String? roleName,
  }) = _VolunteerWithStats;

  factory VolunteerWithStats.fromJson(Map<String, dynamic> json) =>
      _$VolunteerWithStatsFromJson(json);
}
