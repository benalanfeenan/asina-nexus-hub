

# Add Manual Handling to Participant and Staff Systems

## What's already in place
- **Staff**: Manual Handling Training is already a **mandatory** compliance item for all staff (Induction + annual refresher). No changes needed for staff compliance.
- **Staff Competencies tab**: Already has "Manual Handling" as a competency assessment type.
- **SIL House competency requirements**: The approved (but not yet implemented) plan adds `requires_manual_handling` to house competency flags — that's a separate change.

## Changes needed

### 1. Participant alert flag — `src/lib/participant-compliance-definitions.ts`
- Add `manual_handling: "Manual Handling"` to `PARTICIPANT_NEEDS_FLAG_LABELS`
- Add conditional compliance items in the **Higher Needs** category:
  - **Manual Handling Risk Assessment** — Individual manual handling risk assessment on file (display_order 33)
  - **Manual Handling Plan on File** — Documented manual handling/transfer plan for the participant (display_order 34)

### 2. Participant form — `src/components/participants/AddParticipantDialog.tsx`
- Add `manualHandling` boolean to form state (default `false`)
- Add `manual_handling` to the alerts JSON on save
- Add "Manual Handling" checkbox to the Alerts section
- Load `manual_handling` from alerts when editing

### No database or staff changes needed
Manual Handling is already mandatory for all staff. The participant `alerts` JSON field already supports arbitrary keys, so no migration is required.

