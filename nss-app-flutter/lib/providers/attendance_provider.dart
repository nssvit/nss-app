import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/attendance_repository.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository();
});

final attendanceSummaryProvider =
    FutureProvider.autoDispose<List<AttendanceSummary>>((ref) async {
  final repo = ref.read(attendanceRepositoryProvider);
  return repo.getAttendanceSummary();
});

final eventsForAttendanceProvider =
    FutureProvider.autoDispose<List<EventWithStats>>((ref) async {
  final repo = ref.read(attendanceRepositoryProvider);
  return repo.getEventsForAttendance();
});
