import '../core/services/api_client.dart';
import '../models/models.dart';

class RoleRepository {
  /// Fetch all role definitions.
  Future<List<RoleDefinition>> getRoleDefinitions() async {
    final data = await apiClient.get('/api/roles');
    return (data as List)
        .map((row) => RoleDefinition.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Fetch all user role assignments with definitions.
  Future<List<UserRoleWithDefinition>> getUserRoles() async {
    final data = await apiClient.get('/api/roles/assignments');
    return (data as List)
        .map((row) => UserRoleWithDefinition.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Assign a role to a volunteer.
  Future<void> assignRole({
    required String volunteerId,
    required String roleDefinitionId,
    required String assignedBy,
  }) async {
    await apiClient.post('/api/roles/assignments', body: {
      'volunteer_id': volunteerId,
      'role_definition_id': roleDefinitionId,
    });
  }

  /// Revoke a role from a volunteer.
  Future<void> revokeRole(String userRoleId) async {
    await apiClient.delete('/api/roles/assignments/$userRoleId');
  }

  /// Get roles for a specific volunteer.
  Future<List<UserRoleWithDefinition>> getVolunteerRoles(
      String volunteerId) async {
    final data = await apiClient.get('/api/volunteers/$volunteerId/roles');
    return (data as List)
        .map((row) => UserRoleWithDefinition.fromJson(row as Map<String, dynamic>))
        .toList();
  }
}
