

# Staff Management Module

## Overview
Build a full Staff Management page with list view, add/edit forms, and a detail view with training records and compliance checks. No database changes needed -- all tables (`staff`, `staff_training`, `staff_compliance`, `profiles`, `user_roles`) already exist.

## What We'll Build

### 1. Staff List Page (`src/pages/Staff.tsx`)
- Header with "Add Staff Member" button (admin/house_manager only)
- Search bar filtering by name, position, or email
- Filter by status (active/inactive) and employment type
- Table showing: name, position, employment type, compliance status summary (green/amber/red indicators), active status
- Click row to open staff detail view
- Compliance status computed from `staff_compliance` expiry dates (green = all current, amber = expiring within 30 days, red = expired)

### 2. Add/Edit Staff Dialog
- Form fields: link to existing user profile (select from profiles), position, employment type (casual/part-time/full-time), start date, notes
- Uses react-hook-form + zod validation
- On save, inserts/updates `staff` table

### 3. Staff Detail Page (`src/pages/StaffDetail.tsx`)
- New route: `/staff/:id`
- Header card with staff name, position, employment type, start date, status
- Tabbed interface:
  - **Overview**: basic info, linked SIL houses
  - **Training**: list of training records from `staff_training`, add training dialog (name, provider, completion date, expiry date, status, certificate URL)
  - **Compliance**: list of compliance checks from `staff_compliance` (NDIS Worker Screening, WWCC, First Aid, CPR), add/edit dialog with check type, issue date, expiry date, reference number, verified flag
  - Visual indicators: green badge for current, amber for expiring within 30 days, red for expired

### 4. Component Files
- `src/components/staff/StaffTable.tsx` -- reusable table component
- `src/components/staff/AddStaffDialog.tsx` -- add/edit form dialog
- `src/components/staff/StaffTrainingTab.tsx` -- training records tab
- `src/components/staff/StaffComplianceTab.tsx` -- compliance checks tab
- `src/components/staff/AddTrainingDialog.tsx` -- training form
- `src/components/staff/AddComplianceDialog.tsx` -- compliance check form

### 5. Route Addition
- Add `/staff/:id` route to `App.tsx` for staff detail page

### Technical Notes
- Uses `@tanstack/react-query` for data fetching/caching
- Staff table joins to `profiles` via `profile_id` for name/email
- Compliance status badges computed client-side from expiry dates
- All mutations invalidate relevant query keys
- Admin and house_manager roles can add/edit; support_worker can only view

