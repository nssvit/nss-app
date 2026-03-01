import '../core/utils/supabase_client.dart';
import '../models/models.dart';

class RoleRepository {
  /// Fetch all role definitions.
  Future<List<RoleDefinition>> getRoleDefinitions() async {
    final res = await supabase
        .from('role_definitions')
        .select()
        .eq('is_active', true)
        .order('hierarchy_level', ascending: false);

    return (res as List)
        .map((row) => RoleDefinition.fromJson(row))
        .toList();
  }

  /// Fetch all user role assignments with definitions.
  Future<List<UserRoleWithDefinition>> getUserRoles() async {
    final res = await supabase
        .from('user_roles')
        .select('*, role_definitions(*)')
        .eq('is_active', true);

    return (res as List)
        .map((row) => UserRoleWithDefinition.fromJson(row))
        .toList();
  }

  /// Assign a role to a volunteer.
  Future<void> assignRole({
    required String volunteerId,
    required String roleDefinitionId,
    required String assignedBy,
  }) async {
    await supabase.from('user_roles').insert({
      'volunteer_id': volunteerId,
      'role_definition_id': roleDefinitionId,
      'assigned_by': assignedBy,
      'is_active': true,
    });
  }

  /// Revoke a role from a volunteer.
  Future<void> revokeRole(String userRoleId) async {
    await supabase
        .from('user_roles')
        .update({
          'is_active': false,
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', userRoleId);
  }

  /// Get roles for a specific volunteer.
  Future<List<UserRoleWithDefinition>> getVolunteerRoles(
      String volunteerId) async {
    final res = await supabase
        .from('user_roles')
        .select('*, role_definitions(*)')
        .eq('volunteer_id', volunteerId)
        .eq('is_active', true);

    return (res as List)
        .map((row) => UserRoleWithDefinition.fromJson(row))
        .toList();
  }
}
