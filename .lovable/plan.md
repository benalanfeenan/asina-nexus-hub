

# Fix Participant Selection + Add NDIS Price Line Item to Scheduler Shifts

## Bug: Participants not loading

The participant query in `AddSchedulerShiftDialog.tsx` filters by `.eq("status", "active")` but the `participants` table uses `is_active` (boolean), not a `status` column. This returns zero results, so the dropdown is empty.

**Fix**: Change the query to `.eq("is_active", true)`.

## Feature: NDIS Price Line Item on Shifts

Add an optional NDIS line item code to each shift, linking it to the `ndis_price_list` table. This will pre-associate billing data with shifts for downstream invoicing.

### Database
- Add `ndis_line_item_id` (uuid, nullable, references `ndis_price_list(id)`) to `scheduler_shifts` via migration.

### UI Changes in AddSchedulerShiftDialog
- Add an "NDIS Line Item" searchable select field (optional) that queries `ndis_price_list` and displays `item_code - description (rate)`.
- Auto-calculate estimated cost from the line item rate and shift duration, shown as a read-only hint below the field.
- Save `ndis_line_item_id` in the shift payload.

### Scheduler Grid
- Show the NDIS item code on shift blocks when assigned (small text below service type).

## Files affected

| Change | File |
|--------|------|
| Migration | New SQL migration adding `ndis_line_item_id` to `scheduler_shifts` |
| Bug fix + new field | `src/components/scheduler/AddSchedulerShiftDialog.tsx` |
| Show line item on grid | `src/pages/Scheduler.tsx` |
| Types | `src/integrations/supabase/types.ts` |

