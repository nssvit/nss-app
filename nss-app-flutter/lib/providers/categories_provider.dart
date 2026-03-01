import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/category_repository.dart';

final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  return CategoryRepository();
});

final categoriesProvider =
    FutureProvider.autoDispose<List<EventCategory>>((ref) async {
  final repo = ref.read(categoryRepositoryProvider);
  return repo.getCategories();
});
