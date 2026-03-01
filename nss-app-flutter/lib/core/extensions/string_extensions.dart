extension StringX on String {
  String get capitalized =>
      isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';

  String get titleCase => split(' ').map((w) => w.capitalized).join(' ');

  String get initials {
    final parts = trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return length >= 2
        ? substring(0, 2).toUpperCase()
        : toUpperCase();
  }

  /// Converts snake_case to Title Case display.
  String get snakeToDisplay =>
      split('_').map((w) => w.capitalized).join(' ');
}
