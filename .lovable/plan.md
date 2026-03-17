

# Make Line Item Required + Auto-Generate Invoices from Completed Shifts

## 1. Make NDIS Line Item required on shifts

**File**: `src/components/scheduler/AddSchedulerShiftDialog.tsx`
- Change label from "NDIS Line Item (optional)" to "NDIS Line Item *"
- Remove the "None" option from the select
- Add validation in `handleSave`: require `form.ndis_line_item_id` alongside staff/date/times
- Also make Participant required (needed to link shifts to invoices) -- change label and add validation

## 2. Add `invoiced` flag to scheduler_shifts

**Migration**: Add `invoice_id` column (nullable uuid, FK to `invoices.id`) to `scheduler_shifts`. This tracks whether a completed shift has been invoiced already, preventing duplicates.

**Types**: Update `src/integrations/supabase/types.ts` to include `invoice_id`.

## 3. New "Ready to Invoice" tab on Invoicing page

**File**: `src/pages/Invoicing.tsx`

Add a third tab: **"Ready to Invoice"** between NDIS Invoices and Board & Lodging.

This tab:
- Queries `scheduler_shifts` where `status = 'completed'` AND `invoice_id IS NULL` AND `participant_id IS NOT NULL`
- Groups results by participant, with a date range filter (defaults to current week Mon-Sun)
- Displays a card/row per participant showing: name, number of completed shifts, total estimated cost
- Each row has a **"Generate Invoice"** button

### Generate Invoice flow
When clicked:
1. Creates an `invoices` row with auto-generated invoice number (using `next_reference('invoice')` DB function), participant_id, issue_date = today
2. For each completed shift in that participant's group, inserts an `invoice_line_items` row with: description from NDIS line item, item_code, quantity (hours), rate, amount, service_date = shift date
3. Updates `invoices.total` with the sum
4. Updates each shift's `invoice_id` to the new invoice ID (marks them as invoiced)
5. Refreshes queries, shows success toast

## Files affected

| File | Change |
|------|--------|
| New migration | Add `invoice_id` (uuid, nullable, FK invoices) to `scheduler_shifts` |
| `src/integrations/supabase/types.ts` | Add `invoice_id` field |
| `src/components/scheduler/AddSchedulerShiftDialog.tsx` | Make line item + participant required |
| `src/pages/Invoicing.tsx` | Add "Ready to Invoice" tab with generate functionality |

