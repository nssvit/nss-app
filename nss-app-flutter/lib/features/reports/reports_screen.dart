import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:csv/csv.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart' as path_provider;
import '../../core/extensions/date_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../../providers/auth_provider.dart';
import '../../providers/reports_provider.dart';
import '../../providers/dashboard_provider.dart';

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final currentUser = ref.watch(currentUserProvider);
    final isAdmin = currentUser?.isAdmin ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
        actions: [
          if (isAdmin)
            PopupMenuButton<String>(
              icon: const Icon(Icons.download),
              onSelected: (v) => _exportCsv(context, ref, v),
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'hours', child: Text('Export Hours')),
                PopupMenuItem(value: 'events', child: Text('Export Events')),
              ],
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(categoryDistributionProvider);
          ref.invalidate(topEventsProvider);
          ref.invalidate(dashboardStatsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Stats
            _buildStatsSection(ref, theme),
            const SizedBox(height: 24),

            // Category distribution chart
            Text(
              'Events by Category',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildCategoryChart(ref, theme),
            const SizedBox(height: 24),

            // Top events table
            Text(
              'Top Events by Impact',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildTopEventsTable(ref, theme),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsSection(WidgetRef ref, ThemeData theme) {
    final statsAsync = ref.watch(dashboardStatsProvider);
    return statsAsync.when(
      data: (stats) => GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1.6,
        children: [
          StatCard(
            title: 'Total Events',
            value: stats.totalEvents.toString(),
            icon: Icons.event,
            color: const Color(0xFF3B82F6),
          ),
          StatCard(
            title: 'Active Volunteers',
            value: stats.activeVolunteers.toString(),
            icon: Icons.people,
            color: const Color(0xFF22C55E),
          ),
          StatCard(
            title: 'Total Hours',
            value: stats.totalHours.toStringAsFixed(0),
            icon: Icons.schedule,
            color: const Color(0xFFA855F7),
          ),
          StatCard(
            title: 'Ongoing',
            value: stats.ongoingProjects.toString(),
            icon: Icons.trending_up,
            color: const Color(0xFFF59E0B),
          ),
        ],
      ),
      loading: () => GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1.6,
        children: List.generate(4, (_) => const ShimmerCard(height: 80)),
      ),
      error: (e, _) => AppError(message: e.toString()),
    );
  }

  Widget _buildCategoryChart(WidgetRef ref, ThemeData theme) {
    final categoryAsync = ref.watch(categoryDistributionProvider);
    return categoryAsync.when(
      data: (categories) {
        if (categories.isEmpty) {
          return const SizedBox(
            height: 200,
            child: EmptyState(icon: Icons.pie_chart, title: 'No data'),
          );
        }
        return Column(
          children: [
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sections: categories.map((c) {
                    final color = _parseColor(c.colorHex);
                    return PieChartSectionData(
                      value: c.eventCount.toDouble(),
                      title: '${c.eventCount}',
                      color: color,
                      radius: 60,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    );
                  }).toList(),
                  sectionsSpace: 2,
                  centerSpaceRadius: 40,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: categories.map((c) {
                final color = _parseColor(c.colorHex);
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${c.categoryName} (${c.eventCount})',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                );
              }).toList(),
            ),
          ],
        );
      },
      loading: () => const SizedBox(
        height: 200,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => AppError(message: e.toString()),
    );
  }

  Widget _buildTopEventsTable(WidgetRef ref, ThemeData theme) {
    final topAsync = ref.watch(topEventsProvider);
    return topAsync.when(
      data: (events) {
        if (events.isEmpty) {
          return const EmptyState(
            icon: Icons.event,
            title: 'No events yet',
          );
        }
        return Card(
          child: Column(
            children: events.take(10).map((e) {
              return ListTile(
                title: Text(
                  e.eventName,
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(fontWeight: FontWeight.w500),
                ),
                subtitle: Text(
                  '${e.categoryName} | ${e.startDate?.formattedDate ?? ''}',
                  style: theme.textTheme.bodySmall,
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${e.participantCount} vol',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${e.totalHours}h',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AppError(message: e.toString()),
    );
  }

  Color _parseColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }

  Future<void> _exportCsv(
      BuildContext context, WidgetRef ref, String type) async {
    try {
      List<List<dynamic>> rows;

      if (type == 'hours') {
        final data = await ref.read(volunteerHoursSummaryProvider.future);
        rows = [
          ['Volunteer', 'Total Hours', 'Approved Hours', 'Events'],
          ...data.map((d) => [
                d.volunteerName,
                d.totalHours,
                d.approvedHours,
                d.eventsCount,
              ]),
        ];
      } else {
        final data = await ref.read(topEventsProvider.future);
        rows = [
          ['Event', 'Category', 'Participants', 'Hours', 'Status'],
          ...data.map((d) => [
                d.eventName,
                d.categoryName,
                d.participantCount,
                d.totalHours,
                d.eventStatus,
              ]),
        ];
      }

      final csv = const CsvEncoder().convert(rows);
      final dir = await path_provider.getTemporaryDirectory();
      final file = File('${dir.path}/nss_${type}_report.csv');
      await file.writeAsString(csv);

      await SharePlus.instance.share(
        ShareParams(files: [XFile(file.path)]),
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e')),
        );
      }
    }
  }
}
