"use client";

import { useState } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import Image from "next/image";

interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Coordinator" | "Volunteer";
  status: "Active" | "Inactive" | "Pending";
  lastLogin: string;
  joinDate: string;
  permissions: string[];
  avatar: string;
}

export function UserManagementPage() {
  const layout = useResponsiveLayout();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const users: User[] = [
    {
      id: 1,
      name: "Admin",
      email: "admin@vit.edu.in",
      role: "Admin",
      status: "Active",
      lastLogin: "2 hours ago",
      joinDate: "Jan 2020",
      permissions: ["all"],
      avatar: "/icon-192x192.png",
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      email: "priya.sharma@vit.ac.in",
      role: "Coordinator",
      status: "Active",
      lastLogin: "1 day ago",
      joinDate: "Mar 2021",
      permissions: ["manage_events", "view_reports", "manage_volunteers"],
      avatar: "https://i.imgur.com/7OtnwP9.png",
    },
    {
      id: 3,
      name: "Arjun Patel",
      email: "arjun.patel@vitstudent.ac.in",
      role: "Volunteer",
      status: "Active",
      lastLogin: "5 hours ago",
      joinDate: "Aug 2024",
      permissions: ["view_events", "mark_attendance"],
      avatar: "https://i.imgur.com/gVo4gxC.png",
    },
    {
      id: 4,
      name: "Sneha Reddy",
      email: "sneha.reddy@vitstudent.ac.in",
      role: "Volunteer",
      status: "Pending",
      lastLogin: "Never",
      joinDate: "Nov 2024",
      permissions: ["view_events"],
      avatar: "https://i.imgur.com/gJgRz7n.png",
    },
  ];

  // Role permissions for future implementation
  // const rolePermissions = {
  //   Admin: ["all"],
  //   Coordinator: ["manage_events", "view_reports", "manage_volunteers", "view_attendance"],
  //   Volunteer: ["view_events", "mark_attendance", "view_profile"]
  // }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "text-red-400 bg-red-900/30";
      case "Coordinator":
        return "text-blue-400 bg-blue-900/30";
      case "Volunteer":
        return "text-green-400 bg-green-900/30";
      default:
        return "text-gray-400 bg-gray-900/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-400 bg-green-900/30";
      case "Inactive":
        return "text-red-400 bg-red-900/30";
      case "Pending":
        return "text-yellow-400 bg-yellow-900/30";
      default:
        return "text-gray-400 bg-gray-900/30";
    }
  };

  const handleSelectUser = (id: number) => {
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

  const stats = [
    { label: "Total Users", value: "1,847", color: "text-blue-400" },
    { label: "Active Users", value: "1,623", color: "text-green-400" },
    { label: "Pending Approvals", value: "45", color: "text-yellow-400" },
    { label: "Admins", value: "8", color: "text-red-400" },
  ];

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      {/* Stats Row */}
      <div
        className={`grid ${layout.isMobile ? "grid-cols-2" : "grid-cols-4"} gap-4 mb-6`}
      >
        {stats.map((stat, index) => (
          <div key={index} className="card-glass rounded-xl p-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          </div>
        ))}
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
          <option value="Admin">Admin</option>
          <option value="Coordinator">Coordinator</option>
          <option value="Volunteer">Volunteer</option>
        </select>

        <select
          className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
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
          {filteredUsers.map((user) => (
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
                      src={user.avatar}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-200">{user.name}</h4>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Last login: {user.lastLogin}
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
                      src={user.avatar}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-200 text-sm">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(user.status)}`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">{user.lastLogin}</div>
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
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 safe-area-bottom">
        <nav className={`flex ${layout.isMobile ? "space-x-1" : "space-x-2"}`}>
          <button
            className={`pagination-button ${layout.isMobile ? "px-2 py-2 text-sm" : "px-3 py-2 text-sm"} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed pwa-button focus-visible`}
            disabled
          >
            {layout.isMobile ? "‹" : "Previous"}
          </button>
          <button
            className={`pagination-button active ${layout.isMobile ? "px-3 py-2 text-sm" : "px-3 py-2 text-sm"} rounded-lg pwa-button focus-visible`}
          >
            1
          </button>
          <button
            className={`pagination-button ${layout.isMobile ? "px-3 py-2 text-sm" : "px-3 py-2 text-sm"} rounded-lg pwa-button focus-visible`}
          >
            2
          </button>
          <button
            className={`pagination-button ${layout.isMobile ? "px-2 py-2 text-sm" : "px-3 py-2 text-sm"} rounded-lg pwa-button focus-visible`}
          >
            {layout.isMobile ? "›" : "Next"}
          </button>
        </nav>
      </div>
    </div>
  );
}
