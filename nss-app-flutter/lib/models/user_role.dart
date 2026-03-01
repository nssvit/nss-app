import 'package:freezed_annotation/freezed_annotation.dart';
import 'role_definition.dart';

part 'user_role.freezed.dart';
part 'user_role.g.dart';

@freezed
abstract class UserRole with _$UserRole {
  const factory UserRole({
    required String id,
    @JsonKey(name: 'volunteer_id') required String volunteerId,
    @JsonKey(name: 'role_definition_id') required String roleDefinitionId,
    @JsonKey(name: 'assigned_by') String? assignedBy,
    @JsonKey(name: 'assigned_at') String? assignedAt,
    @JsonKey(name: 'expires_at') String? expiresAt,
    @JsonKey(name: 'is_active') bool? isActive,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _UserRole;

  factory UserRole.fromJson(Map<String, dynamic> json) =>
      _$UserRoleFromJson(json);
}

@freezed
abstract class UserRoleWithDefinition with _$UserRoleWithDefinition {
  const factory UserRoleWithDefinition({
    required String id,
    @JsonKey(name: 'volunteer_id') required String volunteerId,
    @JsonKey(name: 'role_definition_id') required String roleDefinitionId,
    @JsonKey(name: 'assigned_by') String? assignedBy,
    @JsonKey(name: 'assigned_at') String? assignedAt,
    @JsonKey(name: 'expires_at') String? expiresAt,
    @JsonKey(name: 'is_active') bool? isActive,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
    @JsonKey(name: 'role_definitions') RoleDefinition? roleDefinition,
  }) = _UserRoleWithDefinition;

  factory UserRoleWithDefinition.fromJson(Map<String, dynamic> json) =>
      _$UserRoleWithDefinitionFromJson(json);
}
