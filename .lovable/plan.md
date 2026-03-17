

# Add All Remaining Features

## What We'll Build

### 1. Organisation Settings (Settings page, Organisation tab)
- Replace the "Coming soon" stub with a form using `organisation_settings` table
- Fields: name, ABN, address, phone, email, bank details (JSON: BSB, account name, account number), logo URL
- Load existing row on mount, upsert on save

### 2. NDIS Price List Page
- New page at `/ndis-price-list`, new route in App.tsx, new sidebar entry under System
- Table with search: item code, description, rate, unit, category, active status
- Add/edit dialog: item_code, description, rate, unit, category, is_active
- Wire into Invoicing: when adding a line item, show a dropdown of NDIS codes that auto-fills description and rate

### 3. MAR (Medication Administration Record) on ParticipantDetail
- New tab "MAR" on ParticipantDetail
- Component `ParticipantMARTab.tsx`: daily grid showing each active medication as a row, time slots as columns (morning/afternoon/evening/night)
- Select a date, see status per medication per slot from `mar_records`
- Click cell to record: administered/missed/refused + notes, sets `administered_by` to current user's staff ID
- Color-coded cells: green=administered, red=missed, amber=refused, grey=pending

### 4. PRN Recording on Medications Tab
- Add "Record PRN" button next to PRN medications in `ParticipantMedicationsTab`
- Dialog: reason (required), outcome, follow_up_required checkbox
- Inserts into `prn_records` with `administered_by` from current user
- Show PRN history list below the medications table

### 5. Shift Handovers
- New component `ShiftHandoverDialog.tsx` accessible from Rostering page
- Add "Handover" button on each shift cell that has a completed/confirmed shift
- Dialog fields: participant updates (textarea), tasks completed, outstanding tasks, concerns (all stored as JSON `content`)
- Links to `shift_id`, `sil_house_id`, `outgoing_staff_id`
- Incoming staff can acknowledge (sets `acknowledged=true`, `acknowledged_at`)

### 6. Sleepover Logs
- New component `SleepoverLogDialog.tsx` on Rostering page
- Add "Log" button on sleepover shift cells
- Dialog: start time, end time, active minutes, reason for waking, participant (select), notes
- Inserts into `sleepover_logs`

### 7. Recurring Roster Patterns + Generate Week
- New component `RosterPatternsDialog.tsx` on Rostering page
- Admin button "Manage Patterns" opens dialog showing patterns for selected house
- Add pattern: day_of_week (0-6), shift_type, staff (select), start/end time
- "Generate Week" button on Rostering: creates shifts from active patterns for the displayed week, skipping dates that already have shifts for that type

### 8. Public Holidays Management
- Add to Settings page as a new tab, or to the NDIS Price List page
- Simple CRUD: name, date, state
- Flag shifts on Rostering that fall on public holidays with a badge

### 9. Edit/Delete for All Record Types
- Add edit and delete buttons to: participants, SIL houses, incidents, complaints, hazards, risks, restrictive practices, QI actions, documents, medications, contacts, goals, routines, support needs
- Delete with confirmation dialog
- Edit reuses existing add dialogs with pre-filled data

### 10. UI Polish
- Loading skeletons on all list pages instead of spinners
- Confirmation dialogs for destructive actions (delete, close incident, reject timesheet)

## Technical Approach
- No database changes needed -- all tables exist
- Same patterns: `@tanstack/react-query`, mutations with cache invalidation
- New route for NDIS Price List in App.tsx + sidebar entry
- New tabs on ParticipantDetail for MAR
- New dialogs on Rostering for handovers, sleepover logs, patterns

## Files to Create
- `src/pages/NDISPriceList.tsx`
- `src/components/participants/ParticipantMARTab.tsx`
- `src/components/rostering/ShiftHandoverDialog.tsx`
- `src/components/rostering/SleepoverLogDialog.tsx`
- `src/components/rostering/RosterPatternsDialog.tsx`
- `src/components/ui/confirm-dialog.tsx`

## Files to Edit
- `src/App.tsx` -- add NDIS Price List route
- `src/components/AppSidebar.tsx` -- add NDIS Price List nav item
- `src/pages/Settings.tsx` -- build Organisation tab form, add Public Holidays tab
- `src/pages/ParticipantDetail.tsx` -- add MAR tab
- `src/components/participants/ParticipantMedicationsTab.tsx` -- add PRN recording
- `src/pages/Rostering.tsx` -- add handover, sleepover log, patterns, generate week buttons
- `src/pages/Invoicing.tsx` -- wire NDIS price list into line item creation
- All list/detail pages -- add edit/delete functionality with confirmation dialogs

