import 'package:intl/intl.dart';

extension DateTimeX on DateTime {
  String get formatted => DateFormat('MMM d, yyyy').format(this);
  String get formattedWithTime => DateFormat('MMM d, yyyy h:mm a').format(this);
  String get formattedShort => DateFormat('MMM d').format(this);
  String get formattedDate => DateFormat('yyyy-MM-dd').format(this);
  String get timeAgo {
    final now = DateTime.now();
    final diff = now.difference(this);
    if (diff.inDays > 365) return '${(diff.inDays / 365).floor()}y ago';
    if (diff.inDays > 30) return '${(diff.inDays / 30).floor()}mo ago';
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'just now';
  }
}

extension StringDateX on String {
  DateTime? tryParseDate() => DateTime.tryParse(this);
  String get formattedDate {
    final dt = DateTime.tryParse(this);
    if (dt == null) return this;
    return DateFormat('MMM d, yyyy').format(dt);
  }

  String get formattedDateTime {
    final dt = DateTime.tryParse(this);
    if (dt == null) return this;
    return DateFormat('MMM d, yyyy h:mm a').format(dt);
  }
}
