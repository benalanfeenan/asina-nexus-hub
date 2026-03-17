

# Add Document Upload to Recently Added Features

## Summary
Add file upload + view capability to the 5 new features. The `incident_commission_reports` table already has a `document_url` column but currently uses a manual text input. The other 4 tables need the column added.

## Database Migration
Add `document_url text` column to:
- `participant_transitions`
- `internal_audits`
- `safeguarding_concerns`
- `satisfaction_surveys`

## UI Changes (same pattern for all 5)
Each add/edit dialog gets a file `<Input type="file" />` field. On save, upload to Supabase Storage (`documents` bucket) under a relevant path, then store the public URL. Each table row gets an external link icon when a document exists (matching the pattern used in `ParticipantDocumentsTab` and `StaffDocumentsTab`).

### Files to edit:
1. **`src/components/participants/ParticipantTransitionsTab.tsx`** -- add file input, upload logic, link icon in table
2. **`src/components/participants/ParticipantSurveysTab.tsx`** -- add file input, upload logic, link icon in table
3. **`src/components/incidents/IncidentCommissionReports.tsx`** -- replace manual `docUrl` text input with file upload, show link icon
4. **`src/pages/InternalAudits.tsx`** -- add file input, upload logic, link icon in table
5. **`src/pages/Safeguarding.tsx`** -- add file input, upload logic, link icon in table
6. **`src/integrations/supabase/types.ts`** -- add `document_url` to affected table types

### Upload pattern (reused across all 5):
```tsx
const fileRef = useRef<HTMLInputElement>(null);
// On save:
const file = fileRef.current?.files?.[0];
let document_url = null;
if (file) {
  const path = `<entity>/${id}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("documents").upload(path, file);
  if (error) { toast.error(error.message); return; }
  document_url = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
}
```

