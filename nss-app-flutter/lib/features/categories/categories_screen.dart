import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/extensions/context_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/categories_provider.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final currentUser = ref.watch(currentUserProvider);
    final isAdmin = currentUser?.isAdmin ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Event Categories'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: categoriesAsync.when(
        data: (categories) {
          if (categories.isEmpty) {
            return const EmptyState(
              icon: Icons.category_outlined,
              title: 'No categories',
              subtitle: 'Create categories to organize events.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(categoriesProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final cat = categories[index];
                final color = _parseColor(cat.colorHex);
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          cat.code,
                          style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ),
                    title: Text(cat.categoryName),
                    subtitle:
                        cat.description != null ? Text(cat.description!) : null,
                    trailing: isAdmin
                        ? IconButton(
                            icon: const Icon(Icons.edit, size: 18),
                            onPressed: () =>
                                _showEditDialog(context, ref, cat),
                          )
                        : null,
                  ),
                );
              },
            ),
          );
        },
        loading: () => const ShimmerList(itemCount: 5, itemHeight: 72),
        error: (e, _) => AppError(
          message: e.toString(),
          onRetry: () => ref.invalidate(categoriesProvider),
        ),
      ),
      floatingActionButton: isAdmin
          ? FloatingActionButton(
              onPressed: () => _showCreateDialog(context, ref),
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Color _parseColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }

  bool _isValidHexColor(String hex) {
    final cleaned = hex.replaceAll('#', '');
    if (cleaned.length != 6) return false;
    return RegExp(r'^[0-9A-Fa-f]{6}$').hasMatch(cleaned);
  }

  Future<void> _showCreateDialog(BuildContext context, WidgetRef ref) async {
    final nameController = TextEditingController();
    final codeController = TextEditingController();
    final descController = TextEditingController();
    final colorController = TextEditingController(text: '#6366F1');

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          final isValid = _isValidHexColor(colorController.text);
          final previewColor = isValid ? _parseColor(colorController.text) : Colors.grey;
          return AlertDialog(
            title: const Text('New Category'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Name'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: codeController,
                    decoration: const InputDecoration(labelText: 'Code'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descController,
                    decoration: const InputDecoration(labelText: 'Description'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: colorController,
                    decoration: InputDecoration(
                      labelText: 'Color (hex)',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: previewColor,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.grey.shade400),
                          ),
                        ),
                      ),
                      errorText: colorController.text.isNotEmpty && !isValid
                          ? 'Enter a valid hex color (e.g. #6366F1)'
                          : null,
                    ),
                    onChanged: (_) => setDialogState(() {}),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Create'),
              ),
            ],
          );
        },
      ),
    );

    if (result != true || !context.mounted) return;

    try {
      await ref.read(categoryRepositoryProvider).createCategory({
        'category_name': nameController.text,
        'code': codeController.text.toUpperCase(),
        'description': descController.text.isEmpty ? null : descController.text,
        'color_hex': colorController.text,
      });
      ref.invalidate(categoriesProvider);
      if (context.mounted) {
        context.showSuccessSnackBar('Category created');
      }
    } catch (e) {
      if (context.mounted) {
        context.showSnackBar(e.toString(), isError: true);
      }
    }
  }

  Future<void> _showEditDialog(
      BuildContext context, WidgetRef ref, EventCategory cat) async {
    final nameController = TextEditingController(text: cat.categoryName);
    final descController = TextEditingController(text: cat.description ?? '');
    final colorController = TextEditingController(text: cat.colorHex);

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          final isValid = _isValidHexColor(colorController.text);
          final previewColor = isValid ? _parseColor(colorController.text) : Colors.grey;
          return AlertDialog(
            title: const Text('Edit Category'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Name'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descController,
                    decoration: const InputDecoration(labelText: 'Description'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: colorController,
                    decoration: InputDecoration(
                      labelText: 'Color (hex)',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: previewColor,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.grey.shade400),
                          ),
                        ),
                      ),
                      errorText: colorController.text.isNotEmpty && !isValid
                          ? 'Enter a valid hex color (e.g. #6366F1)'
                          : null,
                    ),
                    onChanged: (_) => setDialogState(() {}),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Save'),
              ),
            ],
          );
        },
      ),
    );

    if (result != true || !context.mounted) return;

    try {
      await ref.read(categoryRepositoryProvider).updateCategory(cat.id, {
        'category_name': nameController.text,
        'description': descController.text.isEmpty ? null : descController.text,
        'color_hex': colorController.text,
      });
      ref.invalidate(categoriesProvider);
      if (context.mounted) {
        context.showSuccessSnackBar('Category updated');
      }
    } catch (e) {
      if (context.mounted) {
        context.showSnackBar(e.toString(), isError: true);
      }
    }
  }
}
