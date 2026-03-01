import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_constants.dart';
import '../../core/extensions/context_extensions.dart';
import '../../core/extensions/date_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/profile_provider.dart';
import '../../providers/volunteers_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _phoneController;
  late TextEditingController _addressController;

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController();
    _addressController = TextEditingController();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(currentUserProvider);
    final participationsAsync = ref.watch(profileParticipationsProvider);
    final theme = context.theme;

    if (currentUser == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: DefaultTabController(
        length: 2,
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              title: innerBoxIsScrolled ? Text(currentUser.fullName) : null,
              actions: [
                IconButton(
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: () => _showEditSheet(context, currentUser),
                ),
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  onPressed: () => context.go('/settings'),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: _ProfileHero(user: currentUser),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabBarDelegate(
                TabBar(
                  tabs: const [
                    Tab(text: 'Details'),
                    Tab(text: 'History'),
                  ],
                  labelColor: theme.colorScheme.primary,
                  indicatorColor: theme.colorScheme.primary,
                ),
                theme.colorScheme.surface,
              ),
            ),
          ],
          body: TabBarView(
            children: [
              // Details tab
              _buildDetails(currentUser, theme),

              // History tab
              participationsAsync.when(
                data: (participations) =>
                    _buildHistory(participations, theme),
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => AppError(
                  message: e.toString(),
                  onRetry: () =>
                      ref.invalidate(profileParticipationsProvider),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetails(CurrentUser user, ThemeData theme) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Academic info card
        _SectionCard(
          title: 'Academic Info',
          icon: Icons.school_outlined,
          children: [
            _DetailRow('Roll Number', user.rollNumber, Icons.badge_outlined),
            _DetailRow('Branch', branchDisplayNames[user.branch] ?? user.branch,
                Icons.account_tree_outlined),
            _DetailRow(
                'Year', yearDisplayNames[user.year] ?? user.year, Icons.calendar_today_outlined),
            if (user.nssJoinYear != null)
              _DetailRow('NSS Join Year', user.nssJoinYear.toString(),
                  Icons.flag_outlined),
          ],
        ),
        const SizedBox(height: 12),

        // Contact card
        _SectionCard(
          title: 'Contact',
          icon: Icons.contact_mail_outlined,
          children: [
            _DetailRow(
                'Phone', user.phoneNo ?? 'Not set', Icons.phone_outlined),
            _DetailRow(
                'Address', user.address ?? 'Not set', Icons.location_on_outlined),
            if (user.birthDate != null)
              _DetailRow('Birthday', user.birthDate!.formattedDate,
                  Icons.cake_outlined),
          ],
        ),
        const SizedBox(height: 12),

        // Sign out card
        Card(
          child: ListTile(
            leading: Icon(Icons.logout, color: theme.colorScheme.error),
            title: Text(
              'Sign Out',
              style: TextStyle(color: theme.colorScheme.error),
            ),
            trailing: Icon(Icons.chevron_right,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.3)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            onTap: () => ref.read(authProvider.notifier).signOut(),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  void _showEditSheet(BuildContext context, CurrentUser user) {
    _phoneController.text = user.phoneNo ?? '';
    _addressController.text = user.address ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Theme.of(ctx)
                        .colorScheme
                        .onSurface
                        .withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Edit Profile',
                style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _addressController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Address',
                  prefixIcon: Icon(Icons.location_on_outlined),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _saveProfile();
                },
                child: const Text('Save Changes'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _saveProfile() async {
    try {
      final currentUser = ref.read(currentUserProvider);
      if (currentUser == null) return;

      await ref.read(volunteerRepositoryProvider).updateVolunteer(
        currentUser.volunteerId,
        {
          'phone_no': _phoneController.text.isEmpty
              ? null
              : _phoneController.text,
          'address': _addressController.text.isEmpty
              ? null
              : _addressController.text,
        },
      );

      await ref.read(authProvider.notifier).refreshUser();
      if (mounted) {
        context.showSuccessSnackBar('Profile updated');
      }
    } catch (e) {
      if (mounted) {
        context.showSnackBar(e.toString(), isError: true);
      }
    }
  }

  Widget _buildHistory(
      List<EventParticipationWithEvent> participations, ThemeData theme) {
    if (participations.isEmpty) {
      return const EmptyState(
        icon: Icons.history,
        title: 'No activity yet',
        subtitle: 'Your event participation history will appear here.',
      );
    }

    return RefreshIndicator(
      onRefresh: () async =>
          ref.invalidate(profileParticipationsProvider),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: participations.length,
        itemBuilder: (context, index) {
          final p = participations[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text(p.eventName ?? 'Unknown Event'),
              subtitle: Text(
                '${p.startDate?.formattedDate ?? ''} | ${participationStatusDisplay[p.participationStatus] ?? p.participationStatus}',
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${p.hoursAttended}h',
                      style: theme.textTheme.titleSmall),
                  StatusBadge(
                    label: approvalStatusDisplay[p.approvalStatus] ??
                        p.approvalStatus,
                    color: approvalStatusColors[p.approvalStatus] ??
                        const Color(0xFF6B7280),
                    fontSize: 10,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─── Profile Hero with gradient ─────────────────────────────────────────────

class _ProfileHero extends StatelessWidget {
  final CurrentUser user;

  const _ProfileHero({required this.user});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.secondary,
          ],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 48, 20, 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                child: Text(
                  '${user.firstName[0]}${user.lastName[0]}'.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                user.fullName,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                user.email,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                children: [
                  _HeroBadge(label: user.branch),
                  _HeroBadge(
                      label: yearDisplayNames[user.year] ?? user.year),
                  ...user.roles.map(
                    (r) => _HeroBadge(label: roleDisplayNames[r] ?? r),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroBadge extends StatelessWidget {
  final String label;
  const _HeroBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ─── Section Card ───────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _SectionCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18,
                    color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

// ─── Detail Row ─────────────────────────────────────────────────────────────

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _DetailRow(this.label, this.value, this.icon);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.4)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface
                        .withValues(alpha: 0.5),
                  ),
                ),
                Text(value, style: theme.textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Tab Bar Delegate ───────────────────────────────────────────────────────

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color backgroundColor;

  _TabBarDelegate(this.tabBar, this.backgroundColor);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: backgroundColor,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(covariant _TabBarDelegate oldDelegate) =>
      tabBar != oldDelegate.tabBar ||
      backgroundColor != oldDelegate.backgroundColor;
}
