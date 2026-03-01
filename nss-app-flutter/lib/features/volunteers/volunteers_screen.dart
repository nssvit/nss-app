import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_constants.dart';
import '../../core/widgets/widgets.dart';
import '../../models/models.dart';
import '../../providers/volunteers_provider.dart';

class VolunteersScreen extends ConsumerStatefulWidget {
  const VolunteersScreen({super.key});

  @override
  ConsumerState<VolunteersScreen> createState() => _VolunteersScreenState();
}

class _VolunteersScreenState extends ConsumerState<VolunteersScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final volunteersAsync = ref.watch(volunteersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Volunteers'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: SearchBar(
              hintText: 'Search volunteers...',
              leading: const Icon(Icons.search),
              elevation: const WidgetStatePropertyAll(0),
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
                          v.email.toLowerCase().contains(q) ||
                          v.rollNumber.toLowerCase().contains(q))
                      .toList();
                }

                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.people_outline,
                    title: 'No volunteers found',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.invalidate(volunteersProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final v = filtered[index];
                      return _VolunteerTile(volunteer: v);
                    },
                  ),
                );
              },
              loading: () =>
                  const ShimmerList(itemCount: 6, itemHeight: 72),
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

class _VolunteerTile extends StatelessWidget {
  final VolunteerWithStats volunteer;

  const _VolunteerTile({required this.volunteer});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final roleColor =
        roleColors[volunteer.roleName] ?? const Color(0xFF22C55E);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.1),
          child: Text(
            '${volunteer.firstName[0]}${volunteer.lastName[0]}'.toUpperCase(),
            style: TextStyle(
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          '${volunteer.firstName} ${volunteer.lastName}',
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          '${volunteer.rollNumber} | ${volunteer.branch} | ${volunteer.year}',
          style: theme.textTheme.bodySmall,
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (volunteer.roleName != null)
              StatusBadge(
                label: roleDisplayNames[volunteer.roleName] ??
                    volunteer.roleName!,
                color: roleColor,
                fontSize: 10,
              ),
            const SizedBox(height: 2),
            Text(
              '${volunteer.eventsParticipated} events | ${volunteer.approvedHours}h',
              style: theme.textTheme.bodySmall?.copyWith(fontSize: 10),
            ),
          ],
        ),
        onTap: () => _showVolunteerDetail(context),
      ),
    );
  }

  void _showVolunteerDetail(BuildContext context) {
    final theme = Theme.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (_, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: CircleAvatar(
                radius: 36,
                backgroundColor: theme.colorScheme.primary,
                child: Text(
                  '${volunteer.firstName[0]}${volunteer.lastName[0]}'
                      .toUpperCase(),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                '${volunteer.firstName} ${volunteer.lastName}',
                style: theme.textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ),
            Center(child: Text(volunteer.email)),
            const SizedBox(height: 20),
            _detailRow('Roll Number', volunteer.rollNumber),
            _detailRow('Branch',
                branchDisplayNames[volunteer.branch] ?? volunteer.branch),
            _detailRow('Year',
                yearDisplayNames[volunteer.year] ?? volunteer.year),
            _detailRow('Events', volunteer.eventsParticipated.toString()),
            _detailRow(
                'Total Hours', volunteer.totalHours.toStringAsFixed(1)),
            _detailRow(
                'Approved Hours', volunteer.approvedHours.toStringAsFixed(1)),
            if (volunteer.phoneNo != null)
              _detailRow('Phone', volunteer.phoneNo!),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          Text(value),
        ],
      ),
    );
  }
}
