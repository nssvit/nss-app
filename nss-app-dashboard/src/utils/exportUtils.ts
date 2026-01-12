/**
 * Export utilities for generating CSV and JSON downloads
 */

// Generic types for export data
type ExportableValue = string | number | boolean | null | undefined;
type ExportableRow = Record<string, ExportableValue>;

/**
 * Convert an array of objects to CSV string
 */
export function convertToCSV<T extends ExportableRow>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return "";

  // Create header row
  const headers = columns.map((col) => `"${col.header}"`).join(",");

  // Create data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      })
      .join(",")
  );

  return [headers, ...rows].join("\n");
}

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Export data as CSV file
 */
export function exportToCSV<T extends ExportableRow>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void {
  const csv = convertToCSV(data, columns);
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

/**
 * Export data as JSON file
 */
export function exportToJSON<T>(data: T[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
}

// =====================================
// Pre-configured export functions
// =====================================

export interface EventExport {
  id: string;
  event_name: string;
  event_date: string;
  event_description: string;
  declared_hours: number;
  category_name: string;
  location: string;
  participant_count: number;
  is_active: boolean;
  created_at: string;
}

export const EVENT_COLUMNS: { key: keyof EventExport; header: string }[] = [
  { key: "event_name", header: "Event Name" },
  { key: "event_date", header: "Date" },
  { key: "category_name", header: "Category" },
  { key: "declared_hours", header: "Hours" },
  { key: "location", header: "Location" },
  { key: "participant_count", header: "Participants" },
  { key: "is_active", header: "Active" },
  { key: "event_description", header: "Description" },
  { key: "created_at", header: "Created At" },
];

export function exportEvents(events: EventExport[], filename = "nss_events"): void {
  const formattedData = events.map((event) => ({
    ...event,
    event_date: event.event_date ? new Date(event.event_date).toLocaleDateString() : "",
    created_at: event.created_at ? new Date(event.created_at).toLocaleDateString() : "",
    is_active: event.is_active ? "Yes" : "No",
    location: event.location || "N/A",
  }));
  exportToCSV(formattedData as unknown as EventExport[], EVENT_COLUMNS, filename);
}

export interface VolunteerExport {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string;
  branch: string;
  year: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  total_hours?: number;
  events_participated?: number;
}

export const VOLUNTEER_COLUMNS: { key: keyof VolunteerExport; header: string }[] = [
  { key: "first_name", header: "First Name" },
  { key: "last_name", header: "Last Name" },
  { key: "email", header: "Email" },
  { key: "roll_number", header: "Roll Number" },
  { key: "branch", header: "Branch" },
  { key: "year", header: "Year" },
  { key: "phone_number", header: "Phone" },
  { key: "total_hours", header: "Total Hours" },
  { key: "events_participated", header: "Events Participated" },
  { key: "is_active", header: "Active" },
  { key: "created_at", header: "Joined Date" },
];

export function exportVolunteers(volunteers: VolunteerExport[], filename = "nss_volunteers"): void {
  const formattedData = volunteers.map((vol) => ({
    ...vol,
    created_at: vol.created_at ? new Date(vol.created_at).toLocaleDateString() : "",
    is_active: vol.is_active ? "Yes" : "No",
    phone_number: vol.phone_number || "N/A",
    total_hours: vol.total_hours || 0,
    events_participated: vol.events_participated || 0,
  }));
  exportToCSV(formattedData as unknown as VolunteerExport[], VOLUNTEER_COLUMNS, filename);
}

export interface AttendanceExport {
  volunteer_name: string;
  roll_number: string;
  branch: string;
  year: string;
  email: string;
  participation_status: string;
  hours_attended: number;
  registration_date: string;
  attendance_date: string;
  notes: string;
}

export const ATTENDANCE_COLUMNS: { key: keyof AttendanceExport; header: string }[] = [
  { key: "volunteer_name", header: "Name" },
  { key: "roll_number", header: "Roll Number" },
  { key: "branch", header: "Branch" },
  { key: "year", header: "Year" },
  { key: "email", header: "Email" },
  { key: "participation_status", header: "Status" },
  { key: "hours_attended", header: "Hours" },
  { key: "registration_date", header: "Registration Date" },
  { key: "attendance_date", header: "Attendance Date" },
  { key: "notes", header: "Notes" },
];

export function exportAttendance(
  attendance: AttendanceExport[],
  eventName: string,
  filename?: string
): void {
  const safeEventName = eventName.replace(/[^a-zA-Z0-9]/g, "_");
  const exportFilename = filename || `${safeEventName}_attendance`;

  const formattedData = attendance.map((att) => ({
    ...att,
    registration_date: att.registration_date
      ? new Date(att.registration_date).toLocaleDateString()
      : "",
    attendance_date: att.attendance_date
      ? new Date(att.attendance_date).toLocaleDateString()
      : "",
    notes: att.notes || "",
  }));

  exportToCSV(formattedData as unknown as AttendanceExport[], ATTENDANCE_COLUMNS, exportFilename);
}

export interface HoursReportExport {
  volunteer_name: string;
  roll_number: string;
  branch: string;
  year: string;
  total_hours: number;
  approved_hours: number;
  pending_hours: number;
  events_count: number;
}

export const HOURS_REPORT_COLUMNS: { key: keyof HoursReportExport; header: string }[] = [
  { key: "volunteer_name", header: "Name" },
  { key: "roll_number", header: "Roll Number" },
  { key: "branch", header: "Branch" },
  { key: "year", header: "Year" },
  { key: "total_hours", header: "Total Hours" },
  { key: "approved_hours", header: "Approved Hours" },
  { key: "pending_hours", header: "Pending Hours" },
  { key: "events_count", header: "Events" },
];

export function exportHoursReport(
  data: HoursReportExport[],
  filename = "nss_hours_report"
): void {
  exportToCSV(data, HOURS_REPORT_COLUMNS, filename);
}

// =====================================
// Utility functions for date formatting
// =====================================

export function formatDateForFilename(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export function generateFilename(prefix: string): string {
  return `${prefix}_${formatDateForFilename()}`;
}
