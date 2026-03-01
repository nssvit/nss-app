import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_constants.dart';
import '../../core/extensions/context_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../providers/auth_provider.dart';
import '../../providers/roles_provider.dart';
import '../../providers/volunteers_provider.dart';

class RoleManagementScreen extends ConsumerWidget {
  const RoleManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Role Management'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.go('/dashboard'),
          ),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Definitions'),
              Tab(text: 'Assignments'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _DefinitionsTab(),
            _AssignmentsTab(),
          ],
        ),
      ),
    );
  }
}

class _DefinitionsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rolesAsync = ref.watch(roleDefinitionsProvider);
    final theme = Theme.of(context);

    return rolesAsync.when(
      data: (roles) => RefreshIndicator(
        onRefresh: () async => ref.invalidate(roleDefinitionsProvider),
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: roles.length,
          itemBuilder: (context, index) {
            final role = roles[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor:
                      (roleColors[role.roleName] ?? theme.colorScheme.primary)
                          .withValues(alpha: 0.2),
                  child: Icon(
                    Icons.shield,
                    color:
                        roleColors[role.roleName] ?? theme.colorScheme.primary,
                  ),
                ),
                title: Text(role.displayName),
                subtitle: Text(role.description ?? role.roleName),
                trailing: Text(
                  'Level ${role.hierarchyLevel}',
                  style: theme.textTheme.bodySmall,
                ),
              ),
            );
          },
        ),
      ),
      loading: () => const ShimmerList(itemCount: 4, itemHeight: 72),
      error: (e, _) => AppError(
        message: e.toString(),
        onRetry: () => ref.invalidate(roleDefinitionsProvider),
      ),
    );
  }
}

class _AssignmentsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assignmentsAsync = ref.watch(userRolesProvider);
    final volunteersAsync = ref.watch(volunteersProvider);
    final theme = Theme.of(context);

    return Scaffold(
      body: assignmentsAsync.when(
        data: (assignments) {
          if (assignments.isEmpty) {
            return const EmptyState(
              icon: Icons.assignment_ind,
              title: 'No role assignments',
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(userRolesProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: assignments.length,
              itemBuilder: (context, index) {
                final a = assignments[index];
                final roleName =
                    a.roleDefinition?.displayName ?? 'Unknown Role';
                final color = roleColors[a.roleDefinition?.roleName] ??
                    theme.colorScheme.primary;

                final volunteerName = volunteersAsync.whenOrNull(
                  data: (vols) {
                    final v = vols.where((v) => v.id == a.volunteerId).firstOrNull;
                    return v != null ? '${v.firstName} ${v.lastName}' : null;
                  },
                );

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(volunteerName ?? 'Volunteer ${a.volunteerId.substring(0, 8)}...'),
                    subtitle: Text(roleName),
                    trailing: IconButton(
                      icon: Icon(Icons.remove_circle,
                          color: theme.colorScheme.error),
                      onPressed: () => _revokeRole(context, ref, a.id),
                    ),
                    leading: CircleAvatar(
                      backgroundColor: color.withValues(alpha: 0.2),
                      child: Icon(Icons.person, color: color),
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const ShimmerList(itemCount: 4, itemHeight: 72),
        error: (e, _) => AppError(
          message: e.toString(),
          onRetry: () => ref.invalidate(userRolesProvider),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAssignDialog(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _revokeRole(
      BuildContext context, WidgetRef ref, String userRoleId) async {
    final confirm = await ConfirmDialog.show(
      context,
      title: 'Revoke Role',
      message: 'Are you sure you want to revoke this role assignment?',
      isDestructive: true,
    );
    if (confirm != true) return;

    try {
      await ref.read(roleRepositoryProvider).revokeRole(userRoleId);
      ref.invalidate(userRolesProvider);
      if (context.mounted) {
        context.showSuccessSnackBar('Role revoked');
      }
    } catch (e) {
      if (context.mounted) {
        context.showSnackBar(e.toString(), isError: true);
      }
    }
  }

  Future<void> _showAssignDialog(BuildContext context, WidgetRef ref) async {
    final roles = await ref.read(roleDefinitionsProvider.future);
    final volunteers = await ref.read(volunteersProvider.future);
    final currentUser = ref.read(currentUserProvider);

    if (!context.mounted) return;

    String? selectedVolunteerId;
    String? selectedRoleId;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Assign Role'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Volunteer'),
                items: volunteers
                    .map((v) => DropdownMenuItem(
                          value: v.id,
                          child: Text('${v.firstName} ${v.lastName}'),
                        ))
                    .toList(),
                onChanged: (v) =>
                    setState(() => selectedVolunteerId = v),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Role'),
                items: roles
                    .map((r) => DropdownMenuItem(
                          value: r.id,
                          child: Text(r.displayName),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => selectedRoleId = v),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: selectedVolunteerId == null || selectedRoleId == null
                  ? null
                  : () async {
                      await ref.read(roleRepositoryProvider).assignRole(
                            volunteerId: selectedVolunteerId!,
                            roleDefinitionId: selectedRoleId!,
                            assignedBy: currentUser?.volunteerId ?? '',
                          );
                      ref.invalidate(userRolesProvider);
                      if (ctx.mounted) Navigator.pop(ctx);
                    },
              child: const Text('Assign'),
            ),
          ],
        ),
      ),
    );
  }
}
