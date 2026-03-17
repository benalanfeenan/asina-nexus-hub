

# Updated Participant Compliance — Add Extra Items

The previously approved participant compliance plan will be updated to include three additional items in the appropriate categories:

## Additional Compliance Items

Added to **Pre-Support** category:
- **Schedule of Supports** — Schedule of supports document on file (required before service delivery begins)
- **Consent to Share Information** — Signed consent to share information with relevant parties (support coordinators, allied health, etc.)

Added to **Onboarding** category:
- **Consent for Media** — Signed media consent form (photos, videos for promotional or internal use)

These will be defined in the new `src/lib/participant-compliance-definitions.ts` file alongside the other items from the approved plan (Service Agreement, Consent Form, NDIS Plan Copy, Risk Assessment, etc.), and will follow the same pattern — trackable status, document upload, and optional expiry.

## Files Changed
1. **Migration SQL** — `participant_compliance_items` table (unchanged from approved plan)
2. **`src/lib/participant-compliance-definitions.ts`** — includes the 3 new items in the definitions array
3. **`src/components/participants/ParticipantComplianceTab.tsx`** — new tab component (unchanged from approved plan)
4. **`src/pages/ParticipantDetail.tsx`** — add Compliance tab
5. **`src/components/participants/AddParticipantDialog.tsx`** — add higher-needs flags
6. **`src/integrations/supabase/types.ts`** — auto-regenerates

