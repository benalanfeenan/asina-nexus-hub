

# Add Bulk Upload to Documents Page

## What it does
Adds a "Bulk Upload" button next to the existing "Add Document" button. Admin selects multiple files, they get uploaded to Supabase Storage, and a document record is created for each. A shared category, requires-acknowledgement flag, and optional review date can be set for the whole batch.

## Changes

### `src/pages/Documents.tsx`
- Add a "Bulk Upload" dialog with:
  - Multi-file `<input type="file" multiple />` with drag-and-drop styling
  - Shared **Category** selector (applied to all files)
  - Shared **Requires Acknowledgement** checkbox
  - Optional shared **Review Date**
- On submit: loop through selected files, upload each to `documents` storage bucket under `bulk/{timestamp}_{filename}`, get the public URL, then insert a row into the `documents` table (title derived from filename minus extension).
- Show a progress indicator (e.g. "Uploading 3 of 7…") and a toast summary on completion.
- Only visible to admin users (same as "Add Document").

### No database or migration changes needed
The existing `documents` table and `documents` storage bucket already support everything required.

