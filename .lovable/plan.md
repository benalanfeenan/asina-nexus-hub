

# Invoicing Page Enhancement

## Overview
Revamp the invoicing page to be more vibrant and user-friendly. Key changes: expandable participant rows showing individual shift line items, summary stats cards, better visual design with color-coded elements, and status action buttons.

## Changes

### 1. Summary Stats Bar (top of page)
Add colorful stat cards above the tabs showing:
- **Total Invoiced** (sum of all paid invoices) -- green card
- **Outstanding** (sum of sent + overdue) -- amber card
- **Draft** (count) -- grey card
- **Ready to Invoice** (count of uninvoiced completed shifts) -- blue card

### 2. Ready to Invoice -- Expandable Participant Cards with Shift Line Items
Replace the current flat participant rows with expandable accordion-style cards:
- **Collapsed**: Participant name, shift count, hours, estimated cost, Generate Invoice button (as now but with avatar initials circle + colored left border)
- **Expanded**: Shows a table of individual shifts as line items: Date, Time, NDIS Code, Description, Hours, Rate, Amount
- This is the "participant name as line items" the user wants -- clicking a participant reveals each shift that will become a line item
- Add a "Select All / Generate All" button at the top to batch-generate invoices for all visible participants

### 3. Visual Enhancements
- Participant cards get a colored left border (teal/brand color)
- Avatar initials circle next to participant name
- Status badges get more vibrant colors with slight gradients
- NDIS Invoices table rows get subtle hover effects and alternating row colors
- Add icon indicators: clock for hours, dollar sign for cost
- Week navigator gets a more polished look with highlighted current week

### 4. NDIS Invoices Tab -- Quick Status Actions
In the invoice detail dialog, add status transition buttons:
- Draft -> "Mark as Sent" button (blue)
- Sent -> "Mark as Paid" button (green)  
- Any -> "Mark as Overdue" / "Cancel" options
- Updates the invoice status via supabase

### 5. Board & Lodging Tab -- Same visual treatment
Match the enhanced styling from the other tabs.

## Files

| File | Change |
|------|--------|
| `src/pages/Invoicing.tsx` | Major rewrite: add stats bar, expandable participant cards with shift details, status action buttons, visual polish |

No database changes needed -- all data is already available from existing queries.

