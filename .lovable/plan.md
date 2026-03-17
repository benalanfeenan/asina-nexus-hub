

# ShiftCare-style Scheduler

## Problem
Current rostering is SIL-house-only (shifts table requires `sil_house_id`). You need a general-purpose scheduler showing **staff as rows** and **days as columns**, supporting multiple shifts per person per day (e.g. 3x 3hr community shifts), with optional participant and house assignment.

## Approach
New `scheduler_shifts` table (independent from the existing SIL `shifts` table so nothing breaks). New `/scheduler` page with a ShiftCare-inspired layout. Keep existing `/rostering` page as-is for SIL house rosters.

---

## Database

New `scheduler_shifts` table:
- `id` (uuid PK)
- `staff_id` (uuid, NOT NULL, references staff)
- `participant_id` (uuid, nullable, references participants) -- for community/1:1 shifts
- `sil_house_id` (uuid, nullable, references sil_houses) -- optional, for SIL shifts
- `date` (date, NOT NULL)
- `start_time` (time, NOT NULL)
- `end_time` (time, NOT NULL)
- `service_type` (text) -- e.g. "Personal Care", "Community Access", "SIL", "Respite", "Transport"
- `status` (text, default 'draft') -- draft/published/confirmed/completed/cancelled
- `notes` (text, nullable)
- `created_by` (uuid, nullable)
- `created_at`, `updated_at` (timestamptz)

RLS: authenticated can select/insert; admin/HM can manage all.

---

## UI -- New page: `/scheduler`

### Layout (ShiftCare-style)
- **Toolbar**: Staff filter dropdown, status filter, Today/< >/week nav, "Weekly" label with date range, "+ Add Shift" and "Publish shifts" buttons
- **Grid**: Staff names as **rows** (left column shows avatar initials + name + total hours), **7 day columns** (Mon-Sun with date)
- Each cell can have **multiple shift blocks** stacked vertically -- each block shows time range, service type as coloured tag, participant/house name
- Clicking a shift block opens an edit dialog; clicking empty space opens add dialog prefilled with that staff + date
- Colour-coded by service type (Personal Care = blue, Community Access = green, SIL = purple, Respite = orange, etc.)

### Add/Edit Shift Dialog
- Staff (pre-selected if clicked from row), Date, Start Time, End Time
- Service Type dropdown
- Participant (optional, searchable select)
- SIL House (optional, only if service type is SIL)
- Status, Notes
- Delete button on edit mode

### Sidebar navigation
- Add "Scheduler" under Operations, between "Rostering" and "Timesheets"

---

## Files

| Change | File |
|--------|------|
| Migration | New SQL migration for `scheduler_shifts` |
| New page | `src/pages/Scheduler.tsx` |
| New dialog | `src/components/scheduler/AddSchedulerShiftDialog.tsx` |
| Route | Update `App.tsx` -- add `/scheduler` route |
| Nav | Update `AppSidebar.tsx` -- add Scheduler item |
| Types | `types.ts` auto-updated from migration |

