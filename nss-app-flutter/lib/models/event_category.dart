import 'package:freezed_annotation/freezed_annotation.dart';

part 'event_category.freezed.dart';
part 'event_category.g.dart';

@freezed
abstract class EventCategory with _$EventCategory {
  const factory EventCategory({
    required int id,
    @JsonKey(name: 'category_name') required String categoryName,
    required String code,
    String? description,
    @JsonKey(name: 'color_hex') required String colorHex,
    @JsonKey(name: 'is_active') @Default(true) bool isActive,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _EventCategory;

  factory EventCategory.fromJson(Map<String, dynamic> json) =>
      _$EventCategoryFromJson(json);
}
