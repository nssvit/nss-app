"use client";

import { useState, useEffect } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "./Skeleton";
import Image from "next/image";

interface User {
  id: string;
  volunteer_id: string;
  email: string;
  role_name: string;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  volunteer: {
    first_name: string;
    last_name: string;
    email: string;
    profile_picture_url: string | null;
  } | null;
}

export function UserManagementPage() {
  const layout = useResponsiveLayout();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    admins: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch users with their roles and volunteer info in parallel
      const [usersResult, statsResult] = await Promise.all([
        supabase
          .from('users')
          .select(`
            id,
            volunteer_id,
            email,
            role_name,
            is_active,
            last_sign_in_at,
            created_at,
            volunteers (
              first_name,
              last_name,
              email,
              profile_picture_url
            )
          `)
          .order('created_at', { ascending: false }),

        // Get stats
        supabase.rpc('get_user_stats')
      ]);

      if (usersResult.error) throw usersResult.error;

      setUsers(usersResult.data || []);

      // Calculate stats from the data if RPC fails
      if (statsResult.error || !statsResult.data) {
        const totalUsers = usersResult.data?.length || 0;
        const activeUsers = usersResult.data?.filter(u => u.is_active).length || 0;
        const admins = usersResult.data?.filter(u => u.role_name === 'admin').length || 0;

        setStats({
          totalUsers,
          activeUsers,
          pendingUsers: 0,
          admins
        });
      } else {
        setStats({
          totalUsers: statsResult.data.total_users || 0,
          activeUsers: statsResult.data.active_users || 0,
          pendingUsers: statsResult.data.pending_users || 0,
          admins: statsResult.data.admin_count || 0
        });
      }

    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = user.volunteer
      ? `${user.volunteer.first_name} ${user.volunteer.last_name}`
      : user.email;

    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role_name === roleFilter;
    const matchesStatus = !statusFilter ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-red-400 bg-red-900/30";
      case "program_officer":
        return "text-blue-400 bg-blue-900/30";
      case "event_lead":
      case "documentation_lead":
        return "text-purple-400 bg-purple-900/30";
      case "volunteer":
        return "text-green-400 bg-green-900/30";
      default:
        return "text-gray-400 bg-gray-900/30";
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "text-green-400 bg-green-900/30"
      : "text-red-400 bg-red-900/30";
  };

  const handleSelectUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter((userId) => userId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length
        ? []
        : filteredUsers.map((u) => u.id),
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const formatLastLogin = (lastSignIn: string | null) => {
    if (!lastSignIn) return "Never";

    const date = new Date(lastSignIn);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatJoinDate = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const statsDisplay = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), color: "text-blue-400" },
    { label: "Active Users", value: stats.activeUsers.toLocaleString(), color: "text-green-400" },
    { label: "Pending Approvals", value: stats.pendingUsers.toLocaleString(), color: "text-yellow-400" },
    { label: "Admins", value: stats.admins.toLocaleString(), color: "text-red-400" },
  ];

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      {/* Stats Row */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-2" : "grid-cols-4"} gap-4 mb-6`}
      >
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
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Search and Filters */}
      <div
        className={`flex flex-wrap items-center gap-3 mb-6 ${layout.isMobile ? "px-0" : "px-1"}`}
      >
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search users..."
            className="input-dark text-sm rounded-lg py-2 px-3 pl-9 focus:outline-none placeholder-gray-500 focus-visible w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
        </div>

        <select
          className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="program_officer">Program Officer</option>
          <option value="event_lead">Event Lead</option>
          <option value="documentation_lead">Documentation Lead</option>
          <option value="volunteer">Volunteer</option>
        </select>

        <select
          className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          className="text-gray-500 hover:text-gray-300 text-sm py-2 px-3 transition-colors focus-visible rounded"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium focus-visible">
            <i className="fas fa-user-plus fa-sm"></i>
            <span>Add User</span>
          </button>

          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {selectedUsers.length} selected
              </span>
              <button className="pwa-button button-glass-secondary hover-lift px-3 py-2 rounded-lg text-sm focus-visible">
                <i className="fas fa-envelope fa-sm mr-2"></i>
                Send Email
              </button>
              <button className="pwa-button button-glass-secondary hover-lift px-3 py-2 rounded-lg text-sm focus-visible">
                <i className="fas fa-user-cog fa-sm mr-2"></i>
                Manage
              </button>
              <button className="pwa-button text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-sm focus-visible">
                <i className="fas fa-ban fa-sm mr-2"></i>
                Deactivate
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="pwa-button action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible"
            onClick={fetchUsers}
          >
            <i className="fas fa-sync"></i>
          </button>
          <button className="pwa-button action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible">
            <i className="fas fa-download"></i>
          </button>
          <button className="pwa-button action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-glass rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
          <div
            className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-7"} gap-4 items-center`}
          >
            {!layout.isMobile && (
              <>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={
                      selectedUsers.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-300">
                  User
                </div>
                <div className="text-sm font-medium text-gray-300">Role</div>
                <div className="text-sm font-medium text-gray-300">Status</div>
                <div className="text-sm font-medium text-gray-300">
                  Last Login
                </div>
                <div className="text-sm font-medium text-gray-300">Actions</div>
              </>
            )}
            {layout.isMobile && (
              <div className="text-sm font-medium text-gray-300">
                Users ({filteredUsers.length})
              </div>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-700/30">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <i className="fas fa-users text-4xl mb-3"></i>
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const displayName = user.volunteer
                ? `${user.volunteer.first_name} ${user.volunteer.last_name}`
                : user.email.split('@')[0];
              const displayEmail = user.volunteer?.email || user.email;
              const avatar = user.volunteer?.profile_picture_url || "/icon-192x192.png";

              return (
                <div
                  key={user.id}
                  className="px-4 py-3 hover:bg-gray-800/20 transition-colors"
                >
                  {layout.isMobile ? (
                    // Mobile Layout
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                        <Image
                          src={avatar}
                          alt={displayName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-200">{displayName}</h4>
                          <p className="text-sm text-gray-400">{displayEmail}</p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role_name)}`}
                          >
                            {user.role_name}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(user.is_active)}`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Last login: {formatLastLogin(user.last_sign_in_at)}
                        </span>
                        <div className="flex space-x-2">
                          <button className="pwa-button action-button text-gray-400 hover:text-blue-400 p-1 rounded focus-visible">
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button className="pwa-button action-button text-gray-400 hover:text-green-400 p-1 rounded focus-visible">
                            <i className="fas fa-eye text-sm"></i>
                          </button>
                          <button className="pwa-button action-button text-gray-400 hover:text-red-400 p-1 rounded focus-visible">
                            <i className="fas fa-ban text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Desktop Layout
                    <div className="grid grid-cols-7 gap-4 items-center">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="checkbox-custom"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </div>
                      <div className="col-span-2 flex items-center space-x-3">
                        <Image
                          src={avatar}
                          alt={displayName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-gray-200 text-sm">
                            {displayName}
                          </div>
                          <div className="text-xs text-gray-500">{displayEmail}</div>
                        </div>
                      </div>
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role_name)}`}
                        >
                          {user.role_name}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(user.is_active)}`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {formatLastLogin(user.last_sign_in_at)}
                      </div>
                      <div className="flex space-x-2">
                        <button className="pwa-button action-button text-gray-400 hover:text-blue-400 p-1 rounded focus-visible">
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button className="pwa-button action-button text-gray-400 hover:text-green-400 p-1 rounded focus-visible">
                          <i className="fas fa-eye text-sm"></i>
                        </button>
                        <button className="pwa-button action-button text-gray-400 hover:text-red-400 p-1 rounded focus-visible">
                          <i className="fas fa-ban text-sm"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
