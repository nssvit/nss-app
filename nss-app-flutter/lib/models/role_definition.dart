import 'package:freezed_annotation/freezed_annotation.dart';

part 'role_definition.freezed.dart';
part 'role_definition.g.dart';

@freezed
abstract class RoleDefinition with _$RoleDefinition {
  const factory RoleDefinition({
    required String id,
    @JsonKey(name: 'role_name') required String roleName,
    @JsonKey(name: 'display_name') required String displayName,
    String? description,
    @JsonKey(name: 'hierarchy_level') required int hierarchyLevel,
    @Default({}) Map<String, dynamic> permissions,
    @JsonKey(name: 'is_active') @Default(true) bool isActive,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _RoleDefinition;

  factory RoleDefinition.fromJson(Map<String, dynamic> json) =>
      _$RoleDefinitionFromJson(json);
}
