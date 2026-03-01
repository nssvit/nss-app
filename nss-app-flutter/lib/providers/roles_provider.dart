import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/role_repository.dart';

final roleRepositoryProvider = Provider<RoleRepository>((ref) {
  return RoleRepository();
});

final roleDefinitionsProvider =
    FutureProvider.autoDispose<List<RoleDefinition>>((ref) async {
  final repo = ref.read(roleRepositoryProvider);
  return repo.getRoleDefinitions();
});

final userRolesProvider =
    FutureProvider.autoDispose<List<UserRoleWithDefinition>>((ref) async {
  final repo = ref.read(roleRepositoryProvider);
  return repo.getUserRoles();
});
