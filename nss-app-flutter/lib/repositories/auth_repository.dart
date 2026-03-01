import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/utils/supabase_client.dart';
import '../models/current_user.dart';

class AuthRepository {
  /// Sign in with email and password.
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) {
    return supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  /// Sign up with email, password, and volunteer metadata.
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String rollNumber,
    required String branch,
    required String year,
  }) {
    return supabase.auth.signUp(
      email: email,
      password: password,
      data: {
        'first_name': firstName,
        'last_name': lastName,
        'roll_number': rollNumber,
        'branch': branch,
        'year': year,
      },
    );
  }

  /// Send password reset email.
  Future<void> resetPassword(String email) {
    return supabase.auth.resetPasswordForEmail(email);
  }

  /// Update password (after reset link).
  Future<UserResponse> updatePassword(String newPassword) {
    return supabase.auth.updateUser(
      UserAttributes(password: newPassword),
    );
  }

  /// Sign out.
  Future<void> signOut() {
    return supabase.auth.signOut();
  }

  /// Listen to auth state changes.
  Stream<AuthState> get onAuthStateChange =>
      supabase.auth.onAuthStateChange;

  /// Fetch the full CurrentUser profile by auth user ID.
  /// Queries volunteers table + user_roles + role_definitions.
  Future<CurrentUser?> fetchCurrentUser(String authUserId) async {
    // Get volunteer record
    final volunteerRes = await supabase
        .from('volunteers')
        .select()
        .eq('auth_user_id', authUserId)
        .eq('is_active', true)
        .maybeSingle();

    if (volunteerRes == null) return null;

    final volunteerId = volunteerRes['id'] as String;

    // Get roles via user_roles joined with role_definitions
    final rolesRes = await supabase
        .from('user_roles')
        .select('role_definitions(role_name)')
        .eq('volunteer_id', volunteerId)
        .eq('is_active', true);

    final roles = (rolesRes as List)
        .map((r) {
          final rd = r['role_definitions'];
          if (rd == null) return null;
          return rd['role_name'] as String?;
        })
        .whereType<String>()
        .toList();

    return CurrentUser(
      volunteerId: volunteerId,
      firstName: (volunteerRes['first_name'] as String?) ?? '',
      lastName: (volunteerRes['last_name'] as String?) ?? '',
      email: (volunteerRes['email'] as String?) ?? '',
      rollNumber: (volunteerRes['roll_number'] as String?) ?? '',
      branch: (volunteerRes['branch'] as String?) ?? '',
      year: (volunteerRes['year'] as String?) ?? '',
      phoneNo: volunteerRes['phone_no'] as String?,
      birthDate: volunteerRes['birth_date']?.toString(),
      gender: volunteerRes['gender'] as String?,
      nssJoinYear: volunteerRes['nss_join_year'] as int?,
      address: volunteerRes['address'] as String?,
      profilePic: volunteerRes['profile_pic'] as String?,
      isActive: volunteerRes['is_active'] as bool? ?? true,
      roles: roles,
    );
  }
}
