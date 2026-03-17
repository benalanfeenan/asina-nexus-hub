

# Fix: Auto-collapse and visual feedback on compliance item save

## Problem
When the user saves a compliance item, the expanded form stays open with no visual confirmation. The user expects:
1. The form to collapse after saving
2. The item row to update its status badge (turn green for "Completed")
3. A clear success indication (toast already fires, but the form staying open undermines it)

## Solution

### 1. Auto-collapse after save
Pass `setExpandedItem(null)` into the `onSave` callback chain. After `upsertItem.mutate` succeeds, collapse the expanded item.

### 2. Add `onSuccess` callback to close the form
Modify the `upsertItem` mutation's `onSuccess` to call `setExpandedItem(null)`, so the form collapses and the row instantly reflects the updated status badge (green "Completed").

### 3. Upload feedback
Add a loading state to the upload button — show "Uploading..." while the file is being uploaded, and a brief success indicator.

## Files Changed
- `src/components/staff/StaffComplianceTab.tsx`:
  - In `upsertItem.onSuccess`: add `setExpandedItem(null)` to auto-collapse
  - In `ComplianceItemForm`: add `isPending` prop to disable Save button and show "Saving..." text
  - Add upload loading state with spinner/text feedback

This is a small, focused fix — the status badge already updates correctly via query invalidation, but the form staying open obscures it.

