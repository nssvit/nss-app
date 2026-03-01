import 'package:freezed_annotation/freezed_annotation.dart';

part 'current_user.freezed.dart';
part 'current_user.g.dart';

@freezed
abstract class CurrentUser with _$CurrentUser {
  const CurrentUser._();

  const factory CurrentUser({
    @JsonKey(name: 'volunteer_id') required String volunteerId,
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
    @Default([]) List<String> roles,
  }) = _CurrentUser;

  factory CurrentUser.fromJson(Map<String, dynamic> json) =>
      _$CurrentUserFromJson(json);

  String get fullName => '$firstName $lastName';

  bool hasRole(String role) => roles.contains(role);

  bool hasAnyRole(List<String> checkRoles) =>
      checkRoles.any((role) => roles.contains(role));

  bool get isAdmin => hasRole('admin');
  bool get isHead => hasRole('head');
  bool get isAdminOrHead => isAdmin || isHead;
}
