import 'package:freezed_annotation/freezed_annotation.dart';

part 'event.freezed.dart';
part 'event.g.dart';

@freezed
abstract class Event with _$Event {
  const factory Event({
    required String id,
    @JsonKey(name: 'event_name') required String eventName,
    String? description,
    @JsonKey(name: 'start_date') required String startDate,
    @JsonKey(name: 'end_date') required String endDate,
    String? location,
    @JsonKey(name: 'min_participants') int? minParticipants,
    @JsonKey(name: 'max_participants') int? maxParticipants,
    @JsonKey(name: 'event_status') required String eventStatus,
    @JsonKey(name: 'declared_hours') required num declaredHours,
    @JsonKey(name: 'category_id') required int categoryId,
    @JsonKey(name: 'registration_deadline') String? registrationDeadline,
    @JsonKey(name: 'is_active') @Default(true) bool isActive,
    @JsonKey(name: 'created_by') required String createdBy,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _Event;

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);
}

@freezed
abstract class EventWithStats with _$EventWithStats {
  const factory EventWithStats({
    required String id,
    @JsonKey(name: 'event_name') required String eventName,
    String? description,
    @JsonKey(name: 'start_date') required String startDate,
    @JsonKey(name: 'end_date') required String endDate,
    String? location,
    @JsonKey(name: 'min_participants') int? minParticipants,
    @JsonKey(name: 'max_participants') int? maxParticipants,
    @JsonKey(name: 'event_status') required String eventStatus,
    @JsonKey(name: 'declared_hours') required num declaredHours,
    @JsonKey(name: 'category_id') required int categoryId,
    @JsonKey(name: 'registration_deadline') String? registrationDeadline,
    @JsonKey(name: 'is_active') @Default(true) bool isActive,
    @JsonKey(name: 'created_by') required String createdBy,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
    @JsonKey(name: 'category_name') String? categoryName,
    @JsonKey(name: 'category_color') String? categoryColor,
    @JsonKey(name: 'participant_count') @Default(0) int participantCount,
    @JsonKey(name: 'total_hours') @Default(0) num totalHours,
    @JsonKey(name: 'user_participation_status') String? userParticipationStatus,
  }) = _EventWithStats;

  factory EventWithStats.fromJson(Map<String, dynamic> json) =>
      _$EventWithStatsFromJson(json);
}
