

# Build Next 4 Modules: SIL Houses, Rostering, Incidents, Progress Notes

All stub pages. All database tables exist. No schema changes needed. I'll build them in dependency order.

---

## Module 1: SIL Houses

**`src/pages/SILHouses.tsx`** -- Full list page with search, add/edit dialog, click-through to detail.

**`src/pages/SILHouseDetail.tsx`** -- New route `/sil-houses/:id`:
- Header card: name, address, capacity, active status
- Tabs:
  - **Participants**: list from `sil_house_participants` joined to `participants`, add/remove
  - **Staff**: list from `sil_house_staff` joined to `staff`/`profiles`, assign/unassign
  - **Maintenance**: CRUD on `property_maintenance_log` (description, priority, status, contractor, cost, dates)

**Components**: `SILHouseTable.tsx`, `AddSILHouseDialog.tsx`, `SILHouseParticipantsTab.tsx`, `SILHouseStaffTab.tsx`, `SILHouseMaintenanceTab.tsx`

**Route**: Add `/sil-houses/:id` to `App.tsx`

---

## Module 2: Rostering

**`src/pages/Rostering.tsx`** -- Weekly calendar view:
- House selector dropdown (from `sil_houses`)
- Week navigator (prev/next week, today button)
- Grid: 7 columns (Mon-Sun), rows per shift type (AM/PM/Active Night/Sleepover)
- Each cell shows assigned staff name and shift status badge
- Click cell to create/edit shift via dialog
- Add Shift dialog: date, shift type, staff (select from `staff`), start/end time, status, notes
- Uses `shifts` table

**Components**: `RosterGrid.tsx`, `AddShiftDialog.tsx`, `WeekNavigator.tsx`

---

## Module 3: Incidents

**`src/pages/Incidents.tsx`** -- List and report:
- Table: reference number (auto-generated), title, severity badge, status, date, reportable flag
- Search by reference/title, filter by severity and status
- Add Incident dialog: title, description, severity (low/medium/high/critical), participant (select), SIL house (select), date occurred, immediate actions, is_reportable, category flags (JSON checkboxes)
- Click row to expand/view investigation details (root cause, findings, corrective actions)
- Close incident workflow (admin only)

**Components**: `IncidentTable.tsx`, `AddIncidentDialog.tsx`, `IncidentDetailDialog.tsx`

---

## Module 4: Progress Notes

**`src/pages/ProgressNotes.tsx`** -- List and create:
- Table: participant name, staff name, date, concerns flagged indicator
- Filter by participant, staff, date range
- Add Progress Note dialog: participant (select), content (textarea), goal progress (JSON -- select goals, rate progress), concerns flagged toggle, concern details
- Staff ID auto-set from current user's linked staff record

**Components**: `ProgressNoteTable.tsx`, `AddProgressNoteDialog.tsx`

---

## Technical Approach
- Same patterns as Staff/Participant modules: `@tanstack/react-query`, `react-hook-form` + `zod`
- Role-based permissions: admin/house_manager can create/edit, support_worker can view (and create progress notes/incidents)
- All tables and RLS policies already exist -- no migrations needed

