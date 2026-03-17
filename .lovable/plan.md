

# Remove Delete Action from Staff Table — Archive Only

Staff records must be retained for compliance (7-year retention). Remove the delete capability entirely, keeping only archive/reactivate.

## Changes

### `src/components/staff/StaffTable.tsx`
- Remove the `onDelete` prop
- Remove the "Delete" `DropdownMenuItem` and its separator

### `src/pages/Staff.tsx`
- Remove `deleteId` state, `handleDelete` callback, and the `ConfirmDialog`
- Stop passing `onDelete` to `StaffTable`

No database changes needed — just UI removal.

