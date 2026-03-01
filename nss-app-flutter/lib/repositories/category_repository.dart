import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class CategoryRepository {
  /// Fetch all active event categories.
  Future<List<EventCategory>> getCategories() async {
    final res = await supabase
        .from('event_categories')
        .select()
        .eq('is_active', true)
        .order('category_name');

    return (res as List)
        .map((row) => EventCategory.fromJson(row))
        .toList();
  }

  /// Create a new category.
  Future<EventCategory> createCategory(Map<String, dynamic> data) async {
    final res = await supabase
        .from('event_categories')
        .insert(data)
        .select()
        .single();
    return EventCategory.fromJson(res);
  }

  /// Update a category.
  Future<void> updateCategory(int id, Map<String, dynamic> updates) async {
    updates['updated_at'] = DateTime.now().toIso8601String();
    await supabase.from('event_categories').update(updates).eq('id', id);
  }

  /// Soft-delete a category.
  Future<void> deleteCategory(int id) async {
    await supabase
        .from('event_categories')
        .update({
          'is_active': false,
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', id);
  }
}
