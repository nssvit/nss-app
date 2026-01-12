"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { EventsPage } from "@/components/EventsPage";
import { DashboardPage } from "@/components/DashboardPage";
import { VolunteersPage } from "@/components/VolunteersPage";
import { AttendancePage } from "@/components/AttendancePage";
import { ReportsPage } from "@/components/ReportsPage";
import { UserManagementPage } from "@/components/UserManagementPage";
import { SettingsPage } from "@/components/SettingsPage";
import { ProfilePage } from "@/components/ProfilePage";
import { AuthGuard } from "@/components/AuthGuard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserProfileHeader } from "@/components/UserProfileHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { HeadsDashboard } from "@/components/dashboards/HeadsDashboard";
import { VolunteerDashboard } from "@/components/dashboards/VolunteerDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { EventRegistration } from "@/components/EventRegistration";
import { RoleManagementPage } from "@/components/RoleManagementPage";
import { CategoryManagementPage } from "@/components/CategoryManagementPage";
import { HoursApprovalPage } from "@/components/HoursApprovalPage";
import { AttendanceManager } from "@/components/AttendanceManager";

export default function Dashboard() {
  const [activeLink, setActiveLink] = useState("dashboard");

  // Use responsive layout hook and auth
  const layout = useResponsiveLayout();
  const { hasRole, hasAnyRole } = useAuth();

  const getPageTitle = (page: string) => {
    switch (page) {
      case "dashboard":
        return "Dashboard";
      case "events":
        return "Events";
      case "event-registration":
        return "Event Registration";
      case "volunteers":
        return "Volunteers";
      case "attendance":
        return "Attendance";
      case "reports":
        return "Reports";
      case "hours-approval":
        return "Hours Approval";
      case "attendance-manager":
        return "Mark Attendance";
      case "role-management":
        return "Role Management";
      case "categories":
        return "Categories";
      case "user-management":
        return "User Management";
      case "settings":
        return "Settings";
      case "profile":
        return "Profile";
      default:
        return "Dashboard";
    }
  };

  const getPageIcon = (page: string) => {
    switch (page) {
      case "dashboard":
        return "fas fa-border-all";
      case "events":
        return "fas fa-calendar-check";
      case "event-registration":
        return "fas fa-clipboard-list";
      case "volunteers":
        return "fas fa-users";
      case "attendance":
        return "fas fa-user-check";
      case "reports":
        return "fas fa-chart-pie";
      case "hours-approval":
        return "fas fa-clock";
      case "attendance-manager":
        return "fas fa-clipboard-check";
      case "role-management":
        return "fas fa-user-tag";
      case "categories":
        return "fas fa-folder-open";
      case "user-management":
        return "fas fa-user-shield";
      case "settings":
        return "fas fa-cog";
      case "profile":
        return "fas fa-user";
      default:
        return "fas fa-border-all";
    }
  };

  const renderPageContent = () => {
    switch (activeLink) {
      case "dashboard":
        // Role-based dashboard rendering
        if (hasRole('admin')) {
          return <AdminDashboard onNavigate={(page) => setActiveLink(page)} />;
        } else if (hasAnyRole(['program_officer', 'documentation_lead', 'event_lead'])) {
          return <HeadsDashboard onNavigate={(page) => setActiveLink(page)} />;
        } else {
          return <VolunteerDashboard onNavigate={(page) => setActiveLink(page)} />;
        }

      case "event-registration":
        return <EventRegistration />;

      case "volunteers":
        return (
          <ProtectedRoute requireAnyRole={['admin', 'program_officer', 'documentation_lead']}>
            <VolunteersPage />
          </ProtectedRoute>
        );

      case "attendance":
        return (
          <ProtectedRoute requireAnyRole={['admin', 'program_officer', 'event_lead']}>
            <AttendancePage />
          </ProtectedRoute>
        );

      case "reports":
        return (
          <ProtectedRoute requireAnyRole={['admin', 'program_officer']}>
            <ReportsPage />
          </ProtectedRoute>
        );

      case "hours-approval":
        return (
          <ProtectedRoute requireAnyRole={['admin', 'program_officer']}>
            <HoursApprovalPage />
          </ProtectedRoute>
        );

      case "attendance-manager":
        return (
          <ProtectedRoute requireAnyRole={['admin', 'program_officer', 'event_lead', 'head']}>
            <AttendanceManager />
          </ProtectedRoute>
        );

      case "role-management":
        return (
          <ProtectedRoute requireRoles={['admin']}>
            <RoleManagementPage />
          </ProtectedRoute>
        );

      case "categories":
        return (
          <ProtectedRoute requireRoles={['admin']}>
            <CategoryManagementPage />
          </ProtectedRoute>
        );

      case "user-management":
        return (
          <ProtectedRoute requireRoles={['admin']}>
            <UserManagementPage />
          </ProtectedRoute>
        );

      case "settings":
        return (
          <ProtectedRoute requireAnyRole={['admin', 'program_officer']}>
            <SettingsPage />
          </ProtectedRoute>
        );

      case "profile":
        return <ProfilePage />;

      case "events":
      default:
        return <EventsPage />;
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          activeLink={activeLink}
          onLinkClick={setActiveLink}
          collapsed={layout.sidebarCollapsed}
          onToggle={layout.toggleSidebar}
          isMobile={layout.isMobile}
          showMobileMenu={layout.showMobileMenu}
          onToggleMobileMenu={layout.toggleMobileMenu}
          onCloseMobileMenu={layout.closeMobileMenu}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col header-bg">
          {/* Responsive Top Bar */}
          <header
            className={`flex items-center justify-between border-b border-gray-700/30 sticky top-0 z-20 header-bg safe-area-top ${layout.isMobile ? "mobile-header px-4 py-3" : "px-5 py-4 h-16"
              }`}
          >
            <div className="flex items-center space-x-3 h-8">
              {/* Mobile menu button */}
              {layout.isMobile && (
                <button
                  className="pwa-button text-gray-400 hover:text-gray-200 p-2 mr-2"
                  onClick={layout.toggleMobileMenu}
                >
                  <i className="fas fa-bars text-lg"></i>
                </button>
              )}
              <div className="flex items-center space-x-3">
                <i
                  className={`${getPageIcon(activeLink)} text-lg text-indigo-400`}
                ></i>
                <h1
                  className={`font-semibold text-gray-100 ${layout.isMobile ? "text-base" : "text-lg"}`}
                >
                  NSS VIT{" "}
                  {!layout.isMobile && (
                    <>
                      /{" "}
                      <span className="text-gray-400">
                        {getPageTitle(activeLink)}
                      </span>
                    </>
                  )}
                </h1>
              </div>
            </div>

            {/* Header Actions */}
            <div
              className={`flex items-center ${layout.isMobile ? "space-x-2" : "space-x-3"}`}
            >
              <ThemeToggle />
              <button className="pwa-button action-button hover-lift text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible">
                <i
                  className={`far fa-bell ${layout.isMobile ? "text-base" : "fa-sm"}`}
                ></i>
              </button>

              <UserProfileHeader />
            </div>
          </header>

          {/* Page Content */}
          {renderPageContent()}
        </main>

      </div>
    </AuthGuard>
  );
}
