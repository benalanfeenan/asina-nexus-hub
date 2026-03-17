

# Invoice PDF Generation

## Overview
Add a "Download PDF" button to the `InvoiceDetailDialog` that generates a professional invoice PDF client-side using `jspdf` + `jspdf-autotable`. The PDF will pull organisation details from the `organisation_settings` table to populate the header (company name, ABN, address, bank details).

Also fix the bug shown in the screenshot: the `generateInvoiceMutation` passes `group.participant` which comes from the `participants` join on `scheduler_shifts` -- if null, `participant_id` will be null. Add a guard.

## Changes

### 1. Install jspdf + jspdf-autotable
Add `jspdf` and `jspdf-autotable` as dependencies for client-side PDF generation (no backend needed).

### 2. Fix null participant_id bug
**File**: `src/pages/Invoicing.tsx`
- In the `generateInvoiceMutation`, validate that `group.participant?.id` exists before inserting. Throw a user-friendly error if missing.

### 3. Add PDF generation to InvoiceDetailDialog
**File**: `src/components/invoicing/InvoiceDetailDialog.tsx`
- Fetch `organisation_settings` to get company name, ABN, address, bank details
- Add a "Download PDF" button
- Generate a professional PDF with:
  - **Header**: Organisation name, ABN, address, logo placeholder
  - **Invoice details**: Invoice number, issue date, due date, participant name
  - **Line items table**: Description, NDIS Code, Qty, Rate, Amount
  - **Totals**: Subtotal/Total
  - **Footer**: Bank details (BSB, Account Name, Account Number), payment terms
- File named `{invoice_number}.pdf`

### 4. Add PDF button to ReadyToInvoiceCard post-generation (optional enhancement)
After generating an invoice, the card disappears from the list. The PDF is accessible from the NDIS Invoices tab via the detail dialog.

## Files

| File | Change |
|------|--------|
| `package.json` | Add `jspdf`, `jspdf-autotable` |
| `src/components/invoicing/InvoiceDetailDialog.tsx` | Add Download PDF button with full PDF generation logic |
| `src/pages/Invoicing.tsx` | Fix null participant guard in generateInvoiceMutation |

