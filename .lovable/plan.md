

# Add Quick Action Buttons to Staff Table

## Change
Add an "Actions" column after Status with a dropdown menu (MoreHorizontal icon) containing:
- **View** — navigates to staff detail page
- **Edit** — navigates to staff detail page (same as view, since editing happens there)
- **Toggle Active/Inactive** — archives/reactivates staff member directly from the table
- **Delete** — with confirmation dialog, removes the staff member

The dropdown uses `e.stopPropagation()` to prevent the row click from firing.

## Props
`StaffTable` will accept an optional `canEdit` prop to conditionally show the edit/archive/delete actions. The `onToggleActive` and `onDelete` callbacks will be passed from the parent `Staff.tsx` page, which already has `canEdit` and access to supabase.

## Files Changed
1. **`src/components/staff/StaffTable.tsx`** — Add Actions column with `DropdownMenu`, accept `canEdit`, `onToggleActive`, `onDelete` props
2. **`src/pages/Staff.tsx`** — Pass callbacks for toggle-active (supabase update `is_active`) and delete (supabase delete) with query invalidation and toast feedback

