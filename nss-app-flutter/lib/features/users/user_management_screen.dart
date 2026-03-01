import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_constants.dart';
import '../../core/widgets/widgets.dart';
import '../../providers/volunteers_provider.dart';

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() =>
      _UserManagementScreenState();
}

class _UserManagementScreenState extends ConsumerState<UserManagementScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final volunteersAsync = ref.watch(volunteersProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search users...',
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: (v) => setState(() => _searchQuery = v),
            ),
          ),
          Expanded(
            child: volunteersAsync.when(
              data: (volunteers) {
                var filtered = volunteers;
                if (_searchQuery.isNotEmpty) {
                  final q = _searchQuery.toLowerCase();
                  filtered = volunteers
                      .where((v) =>
                          v.firstName.toLowerCase().contains(q) ||
                          v.lastName.toLowerCase().contains(q) ||
                          v.email.toLowerCase().contains(q))
                      .toList();
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.invalidate(volunteersProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final v = filtered[index];
                      final hasAuth = v.authUserId != null;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: hasAuth
                                ? theme.colorScheme.primary
                                    .withValues(alpha: 0.1)
                                : theme.colorScheme.error
                                    .withValues(alpha: 0.1),
                            child: Icon(
                              hasAuth
                                  ? Icons.person
                                  : Icons.person_off,
                              color: hasAuth
                                  ? theme.colorScheme.primary
                                  : theme.colorScheme.error,
                            ),
                          ),
                          title: Text('${v.firstName} ${v.lastName}'),
                          subtitle: Text(
                            '${v.email}\n${v.rollNumber} | ${v.branch}',
                          ),
                          isThreeLine: true,
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (v.roleName != null)
                                StatusBadge(
                                  label: roleDisplayNames[v.roleName] ??
                                      v.roleName!,
                                  color: roleColors[v.roleName] ??
                                      const Color(0xFF22C55E),
                                  fontSize: 10,
                                ),
                              const SizedBox(height: 4),
                              StatusBadge(
                                label:
                                    hasAuth ? 'Linked' : 'Unlinked',
                                color: hasAuth
                                    ? const Color(0xFF22C55E)
                                    : const Color(0xFFEF4444),
                                fontSize: 10,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => AppError(
                message: e.toString(),
                onRetry: () => ref.invalidate(volunteersProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
