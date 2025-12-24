# Changelog

## v0.1.0 (2025-12-24)

### Features
- Slot availability is now computed on-the-fly from saved Settings (working hours, working days, blocked slots).
- Clear separation of states:
  - Blocked: from Settings, non-interactive in UI.
  - Unavailable: one-off per date/time, admin-toggleable.
  - Booked: overlay from Appointments.
- Date-aware logic prevents row-wide toggles; clicking affects only the specific cell.
- Compact week grid layout that fits the viewport (single scrollbar).

### Settings
- `AdminSettings` page with:
  - Working hours (start/end hour)
  - Working days (start/end day)
  - Recurring blocked slots (e.g., lunch)
- Save button persists settings to Firestore.

### Data Model
- Removed reliance on `time_slots` collection (no pre-generated slots).
- `Settings` updated to include:
  - `blockedSlots` (recurring, optional `date` supported for future use)
  - `oneOffUnavailableSlots` for per-date/time admin toggles

### UI/UX
- `AdminSlots` renders week from settings; blocked slots show as gray/locked, booked slots as green/calendar.
- Available slots show green check; unavailable toggles show red X and can be toggled.
- Navigation and layout streamlined.

### Technical
- Refactor `WeekGrid` to generate 30min slots from `workingHours` and filter by `workingDays`.
- Updated types and persistence in `firebaseApi.ts`.
- Removed the redundant “Generate Week Slots” button.

---

This release tags the initial stable admin scheduling experience with settings-driven availability.
