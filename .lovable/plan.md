

# Add Medication Compliance Items to Participant Compliance

## Change

### `src/lib/participant-compliance-definitions.ts`

Add a new alert flag `medications` and corresponding conditional compliance items under the **Higher Needs** category:

**New flag** in `PARTICIPANT_NEEDS_FLAG_LABELS`:
- `medications` → "Medications"

**New compliance items** (conditional on `medications` flag):
- **Medication Authority/Prescriptions on File** — Current prescriptions and medication authority on file (display_order: 28)
- **Medication Administration Plan** — Medication administration plan documented with dose, route, frequency (display_order: 29)  
- **Medication Competency Staff Sign-Off** — Staff competency sign-off for administering participant's medications (display_order: 30 — shift existing Ongoing Review items to 35+)
- **Medication Storage Requirements Documented** — Safe storage requirements documented (e.g. fridge, locked cupboard) (display_order: 31)
- **PRN Protocol on File** — PRN (as needed) medication protocol documented with triggers and limits (display_order: 32)

### `src/components/participants/AddParticipantDialog.tsx`

Add a **Medications** checkbox to the Alerts section so the flag can be set during onboarding, triggering the conditional compliance items above.

### No database changes needed
The `alerts` JSON field already supports arbitrary keys, and `participant_compliance_items` uses free-text `item_key`.

