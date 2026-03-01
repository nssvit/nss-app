import 'package:flutter/material.dart';

// ─── Roles ───────────────────────────────────────────────────────────────────

class Roles {
  static const admin = 'admin';
  static const head = 'head';
  static const volunteer = 'volunteer';

  static const all = [admin, head, volunteer];
  static const management = [admin, head];
}

const roleHierarchy = <String, int>{
  Roles.admin: 100,
  Roles.head: 50,
  Roles.volunteer: 10,
};

const roleDisplayNames = <String, String>{
  Roles.admin: 'Administrator',
  Roles.head: 'NSS Head',
  Roles.volunteer: 'Volunteer',
};

const roleColors = <String, Color>{
  Roles.admin: Color(0xFFEF4444),
  Roles.head: Color(0xFFA855F7),
  Roles.volunteer: Color(0xFF22C55E),
};

// ─── Event Status ────────────────────────────────────────────────────────────

class EventStatusValues {
  static const planned = 'planned';
  static const registrationOpen = 'registration_open';
  static const registrationClosed = 'registration_closed';
  static const ongoing = 'ongoing';
  static const completed = 'completed';
  static const cancelled = 'cancelled';

  static const all = [
    planned,
    registrationOpen,
    registrationClosed,
    ongoing,
    completed,
    cancelled,
  ];
}

const eventStatusDisplay = <String, String>{
  EventStatusValues.planned: 'Planned',
  EventStatusValues.registrationOpen: 'Registration Open',
  EventStatusValues.registrationClosed: 'Registration Closed',
  EventStatusValues.ongoing: 'Ongoing',
  EventStatusValues.completed: 'Completed',
  EventStatusValues.cancelled: 'Cancelled',
};

const statusTransitions = <String, List<String>>{
  'planned': ['registration_open', 'ongoing', 'cancelled'],
  'registration_open': ['registration_closed', 'ongoing', 'cancelled'],
  'registration_closed': ['ongoing', 'cancelled'],
  'ongoing': ['completed', 'cancelled'],
  'completed': ['registration_open'],
  'cancelled': ['planned', 'registration_open'],
};

const eventStatusColors = <String, Color>{
  EventStatusValues.planned: Color(0xFF6B7280),
  EventStatusValues.registrationOpen: Color(0xFF3B82F6),
  EventStatusValues.registrationClosed: Color(0xFFEAB308),
  EventStatusValues.ongoing: Color(0xFF22C55E),
  EventStatusValues.completed: Color(0xFFA855F7),
  EventStatusValues.cancelled: Color(0xFFEF4444),
};

// ─── Approval Status ─────────────────────────────────────────────────────────

class ApprovalStatusValues {
  static const pending = 'pending';
  static const approved = 'approved';
  static const rejected = 'rejected';

  static const all = [pending, approved, rejected];
}

const approvalStatusDisplay = <String, String>{
  ApprovalStatusValues.pending: 'Pending',
  ApprovalStatusValues.approved: 'Approved',
  ApprovalStatusValues.rejected: 'Rejected',
};

const approvalStatusColors = <String, Color>{
  ApprovalStatusValues.pending: Color(0xFFEAB308),
  ApprovalStatusValues.approved: Color(0xFF22C55E),
  ApprovalStatusValues.rejected: Color(0xFFEF4444),
};

// ─── Participation Status ────────────────────────────────────────────────────

class ParticipationStatusValues {
  static const registered = 'registered';
  static const present = 'present';
  static const partiallyPresent = 'partially_present';
  static const absent = 'absent';
  static const excused = 'excused';

  static const all = [registered, present, partiallyPresent, absent, excused];
}

const participationStatusDisplay = <String, String>{
  ParticipationStatusValues.registered: 'Registered',
  ParticipationStatusValues.present: 'Present',
  ParticipationStatusValues.partiallyPresent: 'Partially Present',
  ParticipationStatusValues.absent: 'Absent',
  ParticipationStatusValues.excused: 'Excused',
};

const participationStatusColors = <String, Color>{
  ParticipationStatusValues.registered: Color(0xFF3B82F6),
  ParticipationStatusValues.present: Color(0xFF22C55E),
  ParticipationStatusValues.partiallyPresent: Color(0xFFEAB308),
  ParticipationStatusValues.absent: Color(0xFFEF4444),
  ParticipationStatusValues.excused: Color(0xFF6B7280),
};

// ─── Branches ────────────────────────────────────────────────────────────────

const branches = ['EXCS', 'CMPN', 'IT', 'BIO-MED', 'EXTC'];

const branchDisplayNames = <String, String>{
  'EXCS': 'Electronics & Computer Science',
  'CMPN': 'Computer Engineering',
  'IT': 'Information Technology',
  'BIO-MED': 'Biomedical Engineering',
  'EXTC': 'Electronics & Telecommunication',
};

// ─── Years ───────────────────────────────────────────────────────────────────

const years = ['FE', 'SE', 'TE'];

const yearDisplayNames = <String, String>{
  'FE': 'First Year (FE)',
  'SE': 'Second Year (SE)',
  'TE': 'Third Year (TE)',
};
