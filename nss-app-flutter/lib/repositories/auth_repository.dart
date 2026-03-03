import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../core/services/api_client.dart';
import '../models/current_user.dart';

class AuthRepository {
  String get _baseUrl {
    final url = dotenv.env['API_BASE_URL'] ?? '';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  /// Sign in with email and password.
  /// Returns the session token on success.
  Future<String> signIn({
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse('$_baseUrl/api/auth/sign-in/email');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode >= 400) {
      final body = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};
      final message = body['message'] as String? ?? body['error'] as String? ?? 'Sign in failed';
      throw Exception(message);
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final token = body['token'] as String? ?? body['session']?['token'] as String?;

    if (token == null || token.isEmpty) {
      // Try extracting from Set-Cookie header
      final setCookie = response.headers['set-cookie'];
      if (setCookie != null) {
        final match = RegExp(r'better-auth\.session_token=([^;]+)').firstMatch(setCookie);
        if (match != null) {
          final cookieToken = match.group(1)!;
          await apiClient.setToken(cookieToken);
          return cookieToken;
        }
      }
      throw Exception('No session token received');
    }

    await apiClient.setToken(token);
    return token;
  }

  /// Sign up with email, password, and volunteer metadata.
  Future<void> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String rollNumber,
    required String branch,
    required String year,
  }) async {
    final uri = Uri.parse('$_baseUrl/api/auth/sign-up/email');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'name': '$firstName $lastName',
        // Additional fields sent for volunteer profile creation
        'first_name': firstName,
        'last_name': lastName,
        'roll_number': rollNumber,
        'branch': branch,
        'year': year,
      }),
    );

    if (response.statusCode >= 400) {
      final body = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};
      final message = body['message'] as String? ?? body['error'] as String? ?? 'Sign up failed';
      throw Exception(message);
    }
  }

  /// Send password reset email.
  Future<void> resetPassword(String email) async {
    final uri = Uri.parse('$_baseUrl/api/auth/forget-password');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    if (response.statusCode >= 400) {
      final body = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};
      final message = body['message'] as String? ?? 'Password reset failed';
      throw Exception(message);
    }
  }

  /// Sign out and clear persisted token.
  Future<void> signOut() async {
    try {
      await apiClient.post('/api/auth/sign-out');
    } catch (e) {
      debugPrint('[AUTH] signOut error (ignored): $e');
    }
    await apiClient.clearToken();
  }

  /// Fetch the full CurrentUser profile via /api/me.
  Future<CurrentUser?> fetchCurrentUser() async {
    try {
      final data = await apiClient.get('/api/me');
      if (data == null) return null;

      final map = data as Map<String, dynamic>;
      // If no volunteer linked yet
      if (map['volunteer'] == null && map['id'] == null) return null;

      return CurrentUser(
        volunteerId: (map['id'] as String?) ?? '',
        firstName: (map['first_name'] as String?) ?? '',
        lastName: (map['last_name'] as String?) ?? '',
        email: (map['email'] as String?) ?? '',
        rollNumber: (map['roll_number'] as String?) ?? '',
        branch: (map['branch'] as String?) ?? '',
        year: (map['year'] as String?) ?? '',
        phoneNo: map['phone_no'] as String?,
        birthDate: map['birth_date']?.toString(),
        gender: map['gender'] as String?,
        nssJoinYear: map['nss_join_year'] as int?,
        address: map['address'] as String?,
        profilePic: map['profile_pic'] as String?,
        isActive: map['is_active'] as bool? ?? true,
        roles: (map['roles'] as List?)?.cast<String>() ?? [],
      );
    } on ApiException catch (e) {
      if (e.isUnauthorized) return null;
      rethrow;
    }
  }
}
