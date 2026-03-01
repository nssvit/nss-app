import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_constants.dart';
import '../../core/extensions/date_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/events_provider.dart';
import '../../providers/categories_provider.dart';
import '../../repositories/attendance_repository.dart';

class EventsScreen extends ConsumerStatefulWidget {
  const EventsScreen({super.key});

  @override
  ConsumerState<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends ConsumerState<EventsScreen> {
  String _searchQuery = '';
  String? _statusFilter;
  int? _categoryFilter;
  bool _isGridView = false;

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(eventsProvider);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Events'),
        actions: [
          IconButton(
            icon: Icon(_isGridView ? Icons.list : Icons.grid_view),
            onPressed: () => setState(() => _isGridView = !_isGridView),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: SearchBar(
              hintText: 'Search events...',
              leading: const Icon(Icons.search),
              elevation: const WidgetStatePropertyAll(0),
              onChanged: (v) => setState(() => _searchQuery = v),
            ),
          ),
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(_statusFilter == null
                        ? 'All Statuses'
                        : eventStatusDisplay[_statusFilter] ?? _statusFilter!),
                    selected: _statusFilter != null,
                    onSelected: (_) => _showStatusFilter(context),
                  ),
                ),
                categoriesAsync.when(
                  data: (cats) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(_categoryFilter == null
                          ? 'All Categories'
                          : cats
                                  .where((c) => c.id == _categoryFilter)
                                  .firstOrNull
                                  ?.categoryName ??
                              'Category'),
                      selected: _categoryFilter != null,
                      onSelected: (_) => _showCategoryFilter(context, cats),
                    ),
                  ),
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
                if (_statusFilter != null || _categoryFilter != null)
                  ActionChip(
                    label: const Text('Clear'),
                    onPressed: () => setState(() {
                      _statusFilter = null;
                      _categoryFilter = null;
                    }),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: eventsAsync.when(
              data: (events) {
                var filtered = events.where((e) {
                  if (_searchQuery.isNotEmpty) {
                    final q = _searchQuery.toLowerCase();
                    if (!e.eventName.toLowerCase().contains(q) &&
                        !(e.description?.toLowerCase().contains(q) ?? false) &&
                        !(e.location?.toLowerCase().contains(q) ?? false)) {
                      return false;
                    }
                  }
                  if (_statusFilter != null && e.eventStatus != _statusFilter) {
                    return false;
                  }
                  if (_categoryFilter != null && e.categoryId != _categoryFilter) {
                    return false;
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.event_busy,
                    title: 'No events found',
                    subtitle: 'Try adjusting your filters.',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(eventsProvider),
                  child: _isGridView
                      ? _buildGridView(filtered)
                      : _buildListView(filtered),
                );
              },
              loading: () => const ShimmerList(itemCount: 5, itemHeight: 100),
              error: (e, _) => AppError(
                message: e.toString(),
                onRetry: () => ref.invalidate(eventsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListView(List<EventWithStats> events) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: events.length,
      itemBuilder: (context, index) => _EventCard(
        event: events[index],
        onTap: () => _openEventDetail(events[index]),
      ),
    );
  }

  Widget _buildGridView(List<EventWithStats> events) {
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 0.85,
      ),
      itemCount: events.length,
      itemBuilder: (context, index) => _EventCard(
        event: events[index],
        compact: true,
        onTap: () => _openEventDetail(events[index]),
      ),
    );
  }

  void _openEventDetail(EventWithStats event) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, controller) => _EventDetailSheet(
          event: event,
          scrollController: controller,
        ),
      ),
    );
  }

  void _showStatusFilter(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            title: const Text('All Statuses'),
            onTap: () {
              setState(() => _statusFilter = null);
              Navigator.pop(context);
            },
          ),
          ...EventStatusValues.all.map(
            (s) => ListTile(
              title: Text(eventStatusDisplay[s] ?? s),
              trailing:
                  _statusFilter == s ? const Icon(Icons.check) : null,
              onTap: () {
                setState(() => _statusFilter = s);
                Navigator.pop(context);
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showCategoryFilter(BuildContext context, List<EventCategory> cats) {
    showModalBottomSheet(
      context: context,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            title: const Text('All Categories'),
            onTap: () {
              setState(() => _categoryFilter = null);
              Navigator.pop(context);
            },
          ),
          ...cats.map(
            (c) => ListTile(
              title: Text(c.categoryName),
              trailing:
                  _categoryFilter == c.id ? const Icon(Icons.check) : null,
              onTap: () {
                setState(() => _categoryFilter = c.id);
                Navigator.pop(context);
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Event Detail Bottom Sheet ──────────────────────────────────────────────

class _EventDetailSheet extends ConsumerStatefulWidget {
  final EventWithStats event;
  final ScrollController scrollController;

  const _EventDetailSheet({
    required this.event,
    required this.scrollController,
  });

  @override
  ConsumerState<_EventDetailSheet> createState() => _EventDetailSheetState();
}

class _EventDetailSheetState extends ConsumerState<_EventDetailSheet> {
  List<EventParticipationWithVolunteer>? _participants;
  bool _loading = true;
  String? _updatingId;

  @override
  void initState() {
    super.initState();
    // Defer to after first frame so ref is fully available
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadParticipants());
  }

  Future<void> _loadParticipants() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      debugPrint('[PARTICIPANTS] Loading for event ${widget.event.id} (${widget.event.eventName})');
      // Query directly instead of using provider to avoid caching issues
      final repo = ref.read(eventRepositoryProvider);
      final data = await repo.getEventParticipants(widget.event.id);
      debugPrint('[PARTICIPANTS] Loaded ${data.length} participants');
      if (mounted) setState(() { _participants = data; _loading = false; });
    } catch (e, stack) {
      debugPrint('[PARTICIPANTS] Error: $e');
      debugPrint('[PARTICIPANTS] Stack: $stack');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleStatus(
      EventParticipationWithVolunteer p, String newStatus) async {
    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null || !currentUser.isAdminOrHead) return;

    setState(() => _updatingId = p.id);

    final isPresent = newStatus == 'present';
    final hours = isPresent ? widget.event.declaredHours : 0;

    try {
      await AttendanceRepository().updateParticipationStatus(
        participationId: p.id,
        status: newStatus,
        hoursAttended: hours,
      );

      // Optimistic update
      if (mounted && _participants != null) {
        setState(() {
          _participants = _participants!.map((item) {
            if (item.id == p.id) {
              return EventParticipationWithVolunteer(
                id: item.id,
                eventId: item.eventId,
                volunteerId: item.volunteerId,
                participationStatus: newStatus,
                hoursAttended: hours,
                approvalStatus: item.approvalStatus,
                approvedBy: item.approvedBy,
                approvedAt: item.approvedAt,
                approvalNotes: item.approvalNotes,
                notes: item.notes,
                attendanceDate: item.attendanceDate,
                recordedByVolunteerId: item.recordedByVolunteerId,
                createdAt: item.createdAt,
                registeredAt: item.registeredAt,
                updatedAt: item.updatedAt,
                volunteerName: item.volunteerName,
                volunteerEmail: item.volunteerEmail,
                volunteerRollNumber: item.volunteerRollNumber,
              );
            }
            return item;
          }).toList();
          _updatingId = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _updatingId = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final event = widget.event;
    final currentUser = ref.watch(currentUserProvider);
    final canManage = currentUser?.isAdminOrHead ?? false;
    final statusColor =
        eventStatusColors[event.eventStatus] ?? const Color(0xFF6B7280);

    final presentCount = _participants
            ?.where((p) => p.participationStatus == 'present')
            .length ??
        0;
    final absentCount = _participants
            ?.where((p) => p.participationStatus == 'absent')
            .length ??
        0;

    return Column(
      children: [
        // Drag handle
        Container(
          margin: const EdgeInsets.only(top: 12, bottom: 8),
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        Expanded(
          child: ListView(
            controller: widget.scrollController,
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
            children: [
              // ── Header ─────────────────────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      event.eventName,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  StatusBadge(
                    label: eventStatusDisplay[event.eventStatus] ??
                        event.eventStatus,
                    color: statusColor,
                  ),
                ],
              ),

              // ── Description ────────────────────────────
              if (event.description != null &&
                  event.description!.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  event.description!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
              const SizedBox(height: 16),

              // ── Metadata Grid (matches web) ────────────
              _buildMetadataGrid(theme, event),
              const SizedBox(height: 20),

              // ── Participants Header ────────────────────
              Divider(color: theme.dividerColor),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text(
                    'Participants',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 10),
                  if (_participants != null && _participants!.isNotEmpty) ...[
                    _CountBadge(
                      icon: Icons.check_circle,
                      count: presentCount,
                      color: const Color(0xFF22C55E),
                    ),
                    const SizedBox(width: 6),
                    _CountBadge(
                      icon: Icons.cancel,
                      count: absentCount,
                      color: const Color(0xFFEF4444),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),

              // ── Participant List ───────────────────────
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_participants == null || _participants!.isEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Column(
                    children: [
                      Icon(Icons.people_outline,
                          size: 40,
                          color: theme.colorScheme.onSurface
                              .withValues(alpha: 0.3)),
                      const SizedBox(height: 8),
                      Text(
                        'No participants registered yet.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface
                              .withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                )
              else
                ..._participants!.map(
                  (p) => _ParticipantRow(
                    participant: p,
                    canManage: canManage,
                    isUpdating: _updatingId == p.id,
                    onTogglePresent: () {
                      if (p.participationStatus != 'present') {
                        _toggleStatus(p, 'present');
                      }
                    },
                    onToggleAbsent: () {
                      if (p.participationStatus != 'absent') {
                        _toggleStatus(p, 'absent');
                      }
                    },
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMetadataGrid(ThemeData theme, EventWithStats event) {
    final chips = <Widget>[];

    // Category
    if (event.categoryName != null) {
      chips.add(_MetaChip(
        leading: Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: event.categoryColor != null
                ? _parseColor(event.categoryColor!)
                : theme.colorScheme.primary,
            shape: BoxShape.circle,
          ),
        ),
        label: event.categoryName!,
      ));
    }

    // Date
    chips.add(_MetaChip(
      leading: Icon(Icons.calendar_today,
          size: 16,
          color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
      label: event.startDate.isNotEmpty
          ? event.startDate.formattedDate
          : 'TBD',
    ));

    // Location
    if (event.location != null) {
      chips.add(_MetaChip(
        leading: Icon(Icons.location_on,
            size: 16,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
        label: event.location!,
      ));
    }

    // Hours
    chips.add(_MetaChip(
      leading: Icon(Icons.schedule,
          size: 16,
          color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
      label: '${event.declaredHours}h credits',
    ));

    // Participants
    chips.add(_MetaChip(
      leading: Icon(Icons.people,
          size: 16,
          color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
      label:
          '${_participants?.length ?? event.participantCount} participant${((_participants?.length ?? event.participantCount) != 1) ? 's' : ''}',
    ));

    return LayoutBuilder(builder: (context, constraints) {
      final itemWidth = (constraints.maxWidth - 8) / 2;
      return Wrap(
        spacing: 8,
        runSpacing: 8,
        children: chips
            .map((c) => SizedBox(width: itemWidth, child: c))
            .toList(),
      );
    });
  }

  Color _parseColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
}

// ─── Metadata Chip (matches web muted/50 pill) ─────────────────────────────

class _MetaChip extends StatelessWidget {
  final Widget leading;
  final String label;

  const _MetaChip({required this.leading, required this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          leading,
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Count Badge (present/absent count) ─────────────────────────────────────

class _CountBadge extends StatelessWidget {
  final IconData icon;
  final int count;
  final Color color;

  const _CountBadge({
    required this.icon,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            '$count',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Participant Row (matches web layout exactly) ───────────────────────────

class _ParticipantRow extends StatelessWidget {
  final EventParticipationWithVolunteer participant;
  final bool canManage;
  final bool isUpdating;
  final VoidCallback onTogglePresent;
  final VoidCallback onToggleAbsent;

  const _ParticipantRow({
    required this.participant,
    required this.canManage,
    required this.isUpdating,
    required this.onTogglePresent,
    required this.onToggleAbsent,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPresent = participant.participationStatus == 'present';
    final isAbsent = participant.participationStatus == 'absent';

    final bgColor = isPresent
        ? const Color(0xFF22C55E).withValues(alpha: 0.05)
        : isAbsent
            ? const Color(0xFFEF4444).withValues(alpha: 0.05)
            : Colors.transparent;

    final statusColor =
        participationStatusColors[participant.participationStatus] ??
            const Color(0xFF6B7280);
    final statusLabel =
        participationStatusDisplay[participant.participationStatus] ??
            participant.participationStatus;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          // Status dot
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isPresent
                  ? const Color(0xFF22C55E)
                  : isAbsent
                      ? const Color(0xFFEF4444)
                      : theme.colorScheme.onSurface.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),

          // Name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  participant.volunteerName ?? 'Unknown',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (participant.volunteerRollNumber != null)
                  Text(
                    participant.volunteerRollNumber!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),

          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              statusLabel,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: statusColor,
              ),
            ),
          ),

          // Hours
          if (participant.hoursAttended > 0) ...[
            const SizedBox(width: 8),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.schedule,
                    size: 12,
                    color:
                        theme.colorScheme.onSurface.withValues(alpha: 0.5)),
                const SizedBox(width: 3),
                Text(
                  '${participant.hoursAttended}h',
                  style: TextStyle(
                    fontSize: 11,
                    color:
                        theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ],

          // Admin toggle buttons
          if (canManage) ...[
            const SizedBox(width: 8),
            _ToggleButton(
              icon: Icons.check,
              active: isPresent,
              activeColor: const Color(0xFF22C55E),
              disabled: isUpdating,
              onTap: onTogglePresent,
              tooltip: 'Mark present',
            ),
            const SizedBox(width: 4),
            _ToggleButton(
              icon: Icons.close,
              active: isAbsent,
              activeColor: const Color(0xFFEF4444),
              disabled: isUpdating,
              onTap: onToggleAbsent,
              tooltip: 'Mark absent',
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Toggle Button (check/X for admin) ──────────────────────────────────────

class _ToggleButton extends StatelessWidget {
  final IconData icon;
  final bool active;
  final Color activeColor;
  final bool disabled;
  final VoidCallback onTap;
  final String tooltip;

  const _ToggleButton({
    required this.icon,
    required this.active,
    required this.activeColor,
    required this.disabled,
    required this.onTap,
    required this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: disabled ? null : onTap,
        borderRadius: BorderRadius.circular(6),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: active ? activeColor : Colors.transparent,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: active
                  ? activeColor.withValues(alpha: 0.3)
                  : theme.dividerColor,
            ),
          ),
          child: Opacity(
            opacity: disabled ? 0.4 : 1.0,
            child: Icon(
              icon,
              size: 14,
              color: active ? Colors.white : theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Event Card ─────────────────────────────────────────────────────────────

class _EventCard extends StatelessWidget {
  final EventWithStats event;
  final bool compact;
  final VoidCallback? onTap;

  const _EventCard({required this.event, this.compact = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor =
        eventStatusColors[event.eventStatus] ?? const Color(0xFF6B7280);

    final categoryColor = event.categoryColor != null
        ? _parseCategoryColor(event.categoryColor!)
        : theme.colorScheme.primary;

    return Card(
      margin: EdgeInsets.only(bottom: compact ? 0 : 8),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(color: categoryColor, width: 4),
            ),
          ),
          padding: EdgeInsets.all(compact ? 12 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      event.eventName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: compact ? 2 : 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  StatusBadge(
                    label: eventStatusDisplay[event.eventStatus] ??
                        event.eventStatus,
                    color: statusColor,
                    fontSize: 10,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (event.categoryName != null)
                Text(
                  event.categoryName!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.primary,
                  ),
                ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.calendar_today,
                      size: 14,
                      color:
                          theme.colorScheme.onSurface.withValues(alpha: 0.5)),
                  const SizedBox(width: 4),
                  Text(
                    event.startDate.isNotEmpty
                        ? event.startDate.formattedDate
                        : 'No date',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
              if (!compact) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    _InfoChip(icon: Icons.people, label: '${event.participantCount}'),
                    const SizedBox(width: 12),
                    _InfoChip(icon: Icons.schedule, label: '${event.declaredHours}h'),
                    if (event.location != null) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: _InfoChip(icon: Icons.location_on, label: event.location!),
                      ),
                    ],
                  ],
                ),
              ],
              if (event.userParticipationStatus != null) ...[
                const SizedBox(height: 8),
                StatusBadge(
                  label: participationStatusDisplay[event.userParticipationStatus] ??
                      event.userParticipationStatus!,
                  color: participationStatusColors[event.userParticipationStatus] ??
                      const Color(0xFF6B7280),
                  fontSize: 10,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

Color _parseCategoryColor(String hex) {
  hex = hex.replaceAll('#', '');
  if (hex.length == 6) hex = 'FF$hex';
  return Color(int.parse(hex, radix: 16));
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            label,
            style: TextStyle(fontSize: 12, color: color),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
