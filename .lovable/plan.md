

# Interconnect All Staff Tabs Around Compliance

## The Problem
Right now, each staff tab (Compliance, Training, Supervisions, Competencies, Acknowledgements, Documents) uses its own separate database table with no cross-talk. Uploading a document in Compliance does not appear in Documents. Adding a supervision does not update the compliance score. Nothing is connected.

## The Solution: Compliance as the Single Source of Truth

Make the Compliance tab the central data hub. The other tabs become **views into and entry points for** the same underlying data. When something happens in one tab, it reflects everywhere.

### How Each Tab Connects

**Supervisions tab:**
- When a supervision is added, automatically update the `supervision_records` compliance item to "completed" (and update `performance_review` if type is "performance_review")
- Auto-calculate `next_due` as 1 month from the supervision date (pre-fill based on staff `start_date` for the first one)
- Show an overdue banner if no supervision exists in the last 30 days
- Invalidate compliance queries so the score updates immediately

**Competencies tab:**
- When a competency assessment is added (e.g. type=medication, result=competent), automatically update the matching compliance item (`medication_competency`) to "completed" with the date and expiry
- Show competency items pulled from both `staff_competency_assessments` AND compliance records that are competency-type items

**Acknowledgements tab:**
- Map acknowledgement document types to compliance item_keys: `code_of_conduct` -> `code_of_conduct`, `confidentiality_agreement` -> `confidentiality_agreement`, `induction_checklist` -> `induction_checklist`, `whs_policy` -> `whs_induction`
- When an acknowledgement is added, auto-update the matching compliance item to "completed"

**Documents tab:**
- Becomes a unified document register: queries BOTH `staff_documents` AND `staff_compliance_items` (where `document_url` is not null)
- When a document is uploaded in Compliance, it automatically appears in Documents (no separate insert needed — just query both sources)
- When a document is uploaded directly in Documents tab, check if the document_type matches a compliance item_key and offer to link it

**Training tab:**
- When training is added (e.g. "First Aid"), auto-update the matching compliance item (`first_aid`) to "completed" with completion_date and calculated expiry
- Map training names to compliance item_keys: First Aid -> `first_aid`, CPR -> `cpr`, Manual Handling -> `manual_handling`, Fire Safety -> `fire_safety`, Infection Control -> `infection_control`, etc.

### Supervision Scheduling
- Add a `supervision_frequency_months` column to `staff` table (default 1 for monthly)
- On StaffDetail load, calculate next supervision due = last supervision date + frequency (or start_date + frequency if no supervisions yet)
- Show alert banner on the Supervisions tab and on the staff header card when overdue

### Implementation Details

No new database tables needed. Changes are all in the mutation callbacks (write-back logic) and query functions (read-across logic).

**Files changed:**
1. **Migration SQL** — add `supervision_frequency_months` to `staff` table
2. **`StaffSupervisionsTab.tsx`** — on add supervision: upsert `supervision_records` / `performance_review` compliance items; auto-calculate next_due; show overdue banner
3. **`StaffCompetenciesTab.tsx`** — on add competency: upsert matching compliance item (medication_competency, mealtime_competency, high_intensity_competency)
4. **`StaffAcknowledgementsTab.tsx`** — on add acknowledgement: upsert matching compliance item (code_of_conduct, confidentiality_agreement, induction_checklist, whs_induction)
5. **`StaffDocumentsTab.tsx`** — query both `staff_documents` and `staff_compliance_items` with document_url; merge results into unified list
6. **`StaffTrainingTab.tsx`** — on add training: upsert matching compliance item with date and calculated expiry
7. **`StaffComplianceTab.tsx`** — on compliance item save: if item is supervision/competency/acknowledgement type, also upsert into the corresponding tab's table so it appears there too (bi-directional sync)
8. **`StaffDetail.tsx`** — show supervision due/overdue indicator in header

### Mapping Tables (hardcoded in a shared constants file)

```text
ACKNOWLEDGEMENT_TYPE -> COMPLIANCE_KEY
code_of_conduct      -> code_of_conduct
confidentiality      -> confidentiality_agreement
induction_checklist  -> induction_checklist
whs_policy           -> whs_induction

COMPETENCY_TYPE -> COMPLIANCE_KEY
medication      -> medication_competency
mealtime        -> mealtime_competency
high_intensity  -> high_intensity_competency

TRAINING_NAME -> COMPLIANCE_KEY
First Aid     -> first_aid (expiry: 36mo)
CPR           -> cpr (expiry: 12mo)
Manual Handling -> manual_handling (expiry: 12mo)
Fire Safety   -> fire_safety (expiry: 12mo)
Infection Control -> infection_control (expiry: 12mo)
NDIS Orientation -> ndis_orientation
```

These mappings go into `src/lib/compliance-definitions.ts` as exported constants.

