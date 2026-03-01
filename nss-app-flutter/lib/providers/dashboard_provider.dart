import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/dashboard_repository.dart';
import 'auth_provider.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository();
});

final dashboardStatsProvider =
    FutureProvider.autoDispose<DashboardStats>((ref) async {
  final repo = ref.read(dashboardRepositoryProvider);
  return repo.getDashboardStats();
});

final monthlyTrendsProvider =
    FutureProvider.autoDispose<List<ActivityTrend>>((ref) async {
  final repo = ref.read(dashboardRepositoryProvider);
  return repo.getMonthlyTrends();
});

final volunteerDashboardProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repo = ref.read(dashboardRepositoryProvider);
  final currentUser = ref.watch(currentUserProvider);
  if (currentUser == null) return {};
  return repo.getVolunteerDashboardData(currentUser.volunteerId);
});
