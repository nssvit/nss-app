import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/reports_repository.dart';

final reportsRepositoryProvider = Provider<ReportsRepository>((ref) {
  return ReportsRepository();
});

final categoryDistributionProvider =
    FutureProvider.autoDispose<List<CategoryDistribution>>((ref) async {
  final repo = ref.read(reportsRepositoryProvider);
  return repo.getCategoryDistribution();
});

final topEventsProvider =
    FutureProvider.autoDispose<List<TopEvent>>((ref) async {
  final repo = ref.read(reportsRepositoryProvider);
  return repo.getTopEvents();
});

final volunteerHoursSummaryProvider =
    FutureProvider.autoDispose<List<VolunteerHoursSummary>>((ref) async {
  final repo = ref.read(reportsRepositoryProvider);
  return repo.getVolunteerHoursSummary();
});
