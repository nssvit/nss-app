"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "./Toast";

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_status: string;
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  profile_pic: string | null;
}

interface AttendanceRecord {
  volunteer_id: string;
  participation_status: 'registered' | 'present' | 'absent' | 'partially_present' | 'excused';
  hours_attended: number;
  notes: string;
}

export function AttendanceManager() {
  const { currentUser, hasAnyRole } = useAuth();
  const { toasts, removeToast, success, error: showError, info } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user has permission to mark attendance
  const canMarkAttendance = hasAnyRole(['admin', 'program_officer', 'heads']);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      // ⚡ Load volunteers and attendance in parallel for faster loading
      Promise.all([loadVolunteers(), loadExistingAttendance()]);
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date, event_status')
        .eq('is_active', true)
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      showError(err.message || 'Failed to load events');
    }
  };

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, first_name, last_name, roll_number, profile_pic')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setVolunteers(data || []);
    } catch (err: any) {
      showError(err.message || 'Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('event_participation')
        .select('volunteer_id, participation_status, hours_attended, notes')
        .eq('event_id', selectedEvent);

      if (error) throw error;

      const attendanceMap = new Map<string, AttendanceRecord>();
      (data || []).forEach((record) => {
        attendanceMap.set(record.volunteer_id, record as AttendanceRecord);
      });
      setAttendance(attendanceMap);
    } catch (err: any) {
      showError(err.message || 'Failed to load attendance');
    }
  };

  const toggleAttendance = (volunteerId: string) => {
    const current = attendance.get(volunteerId);
    const newAttendance = new Map(attendance);

    if (current) {
      // Cycle: present → absent → excused → remove
      if (current.participation_status === 'present') {
        newAttendance.set(volunteerId, { ...current, participation_status: 'absent', hours_attended: 0 });
      } else if (current.participation_status === 'absent') {
        newAttendance.set(volunteerId, { ...current, participation_status: 'excused', hours_attended: 0 });
      } else {
        newAttendance.delete(volunteerId);
      }
    } else {
      // Mark as present
      newAttendance.set(volunteerId, {
        volunteer_id: volunteerId,
        participation_status: 'present',
        hours_attended: 4, // Default hours
        notes: ''
      });
    }

    setAttendance(newAttendance);
  };

  const updateHours = (volunteerId: string, hours: number) => {
    const current = attendance.get(volunteerId);
    if (current) {
      const newAttendance = new Map(attendance);
      newAttendance.set(volunteerId, { ...current, hours_attended: hours });
      setAttendance(newAttendance);
    }
  };

  const saveAttendance = async () => {
    if (!selectedEvent || !currentUser) {
      showError('Please select an event first');
      return;
    }

    if (!canMarkAttendance) {
      showError('You do not have permission to mark attendance');
      return;
    }

    try {
      info('Saving attendance...');
      setLoading(true);

      const recorderId = currentUser.volunteer_id || currentUser.id;

      // Prepare records for upsert
      const records = Array.from(attendance.entries()).map(([volunteerId, record]) => ({
        event_id: selectedEvent,
        volunteer_id: volunteerId,
        participation_status: record.participation_status,
        hours_attended: record.hours_attended,
        attendance_date: new Date().toISOString(),
        notes: record.notes,
        recorded_by_volunteer_id: recorderId,
        declared_hours: record.hours_attended,
        approved_hours: record.participation_status === 'present' ? record.hours_attended : null
      }));

      const { error } = await supabase
        .from('event_participation')
        .upsert(records, {
          onConflict: 'event_id,volunteer_id'
        });

      if (error) throw error;

      success(`Attendance saved for ${records.length} volunteers`);
    } catch (err: any) {
      showError(err.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const filteredVolunteers = volunteers.filter((v) =>
    `${v.first_name} ${v.last_name} ${v.roll_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (!canMarkAttendance) {
    return (
      <div className="card-glass rounded-xl p-8 text-center">
        <i className="fas fa-lock text-4xl text-red-400 mb-4"></i>
        <h3 className="text-heading-3 mb-2">Access Denied</h3>
        <p className="text-body">
          You do not have permission to mark attendance.
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="space-y-6">
        {/* Event Selection */}
        <div className="card-glass rounded-xl p-6">
          <h2 className="text-heading-2 mb-4">Mark Attendance</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Event</label>
            <select
              className="input-dark w-full rounded-lg"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">Choose an event...</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {new Date(event.event_date).toLocaleDateString()} ({event.event_status})
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search volunteers..."
                  className="input-dark w-full rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-green-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {Array.from(attendance.values()).filter(a => a.participation_status === 'present').length}
                  </div>
                  <div className="text-sm text-gray-400">Present</div>
                </div>
                <div className="text-center p-3 bg-red-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">
                    {Array.from(attendance.values()).filter(a => a.participation_status === 'absent').length}
                  </div>
                  <div className="text-sm text-gray-400">Absent</div>
                </div>
                <div className="text-center p-3 bg-yellow-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">
                    {Array.from(attendance.values()).filter(a => a.participation_status === 'excused').length}
                  </div>
                  <div className="text-sm text-gray-400">Excused</div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveAttendance}
                disabled={loading || attendance.size === 0}
                className="btn btn-md btn-primary w-full"
              >
                <i className="fas fa-save mr-2"></i>
                Save Attendance ({attendance.size} volunteers)
              </button>
            </>
          )}
        </div>

        {/* Volunteer List */}
        {selectedEvent && (
          <div className="card-glass rounded-xl p-6">
            <h3 className="text-heading-3 mb-4">Volunteers</h3>

            {loading ? (
              <div className="text-center py-8">Loading volunteers...</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredVolunteers.map((volunteer) => {
                  const record = attendance.get(volunteer.id);
                  const status = record?.participation_status;

                  return (
                    <div
                      key={volunteer.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        status === 'present' ? 'bg-green-500/10 border border-green-500/30' :
                        status === 'absent' ? 'bg-red-500/10 border border-red-500/30' :
                        status === 'excused' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                        'bg-gray-800/30 hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <img
                          src={volunteer.profile_pic || 'https://i.imgur.com/gVo4gxC.png'}
                          alt={volunteer.first_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium">
                            {volunteer.first_name} {volunteer.last_name}
                          </div>
                          <div className="text-sm text-gray-400">{volunteer.roll_number}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Hours Input */}
                        {status === 'present' && (
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={record?.hours_attended || 0}
                            onChange={(e) => updateHours(volunteer.id, parseInt(e.target.value) || 0)}
                            className="input-dark w-20 text-center rounded"
                            placeholder="Hours"
                          />
                        )}

                        {/* Status Button */}
                        <button
                          onClick={() => toggleAttendance(volunteer.id)}
                          className={`btn btn-sm ${
                            status === 'present' ? 'btn-success' :
                            status === 'absent' ? 'btn-danger' :
                            status === 'excused' ? 'btn-warning' :
                            'btn-secondary'
                          }`}
                        >
                          {status === 'present' ? 'Present' :
                           status === 'absent' ? 'Absent' :
                           status === 'excused' ? 'Excused' :
                           'Mark'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
