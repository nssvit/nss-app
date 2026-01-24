"use client";

import { useState, useEffect } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useRoles } from "@/hooks/useRoles";
import { useVolunteers } from "@/hooks/useVolunteers";
import { Skeleton } from "./Skeleton";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";

// Type alias for backwards compatibility
interface Role {
  id: string;
  role_name: string;
  display_name: string;
  description: string | null;
  permissions: Record<string, unknown>;
  hierarchy_level: number;
  is_active: boolean;
}

interface UserRoleWithDetails {
  id: string;
  volunteer_id: string;
  role_definition_id: string;
  assigned_at: string;
  is_active: boolean;
  volunteer?: { id: string; first_name: string; last_name: string; email: string; profile_pic?: string | null };
  role_definition?: Role;
}

type TabType = "definitions" | "assignments";

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleDefinitions: Role[];
  volunteers: { id: string; first_name: string; last_name: string; email: string; profile_pic: string | null }[];
  onAssign: (volunteerId: string, roleId: string, expiresAt: string | null) => Promise<void>;
  existingRoles: UserRoleWithDetails[];
}

function AssignRoleModal({ isOpen, onClose, roleDefinitions, volunteers, onAssign, existingRoles }: AssignRoleModalProps) {
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVolunteers = volunteers.filter(v =>
    `${v.first_name} ${v.last_name} ${v.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if volunteer already has selected role
  const volunteerHasRole = (volunteerId: string, roleId: string) => {
    return existingRoles.some(
      ur => ur.volunteer_id === volunteerId && ur.role_definition_id === roleId && ur.is_active
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolunteer || !selectedRole) return;

    if (volunteerHasRole(selectedVolunteer, selectedRole)) {
      return;
    }

    setSubmitting(true);
    try {
      await onAssign(selectedVolunteer, selectedRole, expiresAt || null);
      setSelectedVolunteer("");
      setSelectedRole("");
      setExpiresAt("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedVolunteer("");
      setSelectedRole("");
      setExpiresAt("");
      setSearchTerm("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Assign Role</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none p-1">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Volunteer</label>
            <input
              type="text"
              placeholder="Search volunteers..."
              className="input-dark w-full text-sm rounded-lg px-4 py-2 mb-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              required
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
              value={selectedVolunteer}
              onChange={(e) => setSelectedVolunteer(e.target.value)}
            >
              <option value="">Select a volunteer...</option>
              {filteredVolunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.first_name} {v.last_name} ({v.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Role</label>
            <select
              required
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Select a role...</option>
              {roleDefinitions.filter(r => r.is_active).map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                  disabled={selectedVolunteer && volunteerHasRole(selectedVolunteer, role.id)}
                >
                  {role.display_name} {selectedVolunteer && volunteerHasRole(selectedVolunteer, role.id) ? "(Already assigned)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Expiration Date (Optional)</label>
            <input
              type="date"
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for permanent assignment</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="button-glass-secondary hover-lift px-4 py-2 text-sm rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedVolunteer || !selectedRole}
              className="button-glass-primary hover-lift px-4 py-2 text-sm rounded-lg disabled:opacity-50"
            >
              {submitting ? "Assigning..." : "Assign Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RoleDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Role>) => Promise<void>;
  initialData?: Role;
  mode: "create" | "edit";
}

function RoleDefinitionModal({ isOpen, onClose, onSubmit, initialData, mode }: RoleDefinitionModalProps) {
  const [formData, setFormData] = useState({
    role_name: "",
    display_name: "",
    description: "",
    hierarchy_level: 10,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        role_name: initialData.role_name,
        display_name: initialData.display_name,
        description: initialData.description || "",
        hierarchy_level: initialData.hierarchy_level,
        is_active: initialData.is_active,
      });
    } else {
      setFormData({
        role_name: "",
        display_name: "",
        description: "",
        hierarchy_level: 10,
        is_active: true,
      });
    }
  }, [initialData, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        role_name: formData.role_name.toLowerCase().replace(/\s+/g, '_'),
        permissions: {},
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">{mode === "create" ? "Create Role" : "Edit Role"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none p-1">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role Name (Internal)</label>
            <input
              type="text"
              required
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
              placeholder="e.g., event_lead"
              value={formData.role_name}
              onChange={(e) => setFormData(prev => ({ ...prev, role_name: e.target.value }))}
              disabled={mode === "edit"}
            />
            <p className="text-xs text-gray-500 mt-1">Lowercase with underscores, cannot be changed after creation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              required
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
              placeholder="e.g., Event Lead"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              className="input-dark w-full text-sm rounded-lg px-4 py-3 resize-none"
              rows={3}
              placeholder="Describe the role responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Hierarchy Level</label>
            <input
              type="number"
              required
              min={1}
              max={100}
              className="input-dark w-full text-sm rounded-lg px-4 py-3"
              value={formData.hierarchy_level}
              onChange={(e) => setFormData(prev => ({ ...prev, hierarchy_level: parseInt(e.target.value) || 10 }))}
            />
            <p className="text-xs text-gray-500 mt-1">Lower number = higher priority (1 = Admin, 10 = Default)</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">Active</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="button-glass-secondary hover-lift px-4 py-2 text-sm rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="button-glass-primary hover-lift px-4 py-2 text-sm rounded-lg disabled:opacity-50">
              {submitting ? "Saving..." : mode === "create" ? "Create Role" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RoleManagementPage() {
  const layout = useResponsiveLayout();
  const { showToast } = useToast();
  const {
    roles,
    loading,
    error,
    refetch,
    assignRole,
    revokeRole,
  } = useRoles();

  const { volunteers } = useVolunteers();

  // Map new hook structure to expected format
  const roleDefinitions: Role[] = (roles || []).map((r: any) => ({
    id: r.id,
    role_name: r.roleName || r.role_name || '',
    display_name: r.displayName || r.display_name || '',
    description: r.description || null,
    permissions: r.permissions || {},
    hierarchy_level: r.hierarchyLevel || r.hierarchy_level || 10,
    is_active: r.isActive ?? r.is_active ?? true,
  }));
  const userRoles: UserRoleWithDetails[] = []; // Not fetching user roles in simplified version
  const fetchAll = refetch;

  // Stub functions for role management (not yet implemented with Drizzle)
  const createRoleDefinition = async (_data: any) => {
    showToast("Role creation not yet available", "info");
    return { error: "Not implemented" };
  };
  const updateRoleDefinition = async (_id: string, _data: any) => {
    showToast("Role editing not yet available", "info");
    return { error: "Not implemented" };
  };
  const deactivateRoleDefinition = async (_id: string) => {
    showToast("Role deactivation not yet available", "info");
    return { error: "Not implemented" };
  };

  const [activeTab, setActiveTab] = useState<TabType>("assignments");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  // Stats calculations
  const stats = {
    totalRoles: roleDefinitions.length,
    activeRoles: roleDefinitions.filter(r => r.is_active).length,
    totalAssignments: userRoles.filter(ur => ur.is_active).length,
    admins: userRoles.filter(ur => ur.role_definition?.role_name === 'admin' && ur.is_active).length,
  };

  // Filter user roles
  const filteredUserRoles = userRoles.filter((ur) => {
    if (!ur.is_active) return false;

    const volunteerName = ur.volunteer
      ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}`
      : "";
    const matchesSearch =
      volunteerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ur.volunteer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ur.role_definition?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || ur.role_definition_id === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Filter role definitions
  const filteredRoleDefinitions = roleDefinitions.filter((role) =>
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "admin": return "text-red-400 bg-red-900/30";
      case "program_officer": return "text-blue-400 bg-blue-900/30";
      case "event_lead":
      case "documentation_lead": return "text-purple-400 bg-purple-900/30";
      case "volunteer": return "text-green-400 bg-green-900/30";
      default: return "text-gray-400 bg-gray-900/30";
    }
  };

  const handleAssignRole = async (volunteerId: string, roleId: string, expiresAt: string | null) => {
    const result = await assignRole(volunteerId, roleId, null, expiresAt);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Role assigned successfully", "success");
    }
  };

  const handleRevokeRole = async (userRoleId: string) => {
    if (!confirm("Are you sure you want to revoke this role?")) return;
    const result = await revokeRole(userRoleId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Role revoked successfully", "success");
    }
  };

  const handleCreateRole = async (data: Partial<Role>) => {
    const result = await createRoleDefinition(data as Omit<Role, 'id' | 'created_at' | 'updated_at'>);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Role created successfully", "success");
    }
  };

  const handleUpdateRole = async (data: Partial<Role>) => {
    if (!editingRole) return;
    const result = await updateRoleDefinition(editingRole.id, data);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Role updated successfully", "success");
    }
  };

  const handleDeactivateRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to deactivate this role? Existing assignments will remain but no new assignments can be made.")) return;
    const result = await deactivateRoleDefinition(roleId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Role deactivated", "success");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statsDisplay = [
    { label: "Total Roles", value: stats.totalRoles.toString(), color: "text-blue-400" },
    { label: "Active Roles", value: stats.activeRoles.toString(), color: "text-green-400" },
    { label: "Assignments", value: stats.totalAssignments.toString(), color: "text-purple-400" },
    { label: "Admins", value: stats.admins.toString(), color: "text-red-400" },
  ];

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
          <p className="text-gray-400">{error}</p>
          <button onClick={fetchAll} className="mt-4 button-glass-primary px-4 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}>
      {/* Stats Row */}
      <div className={`grid ${layout.isMobile ? "grid-cols-2" : "grid-cols-4"} gap-4 mb-6`}>
        {loading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          statsDisplay.map((stat, index) => (
            <div key={index} className="card-glass rounded-xl p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700/30 pb-3">
        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "assignments"
              ? "bg-blue-600/30 text-blue-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <i className="fas fa-user-tag mr-2"></i>
          Role Assignments
        </button>
        <button
          onClick={() => setActiveTab("definitions")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "definitions"
              ? "bg-blue-600/30 text-blue-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <i className="fas fa-cog mr-2"></i>
          Role Definitions
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder={activeTab === "assignments" ? "Search volunteers or roles..." : "Search roles..."}
            className="input-dark text-sm rounded-lg py-2 px-3 pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>

        {activeTab === "assignments" && (
          <select
            className="input-dark text-sm rounded-lg py-2 px-3"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {roleDefinitions.filter(r => r.is_active).map((role) => (
              <option key={role.id} value={role.id}>{role.display_name}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => { setSearchTerm(""); setRoleFilter(""); }}
          className="text-gray-500 hover:text-gray-300 text-sm py-2 px-3"
        >
          Clear
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {activeTab === "assignments" ? (
            <button
              onClick={() => setShowAssignModal(true)}
              className="button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <i className="fas fa-user-plus fa-sm"></i>
              <span>Assign Role</span>
            </button>
          ) : (
            <button
              onClick={() => { setEditingRole(undefined); setShowRoleModal(true); }}
              className="button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <i className="fas fa-plus fa-sm"></i>
              <span>Create Role</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={fetchAll} className="action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg">
            <i className="fas fa-sync"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="card-glass rounded-xl overflow-hidden">
        {activeTab === "assignments" ? (
          <>
            {/* Assignments Table Header */}
            <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
              <div className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-5"} gap-4 items-center`}>
                {!layout.isMobile && (
                  <>
                    <div className="col-span-2 text-sm font-medium text-gray-300">Volunteer</div>
                    <div className="text-sm font-medium text-gray-300">Role</div>
                    <div className="text-sm font-medium text-gray-300">Assigned</div>
                    <div className="text-sm font-medium text-gray-300">Actions</div>
                  </>
                )}
                {layout.isMobile && (
                  <div className="text-sm font-medium text-gray-300">Role Assignments ({filteredUserRoles.length})</div>
                )}
              </div>
            </div>

            {/* Assignments Table Body */}
            <div className="divide-y divide-gray-700/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ))
              ) : filteredUserRoles.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">
                  <i className="fas fa-user-tag text-4xl mb-3"></i>
                  <p>No role assignments found</p>
                </div>
              ) : (
                filteredUserRoles.map((ur) => (
                  <div key={ur.id} className="px-4 py-3 hover:bg-gray-800/20 transition-colors">
                    {layout.isMobile ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Image
                            src={ur.volunteer?.profile_pic || "/icon-192x192.png"}
                            alt={ur.volunteer ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}` : "Unknown"}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-200">
                              {ur.volunteer ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}` : "Unknown"}
                            </h4>
                            <p className="text-sm text-gray-400">{ur.volunteer?.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(ur.role_definition?.role_name || "")}`}>
                            {ur.role_definition?.display_name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Assigned: {formatDate(ur.assigned_at)}</span>
                          <button
                            onClick={() => handleRevokeRole(ur.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <i className="fas fa-times-circle"></i> Revoke
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-4 items-center">
                        <div className="col-span-2 flex items-center space-x-3">
                          <Image
                            src={ur.volunteer?.profile_pic || "/icon-192x192.png"}
                            alt={ur.volunteer ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}` : "Unknown"}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="font-medium text-gray-200 text-sm">
                              {ur.volunteer ? `${ur.volunteer.first_name} ${ur.volunteer.last_name}` : "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500">{ur.volunteer?.email}</div>
                          </div>
                        </div>
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(ur.role_definition?.role_name || "")}`}>
                            {ur.role_definition?.display_name || "Unknown"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300">{formatDate(ur.assigned_at)}</div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRevokeRole(ur.id)}
                            className="text-gray-400 hover:text-red-400 p-1 rounded"
                            title="Revoke role"
                          >
                            <i className="fas fa-times-circle"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Definitions Table Header */}
            <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
              <div className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-5"} gap-4 items-center`}>
                {!layout.isMobile && (
                  <>
                    <div className="text-sm font-medium text-gray-300">Role Name</div>
                    <div className="col-span-2 text-sm font-medium text-gray-300">Description</div>
                    <div className="text-sm font-medium text-gray-300">Status</div>
                    <div className="text-sm font-medium text-gray-300">Actions</div>
                  </>
                )}
                {layout.isMobile && (
                  <div className="text-sm font-medium text-gray-300">Role Definitions ({filteredRoleDefinitions.length})</div>
                )}
              </div>
            </div>

            {/* Definitions Table Body */}
            <div className="divide-y divide-gray-700/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ))
              ) : filteredRoleDefinitions.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">
                  <i className="fas fa-cog text-4xl mb-3"></i>
                  <p>No roles found</p>
                </div>
              ) : (
                filteredRoleDefinitions.map((role) => (
                  <div key={role.id} className="px-4 py-3 hover:bg-gray-800/20 transition-colors">
                    {layout.isMobile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-200">{role.display_name}</h4>
                            <p className="text-xs text-gray-500">{role.role_name}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${role.is_active ? "text-green-400 bg-green-900/30" : "text-red-400 bg-red-900/30"}`}>
                            {role.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{role.description || "No description"}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Level: {role.hierarchy_level}</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => { setEditingRole(role); setShowRoleModal(true); }}
                              className="text-blue-400 hover:text-blue-300 p-1"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {role.is_active && (
                              <button
                                onClick={() => handleDeactivateRole(role.id)}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <i className="fas fa-ban"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-4 items-center">
                        <div>
                          <div className="font-medium text-gray-200 text-sm">{role.display_name}</div>
                          <div className="text-xs text-gray-500">{role.role_name}</div>
                        </div>
                        <div className="col-span-2 text-sm text-gray-400 truncate">
                          {role.description || "No description"}
                        </div>
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full ${role.is_active ? "text-green-400 bg-green-900/30" : "text-red-400 bg-red-900/30"}`}>
                            {role.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => { setEditingRole(role); setShowRoleModal(true); }}
                            className="text-gray-400 hover:text-blue-400 p-1 rounded"
                            title="Edit role"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {role.is_active && (
                            <button
                              onClick={() => handleDeactivateRole(role.id)}
                              className="text-gray-400 hover:text-red-400 p-1 rounded"
                              title="Deactivate role"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AssignRoleModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        roleDefinitions={roleDefinitions}
        volunteers={volunteers.map(v => ({
          id: v.id,
          first_name: v.first_name,
          last_name: v.last_name,
          email: v.email,
          profile_pic: v.profile_pic || null
        }))}
        onAssign={handleAssignRole}
        existingRoles={userRoles}
      />

      <RoleDefinitionModal
        isOpen={showRoleModal}
        onClose={() => { setShowRoleModal(false); setEditingRole(undefined); }}
        onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
        initialData={editingRole}
        mode={editingRole ? "edit" : "create"}
      />
    </div>
  );
}
