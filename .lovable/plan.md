

# Scheduler Revamp

## Overview
Major overhaul of the scheduler page adding: week + day views, participant-centric view toggle, weekly summary stats, staff search/filter, shift copy/duplicate, and drag-and-drop reordering.

## Changes

### 1. Weekly Summary Stats Bar
Add a row of stat cards above the grid showing:
- **Total Shifts** (count)
- **Total Hours** (sum)
- **Estimated Cost** (sum of line item costs)
- **Draft / Published / Confirmed** counts as small badges

### 2. View Mode Toggle (Week / Day)
- Add a toggle group (Week | Day) in the toolbar
- **Week view**: Current grid (improved)
- **Day view**: Single-day detailed view showing all staff rows with time blocks, more room for shift details, and a timeline-style layout (6am-10pm vertical axis, staff as columns)

### 3. Staff View / Participant View Toggle
- Add a toggle: "By Staff" (default, current) | "By Participant"
- **Participant view**: Rows become participants instead of staff. Each cell shows which staff member is assigned. Useful for checking participant coverage
- Reuses the same grid layout, just pivots the row axis

### 4. Staff Search/Filter
- Add a search input in the toolbar to filter visible staff rows by name
- Instant client-side filtering on the `staff` array

### 5. Copy/Duplicate Shifts
- Add a "Duplicate" button inside the edit shift dialog
- Creates a copy of the shift with a new date picker (defaults to next day)
- Also add "Duplicate to Week" option that copies the shift to the same day across Mon-Sun (or selected days via checkboxes)

### 6. Drag & Drop Shifts
- Use `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd) for drag-and-drop
- Each shift card becomes draggable; each day cell becomes a droppable
- On drop, update the shift's `date` and optionally `staff_id` (if dropped on a different staff row)
- Visual drag preview showing the shift card

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/pages/Scheduler.tsx` | Major rewrite: add stats bar, view toggles, staff filter, participant view, drag-drop containers |
| `src/components/scheduler/AddSchedulerShiftDialog.tsx` | Add duplicate shift functionality (duplicate button + date picker for target) |
| `src/components/scheduler/SchedulerStatsBar.tsx` | New component for summary stats cards |
| `src/components/scheduler/SchedulerDayView.tsx` | New component for single-day detailed view |
| `src/components/scheduler/ShiftCard.tsx` | Extract shift card into its own component (used in both views, makes drag-drop cleaner) |
| `package.json` | Add `@hello-pangea/dnd` dependency |

### Technical Notes
- Drag-and-drop updates the shift via `supabase.from("scheduler_shifts").update({ date, staff_id })` on drop
- Participant view queries the same `scheduler_shifts` data, just groups by `participant_id` instead of `staff_id`
- Day view uses the same query but filters to a single date, renders a more detailed timeline
- Stats are computed client-side from the already-fetched shifts data (no extra queries)
- The staff search is a simple `filter()` on the staff array by name match

