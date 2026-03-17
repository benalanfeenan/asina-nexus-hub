

# Personalise Participant Table Rows + Add Client Portal Toggle

## What changes

### 1. Database Migration
Add `client_portal_enabled boolean NOT NULL DEFAULT false` column to `participants` table.

### 2. `src/components/participants/ParticipantTable.tsx`
- Add `photo_url`, `email`, `client_portal_enabled` to the interface
- Add an **Avatar** circle (initials fallback) as the first element in the Name cell, matching staff table style with email shown below the name
- Add a **Client Portal** column showing an on/off badge or toggle icon
- Show more alert icons (medications, restrictive practices, high intensity, manual handling) alongside existing ones

### 3. `src/components/participants/AddParticipantDialog.tsx`
- Add `clientPortalEnabled` boolean to form state
- Add a "Client Portal Access" switch in the Basic Info section
- Save/load `client_portal_enabled` field

### 4. `src/pages/ParticipantDetail.tsx`
- Show participant avatar in the header Card (using `photo_url` with initials fallback)
- Display Client Portal status badge in the header

### 5. `src/integrations/supabase/types.ts`
- Add `client_portal_enabled` to participants type (auto-regenerated from migration)

