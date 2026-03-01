import 'package:freezed_annotation/freezed_annotation.dart';

part 'audit_log.freezed.dart';
part 'audit_log.g.dart';

@freezed
abstract class AuditLog with _$AuditLog {
  const factory AuditLog({
    required String id,
    required String action,
    @JsonKey(name: 'actor_id') String? actorId,
    @JsonKey(name: 'target_type') String? targetType,
    @JsonKey(name: 'target_id') String? targetId,
    @Default({}) Map<String, dynamic> details,
    @JsonKey(name: 'created_at') String? createdAt,
    // Joined fields
    @JsonKey(name: 'actor_name') String? actorName,
  }) = _AuditLog;

  factory AuditLog.fromJson(Map<String, dynamic> json) =>
      _$AuditLogFromJson(json);
}
