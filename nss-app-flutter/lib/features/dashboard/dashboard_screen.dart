import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import 'widgets/admin_overview.dart';
import 'widgets/my_activity.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  String _selectedView = 'overview';

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(currentUserProvider);
    final isAdminOrHead = currentUser?.isAdminOrHead ?? false;
    final theme = Theme.of(context);
    final firstName = currentUser?.firstName ?? 'User';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          '${_greeting()}, $firstName',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Column(
        children: [
          if (isAdminOrHead)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: SizedBox(
                width: double.infinity,
                child: SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(
                      value: 'overview',
                      label: Text('Overview'),
                      icon: Icon(Icons.dashboard_outlined),
                    ),
                    ButtonSegment(
                      value: 'activity',
                      label: Text('My Activity'),
                      icon: Icon(Icons.person_outlined),
                    ),
                  ],
                  selected: {_selectedView},
                  onSelectionChanged: (v) =>
                      setState(() => _selectedView = v.first),
                ),
              ),
            ),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: isAdminOrHead && _selectedView == 'overview'
                  ? const AdminOverview(key: ValueKey('overview'))
                  : const MyActivity(key: ValueKey('activity')),
            ),
          ),
        ],
      ),
    );
  }
}
