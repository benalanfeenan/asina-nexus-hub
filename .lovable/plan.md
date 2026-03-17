

# Link Documents to Staff Acknowledgements

## Current State
- **Documents page** (`/documents`): Admin uploads policies/procedures with category, version, review date, file URL. All staff can view.
- **Staff Acknowledgements tab**: Records acknowledgements against hardcoded types (induction checklist, code of conduct, etc.) — no link to actual uploaded documents.

## Proposed Changes

### 1. Database: `document_acknowledgements` table
New table to track which staff have acknowledged which documents:
```sql
CREATE TABLE public.document_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, staff_id)
);
```
With RLS: authenticated can view, authenticated can insert own, admin can manage all.

### 2. Add `requires_acknowledgement` flag to `documents` table
```sql
ALTER TABLE public.documents ADD COLUMN requires_acknowledgement boolean NOT NULL DEFAULT false;
```
When uploading a policy/procedure, admin ticks "Requires staff acknowledgement". This flags it for tracking.

### 3. Documents page — add acknowledgement tracking
- Add a "Requires Ack" checkbox in the Add Document dialog.
- Show a badge on documents that require acknowledgement.
- Add an expandable row or click-through showing acknowledgement status (who has/hasn't acknowledged) — admin only.

### 4. Documents page — staff acknowledgement action
- For non-admin staff viewing documents that require acknowledgement: show an "Acknowledge" button next to unacknowledged documents.
- Clicking it inserts into `document_acknowledgements` and shows a confirmation.

### 5. Staff Detail — update Acknowledgements tab
- In addition to the existing hardcoded acknowledgements, show a section listing documents the staff member has acknowledged (from `document_acknowledgements`), and any outstanding ones requiring acknowledgement.

### 6. Dashboard/alerts integration (lightweight)
- When a new document requiring acknowledgement is uploaded, it naturally appears as unacknowledged for all staff. No separate alert table changes needed — the Documents page itself becomes the source of truth.

## Files Changed
1. **Migration SQL** — create `document_acknowledgements` table, add `requires_acknowledgement` column to `documents`
2. **`src/pages/Documents.tsx`** — add requires_acknowledgement checkbox, acknowledge button for staff, acknowledgement status for admin
3. **`src/components/staff/StaffAcknowledgementsTab.tsx`** — add section showing document-based acknowledgements alongside existing ones
4. **`src/integrations/supabase/types.ts`** — auto-regenerates

