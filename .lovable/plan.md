

# Expand Participant Details — Matching Staff Pattern

## Overview
Add comprehensive onboarding fields to the participants table and UI, mirroring the staff collapsible-section pattern. Fields cover demographics, cultural/language, medical/health, NDIS plan details, and communication needs.

## Database Migration
Add columns to `participants` table:

**Demographics:**
- `gender` (text), `pronouns` (text), `sexuality` (text)

**Cultural & Language:**
- `is_cald` (boolean, default false), `country_of_birth` (text), `languages_spoken` (text), `interpreter_required` (boolean, default false), `indigenous_status` (text)

**Medical & Health:**
- `diagnosis` (text) — primary diagnosis/disabilities
- `allergies_detail` (text) — specific allergy details
- `dietary_requirements` (text)
- `medical_conditions` (text) — other medical conditions
- `gp_name` (text), `gp_phone` (text), `gp_address` (text)
- `pharmacy_name` (text), `pharmacy_phone` (text)
- `hospital_preference` (text)
- `medicare_number` (text), `ambulance_cover` (boolean, default false)

**NDIS Plan:**
- `ndis_plan_start` (date), `ndis_plan_end` (date)
- `plan_manager` (text), `plan_manager_email` (text), `plan_manager_phone` (text)
- `support_coordinator` (text), `support_coordinator_email` (text), `support_coordinator_phone` (text)
- `funding_type` (text) — self-managed / plan-managed / NDIA-managed

**Communication:**
- `communication_needs` (text) — how the participant communicates
- `communication_aids` (text) — any aids/devices used
- `decision_making` (text) — supported/substitute decision making info

**Legal/Guardian:**
- `guardian_name` (text), `guardian_phone` (text), `guardian_relationship` (text)
- `has_guardianship_order` (boolean, default false)
- `advocate_name` (text), `advocate_phone` (text)

## Files Changed

### 1. Migration SQL (new file)
Add all columns above to `participants` table. All nullable with sensible defaults.

### 2. `src/components/participants/AddParticipantDialog.tsx`
Rewrite to use the staff dialog pattern:
- Collapsible sections: **Basic Info**, **Cultural & Language**, **Medical & Health**, **NDIS Plan**, **Communication**, **Guardian/Advocate**, **Alerts**, **Notes**
- Form state as single `form` object with `set`/`setBool`/`setSelect` helpers
- Wider dialog (`max-w-2xl`)

### 3. `src/pages/ParticipantDetail.tsx` — Overview tab
Replace the simple dl-based overview with a card grid (matching `StaffOverviewTab`):
- Personal Details card
- Cultural & Language card
- Medical & Health card
- NDIS Plan card
- Communication card
- Guardian/Advocate card

### 4. `src/integrations/supabase/types.ts`
Auto-regenerates after migration.

