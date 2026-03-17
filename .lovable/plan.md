

# Shift Info Dialog + Completed Visual Indicator

## Overview
Two changes: (1) Add a blue visual indicator for completed shifts on the ShiftCard, (2) Replace the current "click shift = edit dialog" flow with a read-only info dialog that has "Edit", "Mark Complete", "Duplicate", and "Delete" actions.

## Changes

### 1. ShiftCard visual indicator for completed shifts
**File**: `src/components/scheduler/ShiftCard.tsx`
- When `shift.status === "completed"`, override the color class to a blue theme: `bg-blue-500/20 text-blue-800 border-blue-400`
- Add a small checkmark icon or "Completed" badge (similar to the existing Draft badge)
- Completed shifts get full opacity (not dashed border like drafts)

### 2. New ShiftDetailDialog (read-only info view)
**File**: `src/components/scheduler/ShiftDetailDialog.tsx` (new)
- A Dialog that shows shift details in a read-only format:
  - Staff name, Participant name, Date, Time range, Service type, NDIS line item + estimated cost, SIL House (if any), Status, Notes
- Footer buttons:
  - **Mark as Completed** (primary blue button, only shown if status is not already completed/cancelled) -- updates `status` to `completed` via supabase
  - **Edit** -- closes this dialog and opens the existing AddSchedulerShiftDialog in edit mode
  - **Duplicate** -- closes this dialog and opens AddSchedulerShiftDialog with duplicate flow
  - **Delete** (destructive) -- deletes the shift with confirmation

### 3. Wire up in Scheduler.tsx
**File**: `src/pages/Scheduler.tsx`
- Add state: `detailShift` for the info dialog
- When a shift card is clicked, open ShiftDetailDialog (not the edit dialog)
- ShiftDetailDialog's "Edit" button sets `editShift` and opens AddSchedulerShiftDialog
- Remove edit-related logic from direct shift click

### Files

| File | Action |
|------|--------|
| `src/components/scheduler/ShiftCard.tsx` | Add completed blue styling + badge |
| `src/components/scheduler/ShiftDetailDialog.tsx` | New read-only info dialog with Mark Complete |
| `src/pages/Scheduler.tsx` | Wire click → detail dialog → edit dialog flow |

