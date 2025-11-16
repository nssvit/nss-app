"use client";

import { useState } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import Image from "next/image";
import { getStatusClasses } from "@/utils/colors/statusColors";

interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  year: string;
  branch: string;
  eventsParticipated: number;
  totalHours: number;
  status: "Active" | "Inactive" | "Pending";
  joinDate: string;
  avatar: string;
}

export function VolunteersPage() {
  const layout = useResponsiveLayout();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [selectedVolunteers, setSelectedVolunteers] = useState<number[]>([]);

  const volunteers: Volunteer[] = [
    {
      id: 1,
      name: "Arjun Patel",
      email: "arjun.patel@vitstudent.ac.in",
      phone: "+91 9876543210",
      year: "3rd Year",
      branch: "Computer Science",
      eventsParticipated: 12,
      totalHours: 48,
      status: "Active",
      joinDate: "Jan 2024",
      avatar: "https://i.imgur.com/gVo4gxC.png",
    },
    {
      id: 2,
      name: "Priya Sharma",
      email: "priya.sharma@vitstudent.ac.in",
      phone: "+91 9765432109",
      year: "2nd Year",
      branch: "Electronics",
      eventsParticipated: 8,
      totalHours: 32,
      status: "Active",
      joinDate: "Feb 2024",
      avatar: "https://i.imgur.com/7OtnwP9.png",
    },
    {
      id: 3,
      name: "Raj Kumar",
      email: "raj.kumar@vitstudent.ac.in",
      phone: "+91 9654321098",
      year: "4th Year",
      branch: "Mechanical",
      eventsParticipated: 15,
      totalHours: 75,
      status: "Active",
      joinDate: "Sep 2023",
      avatar: "https://i.imgur.com/xG2942s.png",
    },
    {
      id: 4,
      name: "Sneha Reddy",
      email: "sneha.reddy@vitstudent.ac.in",
      phone: "+91 9543210987",
      year: "1st Year",
      branch: "Civil",
      eventsParticipated: 3,
      totalHours: 12,
      status: "Pending",
      joinDate: "Nov 2024",
      avatar: "https://i.imgur.com/gJgRz7n.png",
    },
  ];

  const filteredVolunteers = volunteers.filter((volunteer) => {
    const matchesSearch =
      volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || volunteer.status === statusFilter;
    const matchesYear = !yearFilter || volunteer.year === yearFilter;

    return matchesSearch && matchesStatus && matchesYear;
  });

  const handleSelectVolunteer = (id: number) => {
    setSelectedVolunteers((prev) =>
      prev.includes(id)
        ? prev.filter((volunteerId) => volunteerId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    setSelectedVolunteers(
      selectedVolunteers.length === filteredVolunteers.length
        ? []
        : filteredVolunteers.map((v) => v.id),
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setYearFilter("");
  };

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
              placeholder="Search volunteers..."
              className="input-dark text-sm rounded-lg py-3 px-4 pl-10 focus:outline-none placeholder-gray-500 focus-visible w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div
        className={`flex flex-wrap items-center gap-3 mb-6 ${layout.isMobile ? "px-0" : "px-1"}`}
      >
        {/* Desktop Search */}
        {!layout.isMobile && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search volunteers..."
              className="input-dark text-sm rounded-lg py-2 px-3 pl-9 focus:outline-none placeholder-gray-500 focus-visible search-input-responsive"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"></i>
          </div>
        )}

        <select
          className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible flex-1 min-w-0"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>

        <select
          className="input-dark text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible flex-1 min-w-0"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="">All Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
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
            <span>Add Volunteer</span>
          </button>

          {selectedVolunteers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {selectedVolunteers.length} selected
              </span>
              <button className="pwa-button button-glass-secondary hover-lift px-3 py-2 rounded-lg text-sm focus-visible">
                <i className="fas fa-envelope fa-sm mr-2"></i>
                Send Email
              </button>
              <button className="pwa-button text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-sm focus-visible">
                <i className="fas fa-trash fa-sm mr-2"></i>
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button className="pwa-button action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible">
            <i className="fas fa-download"></i>
          </button>
          <button className="pwa-button action-button text-gray-400 hover:text-gray-200 p-2 rounded-lg focus-visible">
            <i className="fas fa-filter"></i>
          </button>
        </div>
      </div>

      {/* Volunteers List */}
      <div className="card-glass rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-700/30">
          <div
            className={`grid ${layout.isMobile ? "grid-cols-1" : "grid-cols-8"} gap-4 items-center`}
          >
            {!layout.isMobile && (
              <>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={
                      selectedVolunteers.length === filteredVolunteers.length &&
                      filteredVolunteers.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-300">
                  Name
                </div>
                <div className="text-sm font-medium text-gray-300">Year</div>
                <div className="text-sm font-medium text-gray-300">Branch</div>
                <div className="text-sm font-medium text-gray-300">Events</div>
                <div className="text-sm font-medium text-gray-300">Hours</div>
                <div className="text-sm font-medium text-gray-300">Status</div>
              </>
            )}
            {layout.isMobile && (
              <div className="text-sm font-medium text-gray-300">
                Volunteers ({filteredVolunteers.length})
              </div>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-700/30">
          {filteredVolunteers.map((volunteer) => (
            <div
              key={volunteer.id}
              className="px-4 py-3 hover:bg-gray-800/20 transition-colors"
            >
              {layout.isMobile ? (
                // Mobile Layout
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={selectedVolunteers.includes(volunteer.id)}
                      onChange={() => handleSelectVolunteer(volunteer.id)}
                    />
                    <Image
                      src={volunteer.avatar}
                      alt={volunteer.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-200">
                        {volunteer.name}
                      </h4>
                      <p className="text-sm text-gray-400">{volunteer.email}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(volunteer.status)}`}
                    >
                      {volunteer.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Year:</span>{" "}
                      {volunteer.year}
                    </div>
                    <div>
                      <span className="text-gray-500">Branch:</span>{" "}
                      {volunteer.branch}
                    </div>
                    <div>
                      <span className="text-gray-500">Events:</span>{" "}
                      {volunteer.eventsParticipated}
                    </div>
                    <div>
                      <span className="text-gray-500">Hours:</span>{" "}
                      {volunteer.totalHours}
                    </div>
                  </div>
                </div>
              ) : (
                // Desktop Layout
                <div className="grid grid-cols-8 gap-4 items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={selectedVolunteers.includes(volunteer.id)}
                      onChange={() => handleSelectVolunteer(volunteer.id)}
                    />
                  </div>
                  <div className="col-span-2 flex items-center space-x-3">
                    <Image
                      src={volunteer.avatar}
                      alt={volunteer.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-200 text-sm">
                        {volunteer.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {volunteer.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">{volunteer.year}</div>
                  <div className="text-sm text-gray-300">
                    {volunteer.branch}
                  </div>
                  <div className="text-sm text-gray-300">
                    {volunteer.eventsParticipated}
                  </div>
                  <div className="text-sm text-gray-300">
                    {volunteer.totalHours}
                  </div>
                  <div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(volunteer.status)}`}
                    >
                      {volunteer.status}
                    </span>
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
