"use client";

/**
 * EventModal Component
 * Uses Server Actions via useVolunteers hook (full Drizzle consistency)
 */

import { useState, useEffect } from "react";
import { useVolunteers } from "@/hooks/useVolunteers";

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  email: string;
}

interface EventFormData {
  eventName: string;
  eventDate: string;
  declaredHours: string;
  eventCategory: string;
  academicSession: string;
  eventLocation: string;
  eventDescription: string;
  minParticipants?: string;
  maxParticipants?: string;
  registrationDeadline?: string;
  selectedVolunteers?: string[];
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: EventFormData) => void;
  title?: string;
  initialData?: EventFormData;
  categories?: string[];
}

export function EventModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Create New Event",
  initialData,
  categories = [],
}: EventModalProps) {
  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    declaredHours: "",
    eventCategory: "",
    academicSession: "",
    eventLocation: "",
    eventDescription: "",
    minParticipants: "",
    maxParticipants: "",
    registrationDeadline: "",
    selectedVolunteers: [] as string[],
  });

  // Use hook for volunteers data (Server Actions -> Drizzle)
  const { volunteers: rawVolunteers, loading: loadingVolunteers } = useVolunteers();
  const [searchTerm, setSearchTerm] = useState("");
  const [showVolunteerSection, setShowVolunteerSection] = useState(false);

  // Transform volunteers to expected format
  const volunteers: Volunteer[] = (rawVolunteers || []).map((v: any) => ({
    id: v.id || v.volunteer_id,
    first_name: v.first_name || v.firstName || '',
    last_name: v.last_name || v.lastName || '',
    roll_number: v.roll_number || v.rollNumber || '',
    email: v.email || '',
  }));

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        eventName: "",
        eventDate: "",
        declaredHours: "",
        eventCategory: "",
        academicSession: "",
        eventLocation: "",
        eventDescription: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('EventModal: Form submitted with data:', formData);
    onSubmit(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleVolunteerSelection = (volunteerId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedVolunteers: prev.selectedVolunteers?.includes(volunteerId)
        ? prev.selectedVolunteers.filter(id => id !== volunteerId)
        : [...(prev.selectedVolunteers || []), volunteerId]
    }));
  };

  const selectAllVolunteers = () => {
    const filtered = filteredVolunteers.map(v => v.id);
    setFormData(prev => ({
      ...prev,
      selectedVolunteers: filtered
    }));
  };

  const deselectAllVolunteers = () => {
    setFormData(prev => ({
      ...prev,
      selectedVolunteers: []
    }));
  };

  const filteredVolunteers = volunteers.filter(v =>
    `${v.first_name} ${v.last_name} ${v.roll_number} ${v.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-6 md:p-5 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 md:mb-4">
          <h2 className="text-xl md:text-lg font-semibold text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="pwa-button text-gray-500 hover:text-white text-3xl md:text-2xl leading-none p-2 md:p-1 transition-colors focus-visible rounded"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-4">
          <div>
            <label
              htmlFor="eventName"
              className="block text-base md:text-sm font-medium text-gray-300 mb-3 md:mb-2"
            >
              Event Name
            </label>
            <input
              type="text"
              id="eventName"
              name="eventName"
              required
              className="input-dark w-full text-base md:text-sm rounded-lg px-4 py-4 md:py-3 focus:outline-none focus-visible"
              placeholder="e.g., Tree Plantation Drive"
              value={formData.eventName}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4">
            <div>
              <label
                htmlFor="eventDate"
                className="block text-base md:text-sm font-medium text-gray-300 mb-3 md:mb-2"
              >
                Event Date
              </label>
              <input
                type="date"
                id="eventDate"
                name="eventDate"
                required
                className="input-dark w-full text-base md:text-sm rounded-lg px-4 py-4 md:py-3 focus:outline-none focus-visible"
                value={formData.eventDate}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label
                htmlFor="declaredHours"
                className="block text-base md:text-sm font-medium text-gray-300 mb-3 md:mb-2"
              >
                Declared Hours
              </label>
              <input
                type="number"
                id="declaredHours"
                name="declaredHours"
                required
                min="1"
                className="input-dark w-full text-base md:text-sm rounded-lg px-4 py-4 md:py-3 focus:outline-none focus-visible"
                placeholder="e.g., 4"
                value={formData.declaredHours}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4">
            <div>
              <label
                htmlFor="eventCategory"
                className="block text-base md:text-sm font-medium text-gray-300 mb-3 md:mb-2"
              >
                Category
              </label>
              <select
                id="eventCategory"
                name="eventCategory"
                required
                className="input-dark w-full text-base md:text-sm rounded-lg px-4 py-4 md:py-3 focus:outline-none focus-visible"
                value={formData.eventCategory}
                onChange={handleInputChange}
              >
                <option value="">Select Category...</option>
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <option key={`modal-cat-${index}`} value={category}>
                      {category}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Area Based - 1">Area Based - 1</option>
                    <option value="College Event">College Event</option>
                    <option value="Camp">Camp</option>
                    <option value="Workshop">Workshop</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label
                htmlFor="academicSession"
                className="block text-base md:text-sm font-medium text-gray-300 mb-3 md:mb-2"
              >
                Academic Session
              </label>
              <input
                type="text"
                id="academicSession"
                name="academicSession"
                required
                className="input-dark w-full text-base md:text-sm rounded-lg px-4 py-4 md:py-3 focus:outline-none focus-visible"
                placeholder="e.g., 2024-2025"
                value={formData.academicSession}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="eventLocation"
              className="block text-base md:text-sm font-medium text-gray-300 mb-3 md:mb-2"
            >
              Location (Optional)
            </label>
            <input
              type="text"
              id="eventLocation"
              name="eventLocation"
              className="input-dark w-full text-base md:text-sm rounded-lg px-4 py-4 md:py-3 focus:outline-none focus-visible"
              placeholder="e.g., Juhu Beach, Mumbai"
              value={formData.eventLocation}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label
              htmlFor="eventDescription"
              className="block text-base md:text-sm font-medium text-gray-300 mb-3 md:mb-2"
            >
              Description
            </label>
            <textarea
              id="eventDescription"
              name="eventDescription"
              rows={5}
              className="input-dark w-full text-base md:text-sm rounded-lg px-4 py-4 md:py-3 focus:outline-none focus-visible resize-none mobile-scroll"
              placeholder="Provide a detailed description of the event..."
              value={formData.eventDescription}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Volunteer Selection Section */}
          <div className="border-t border-gray-700/30 pt-6 md:pt-4">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-base md:text-sm font-medium text-gray-300">
                Mark Attendance ({formData.selectedVolunteers?.length || 0} selected)
              </label>
              <button
                type="button"
                onClick={() => setShowVolunteerSection(!showVolunteerSection)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {showVolunteerSection ? 'Hide' : 'Show'} Volunteers
              </button>
            </div>

            {showVolunteerSection && (
              <div className="space-y-3">
                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Search volunteers..."
                    className="input-dark flex-1 text-sm rounded-lg px-3 py-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllVolunteers}
                      className="btn btn-sm btn-secondary whitespace-nowrap"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllVolunteers}
                      className="btn btn-sm btn-secondary whitespace-nowrap"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Volunteers List */}
                <div className="max-h-64 overflow-y-auto border border-gray-700/30 rounded-lg p-3 space-y-2">
                  {loadingVolunteers ? (
                    <p className="text-sm text-gray-400 text-center py-4">Loading volunteers...</p>
                  ) : filteredVolunteers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No volunteers found</p>
                  ) : (
                    filteredVolunteers.map((volunteer, index) => (
                      <label
                        key={`vol-${volunteer.id || index}`}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-800/30 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedVolunteers?.includes(volunteer.id) || false}
                          onChange={() => toggleVolunteerSelection(volunteer.id)}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {volunteer.first_name} {volunteer.last_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {volunteer.roll_number} • {volunteer.email}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 md:pt-4 safe-area-bottom">
            <button
              type="button"
              onClick={onClose}
              className="pwa-button button-glass-secondary hover-lift px-6 py-4 md:py-3 text-base md:text-sm font-medium rounded-lg focus-visible"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pwa-button button-glass-primary hover-lift px-6 py-4 md:py-3 text-base md:text-sm font-medium rounded-lg focus-visible"
            >
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
