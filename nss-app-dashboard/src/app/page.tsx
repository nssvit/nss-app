"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { EventCard } from "@/components/EventCard";
import { EventModal } from "@/components/EventModal";
import { DashboardPage } from "@/components/DashboardPage";
import { VolunteersPage } from "@/components/VolunteersPage";
import { AttendancePage } from "@/components/AttendancePage";
import { ReportsPage } from "@/components/ReportsPage";
import { UserManagementPage } from "@/components/UserManagementPage";
import { SettingsPage } from "@/components/SettingsPage";
import { ProfilePage } from "@/components/ProfilePage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

// Sample events data matching the prototype
const sampleEvents = [
  {
    id: 1,
    title: "Beach Clean-Up Drive",
    date: "Aug 15",
    description: "Annual Juhu Beach clean-up. Promote environmental awareness.",
    category: "Area Based - 1",
    hours: "4",
    participants: [
      { avatar: "https://i.imgur.com/gVo4gxC.png", alt: "User" },
      { avatar: "https://i.imgur.com/7OtnwP9.png", alt: "User" },
    ],
    participantCount: 73,
  },
  {
    id: 2,
    title: "Blood Donation VIT",
    date: "Sep 10",
    description:
      "Organized with local hospitals to encourage blood donation among students and staff.",
    category: "College Event",
    hours: "3",
    participants: [{ avatar: "https://i.imgur.com/gJgRz7n.png", alt: "User" }],
    participantCount: 118,
  },
  {
    id: 3,
    title: "NSS Camp - Kuderan",
    date: "Nov 27",
    description:
      "7-day camp: rural development, health, infrastructure. Theme: Sarvangin Vikas.",
    category: "Camp",
    hours: "50",
    participants: [
      { avatar: "https://i.imgur.com/xG2942s.png", alt: "User" },
      { avatar: "https://i.imgur.com/gVo4gxC.png", alt: "User" },
    ],
    participantCount: 48,
  },
  {
    id: 4,
    title: "Digital Literacy Workshop",
    date: "Dec 5",
    description:
      "Teaching basic computer skills and digital literacy to local community members.",
    category: "Workshop",
    hours: "6",
    participants: [
      { avatar: "https://i.imgur.com/gVo4gxC.png", alt: "User" },
      { avatar: "https://i.imgur.com/7OtnwP9.png", alt: "User" },
      { avatar: "https://i.imgur.com/xG2942s.png", alt: "User" },
    ],
    participantCount: 32,
  },
];

interface EventData {
  eventName: string;
  eventDate: string;
  eventDescription: string;
  eventCategory: string;
  declaredHours: string;
  academicSession: string;
  eventLocation: string;
}

export default function Dashboard() {
  const [activeLink, setActiveLink] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState(sampleEvents);
  const [filteredEvents, setFilteredEvents] = useState(sampleEvents);

  // Use responsive layout hook
  const layout = useResponsiveLayout();

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((event) => event.category === categoryFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, categoryFilter]);

  const handleCreateEvent = (eventData: EventData) => {
    const newEvent = {
      id: events.length + 1,
      title: eventData.eventName,
      date: new Date(eventData.eventDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      description: eventData.eventDescription,
      category: eventData.eventCategory,
      hours: eventData.declaredHours,
      participants: [
        { avatar: "https://i.imgur.com/gVo4gxC.png", alt: "User" },
      ],
      participantCount: 0,
    };
    setEvents([...events, newEvent]);
  };

  const handleEditEvent = (eventId: number) => {
    console.log("Edit event:", eventId);
    // Implement edit functionality
  };

  const handleViewParticipants = (eventId: number) => {
    console.log("View participants:", eventId);
    // Implement view participants functionality
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((event) => event.id !== eventId));
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSessionFilter("");
    setCategoryFilter("");
  };

  const getPageTitle = (page: string) => {
    switch (page) {
      case "dashboard":
        return "Dashboard";
      case "events":
        return "Events";
      case "volunteers":
        return "Volunteers";
      case "attendance":
        return "Attendance";
      case "reports":
        return "Reports";
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
      case "volunteers":
        return "fas fa-users";
      case "attendance":
        return "fas fa-user-check";
      case "reports":
        return "fas fa-chart-pie";
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
        return (
          <DashboardPage
            onNavigate={(page) => setActiveLink(page)}
            onCreateEvent={() => setIsModalOpen(true)}
          />
        );

      case "volunteers":
        return <VolunteersPage />;

      case "attendance":
        return <AttendancePage />;

      case "reports":
        return <ReportsPage />;

      case "user-management":
        return <UserManagementPage />;

      case "settings":
        return <SettingsPage />;

      case "profile":
        return <ProfilePage />;

      case "events":
      default:
        return (
          <div
            className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
          >
            {/* Mobile Search Bar */}
            {layout.isMobile && (
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="input-dark text-sm rounded-lg py-3 px-4 pl-10 focus:outline-none placeholder-gray-500 focus-visible w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                </div>
              </div>
            )}

            {/* Responsive Filters Row */}
            <div
              className={`flex flex-wrap items-center gap-3 mb-6 ${layout.isMobile ? "px-0" : "px-1"}`}
            >
              <select
                className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible flex-1 min-w-0"
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
              >
                <option value="">All Sessions</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
              <select
                className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible flex-1 min-w-0"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Area Based - 1">Area Based - 1</option>
                <option value="Camp">Camp</option>
                <option value="College Event">College Event</option>
                <option value="Workshop">Workshop</option>
              </select>
              <button className="pwa-button button-glass-secondary hover-lift flex items-center space-x-2 text-sm py-2 px-3 rounded-lg focus-visible">
                <i className="fas fa-filter fa-sm"></i>
                {!layout.isMobile && <span>Filter</span>}
              </button>
              <button
                className="text-gray-500 hover:text-gray-300 text-sm py-2 px-3 transition-colors focus-visible rounded"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>

            {/* Events Grid */}
            <div className={`grid ${layout.getGridColumns()} gap-4`}>
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={event.date}
                  description={event.description}
                  category={event.category}
                  hours={event.hours}
                  participants={event.participants}
                  participantCount={event.participantCount}
                  onEdit={() => handleEditEvent(event.id)}
                  onViewParticipants={() => handleViewParticipants(event.id)}
                  onDelete={() => handleDeleteEvent(event.id)}
                />
              ))}
            </div>

            {/* Responsive Pagination */}
            <div className="flex justify-center mt-8 md:mt-6 safe-area-bottom">
              <nav
                className={`flex ${layout.isMobile ? "space-x-1" : "space-x-2"}`}
              >
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
                  className={`pagination-button ${layout.isMobile ? "px-3 py-2 text-sm" : "px-3 py-2 text-sm"} rounded-lg pwa-button focus-visible`}
                >
                  3
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
  };

  return (
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
          className={`flex items-center justify-between border-b border-gray-700/30 sticky top-0 z-20 header-bg safe-area-top ${
            layout.isMobile ? "mobile-header px-4 py-3" : "px-5 py-4 h-16"
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
            {/* Search Input - Hide on very small screens for non-events pages */}
            {!layout.isMobile && activeLink === "events" && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  className="input-dark text-sm rounded-lg py-2 px-3 pl-9 focus:outline-none placeholder-gray-500 focus-visible"
                  style={{ width: layout.isTablet ? "180px" : "220px" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
              </div>
            )}

            {/* Mobile search button - only show on events page */}
            {layout.isMobile && activeLink === "events" && (
              <button className="pwa-button action-button hover-lift text-gray-400 hover:text-gray-200 p-2 rounded-lg">
                <i className="fas fa-search text-base"></i>
              </button>
            )}

            {/* Create Event Button - only show on events page */}
            {activeLink === "events" && (
              <button
                className={`button-glass-primary hover-lift flex items-center rounded-lg font-medium focus-visible ${
                  layout.isMobile ? "p-2" : "space-x-2 px-4 py-2"
                }`}
                style={{ fontSize: layout.isMobile ? undefined : "0.94rem" }}
                onClick={() => setIsModalOpen(true)}
              >
                <i
                  className={`fas fa-plus ${layout.isMobile ? "text-base" : "fa-sm"}`}
                ></i>
                {!layout.isMobile && <span>Create Event</span>}
              </button>
            )}

            <ThemeToggle />

            <button className="pwa-button action-button hover-lift text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible">
              <i
                className={`far fa-bell ${layout.isMobile ? "text-base" : "fa-sm"}`}
              ></i>
            </button>
          </div>
        </header>

        {/* Page Content */}
        {renderPageContent()}
      </main>

      {/* Event Modal - only show on events page */}
      {activeLink === "events" && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateEvent}
        />
      )}
    </div>
  );
}
