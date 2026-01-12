"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAttendance, ParticipationStatus, EventParticipant } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/useToast";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Skeleton } from "./Skeleton";

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  declared_hours: number;
  location: string | null;
}

interface ParticipantWithSelection extends EventParticipant {
  selected: boolean;
  newStatus?: ParticipationStatus;
  newHours?: number;
  newNotes?: string;
}

const STATUS_OPTIONS: { value: ParticipationStatus; label: string; color: string }[] = [
  { value: "registered", label: "Registered", color: "text-blue-400 bg-blue-900/30" },
  { value: "present", label: "Present", color: "text-green-400 bg-green-900/30" },
  { value: "absent", label: "Absent", color: "text-red-400 bg-red-900/30" },
  { value: "partially_present", label: "Partial", color: "text-yellow-400 bg-yellow-900/30" },
  { value: "excused", label: "Excused", color: "text-gray-400 bg-gray-700/30" },
];

export function AttendanceManager() {
  const layout = useResponsiveLayout();
  const { showToast } = useToast();
  const { getEventParticipants, updateParticipationStatus, bulkMarkAttendance } = useAttendance();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithSelection[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkHours, setBulkHours] = useState<number>(0);
  const [selectAll, setSelectAll] = useState(false);

  // Load events
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from("events")
        .select("id, event_name, event_date, declared_hours, location")
        .order("event_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);

      // Set bulk hours to first event's declared hours if available
      if (data && data.length > 0) {
        setBulkHours(data[0].declared_hours || 0);
      }
    } catch (err: any) {
      console.error("Error loading events:", err);
      showToast("Failed to load events", "error");
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleEventSelect = async (event: Event) => {
    setSelectedEvent(event);
    setBulkHours(event.declared_hours || 0);
    setLoadingParticipants(true);
    setSelectAll(false);

    try {
      const data = await getEventParticipants(event.id);
      setParticipants(
        data.map((p) => ({
          ...p,
          selected: false,
          newStatus: p.participation_status as ParticipationStatus,
          newHours: p.hours_attended,
          newNotes: p.notes || "",
        }))
      );
    } catch (err: any) {
      console.error("Error loading participants:", err);
      showToast("Failed to load participants", "error");
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setParticipants((prev) =>
      prev.map((p) => ({ ...p, selected: checked }))
    );
  };

  const handleSelectParticipant = (participantId: string, checked: boolean) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.participant_id === participantId ? { ...p, selected: checked } : p
      )
    );
  };

  const handleStatusChange = (participantId: string, status: ParticipationStatus) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.participant_id === participantId ? { ...p, newStatus: status } : p
      )
    );
  };

  const handleHoursChange = (participantId: string, hours: number) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.participant_id === participantId ? { ...p, newHours: hours } : p
      )
    );
  };

  const handleNotesChange = (participantId: string, notes: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.participant_id === participantId ? { ...p, newNotes: notes } : p
      )
    );
  };

  const handleBulkMarkPresent = async () => {
    if (!selectedEvent) return;

    const selectedParticipants = participants.filter((p) => p.selected);
    if (selectedParticipants.length === 0) {
      showToast("No participants selected", "error");
      return;
    }

    setSaving(true);
    try {
      const result = await bulkMarkAttendance({
        eventId: selectedEvent.id,
        volunteerIds: selectedParticipants.map((p) => p.volunteer_id),
        status: "present",
        hoursAttended: bulkHours,
        notes: "Bulk marked as present",
      });

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`Marked ${result.count} participants as present`, "success");
        // Refresh participants
        await handleEventSelect(selectedEvent);
      }
    } catch (err) {
      showToast("Failed to mark attendance", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIndividual = async (participant: ParticipantWithSelection) => {
    setSaving(true);
    try {
      const result = await updateParticipationStatus({
        participantId: participant.participant_id,
        status: participant.newStatus || "registered",
        hoursAttended: participant.newHours,
        notes: participant.newNotes,
      });

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`Updated ${participant.volunteer_name}`, "success");
      }
    } catch (err) {
      showToast("Failed to update attendance", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedEvent) return;

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const participant of participants) {
        // Only save if something changed
        if (
          participant.newStatus !== participant.participation_status ||
          participant.newHours !== participant.hours_attended ||
          participant.newNotes !== participant.notes
        ) {
          const result = await updateParticipationStatus({
            participantId: participant.participant_id,
            status: participant.newStatus || "registered",
            hoursAttended: participant.newHours,
            notes: participant.newNotes,
          });

          if (result.error) {
            errorCount++;
          } else {
            successCount++;
          }
        }
      }

      if (successCount > 0) {
        showToast(`Updated ${successCount} participants`, "success");
      }
      if (errorCount > 0) {
        showToast(`Failed to update ${errorCount} participants`, "error");
      }

      // Refresh participants
      await handleEventSelect(selectedEvent);
    } catch (err) {
      showToast("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  // Filter participants by search term
  const filteredParticipants = participants.filter(
    (p) =>
      p.volunteer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = participants.filter((p) => p.selected).length;

  return (
    <div className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg ${layout.getContentPadding()}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Attendance Manager</h1>
        <p className="text-gray-400">Mark attendance for events</p>
      </div>

      {/* Event Selection */}
      <div className="card-glass rounded-xl p-4 mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Event</label>
        {loadingEvents ? (
          <Skeleton className="h-10 w-full rounded-lg" />
        ) : (
          <select
            className="input-dark w-full rounded-lg py-2 px-3"
            value={selectedEvent?.id || ""}
            onChange={(e) => {
              const event = events.find((ev) => ev.id === e.target.value);
              if (event) handleEventSelect(event);
            }}
          >
            <option value="">-- Select an event --</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.event_name} - {new Date(event.event_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selected Event Info */}
      {selectedEvent && (
        <div className="card-glass rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">{selectedEvent.event_name}</h2>
              <p className="text-sm text-gray-400">
                {new Date(selectedEvent.event_date).toLocaleDateString()} | {selectedEvent.location || "No location"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{participants.length}</div>
                <div className="text-xs text-gray-500">Registered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {participants.filter((p) => ["present", "partially_present"].includes(p.participation_status)).length}
                </div>
                <div className="text-xs text-gray-500">Present</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedEvent && participants.length > 0 && (
        <div className="card-glass rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-300">Select All ({selectedCount} selected)</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Hours:</label>
              <input
                type="number"
                min="0"
                max="24"
                value={bulkHours}
                onChange={(e) => setBulkHours(parseInt(e.target.value) || 0)}
                className="input-dark w-16 rounded px-2 py-1 text-sm"
              />
            </div>

            <button
              onClick={handleBulkMarkPresent}
              disabled={saving || selectedCount === 0}
              className="button-glass-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <i className="fas fa-check mr-2"></i>
              Mark {selectedCount} as Present
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="button-glass-secondary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <i className="fas fa-save mr-2"></i>
              Save All Changes
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {selectedEvent && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or roll number..."
              className="input-dark w-full rounded-lg py-2 px-3 pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
          </div>
        </div>
      )}

      {/* Participants List */}
      {loadingParticipants ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : selectedEvent && filteredParticipants.length === 0 ? (
        <div className="card-glass rounded-xl p-8 text-center text-gray-400">
          <i className="fas fa-users-slash text-4xl mb-3"></i>
          <p>No participants found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredParticipants.map((participant) => (
            <div
              key={participant.participant_id}
              className={`card-glass rounded-xl p-4 transition-colors ${
                participant.selected ? "ring-2 ring-indigo-500/50" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={participant.selected}
                  onChange={(e) => handleSelectParticipant(participant.participant_id, e.target.checked)}
                  className="w-4 h-4 rounded mt-1"
                />

                {/* Participant Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-200">{participant.volunteer_name}</span>
                    <span className="text-xs text-gray-500">{participant.roll_number}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {participant.branch} | {participant.year}
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="flex flex-col gap-2">
                  <select
                    value={participant.newStatus}
                    onChange={(e) => handleStatusChange(participant.participant_id, e.target.value as ParticipationStatus)}
                    className="input-dark rounded px-2 py-1 text-sm"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Hours Input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={participant.newHours || 0}
                      onChange={(e) => handleHoursChange(participant.participant_id, parseInt(e.target.value) || 0)}
                      className="input-dark w-16 rounded px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-gray-500">hrs</span>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={() => handleSaveIndividual(participant)}
                  disabled={saving}
                  className="text-indigo-400 hover:text-indigo-300 p-2"
                  title="Save"
                >
                  <i className="fas fa-save"></i>
                </button>
              </div>

              {/* Notes */}
              <div className="mt-2 ml-8">
                <input
                  type="text"
                  placeholder="Add notes..."
                  value={participant.newNotes || ""}
                  onChange={(e) => handleNotesChange(participant.participant_id, e.target.value)}
                  className="input-dark w-full rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
