import '../core/services/api_client.dart';
import '../models/models.dart';

class CategoryRepository {
  /// Fetch all active event categories.
  Future<List<EventCategory>> getCategories() async {
    final data = await apiClient.get('/api/categories');
    return (data as List)
        .map((row) => EventCategory.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Create a new category.
  Future<EventCategory> createCategory(Map<String, dynamic> data) async {
    final res = await apiClient.post('/api/categories', body: data);
    return EventCategory.fromJson(res as Map<String, dynamic>);
  }

  /// Update a category.
  Future<void> updateCategory(int id, Map<String, dynamic> updates) async {
    await apiClient.put('/api/categories/$id', body: updates);
  }

  /// Soft-delete a category.
  Future<void> deleteCategory(int id) async {
    await apiClient.delete('/api/categories/$id');
  }
}
