

# Add Comprehensive Staff Profile with Edit Capability

## Problem
There's no way to edit a staff member from the StaffDetail page, and the staff record only stores basic fields (name, phone, position, employment type, start date, notes). NDIS Practice Standards and employment law require tracking much more.

## Database Changes (Single Migration)

Add columns to the `staff` table:

**Personal Details:**
- `date_of_birth` (date, nullable)
- `gender` (text, nullable)
- `pronouns` (text, nullable)
- `sexuality` (text, nullable)
- `address` (text, nullable)
- `email` (text, nullable — direct staff email, separate from profile login email)

**Cultural & Language:**
- `is_cald` (boolean, default false) — Culturally and Linguistically Diverse
- `country_of_birth` (text, nullable)
- `languages_spoken` (text, nullable — comma-separated)
- `interpreter_required` (boolean, default false)
- `indigenous_status` (text, nullable — e.g. "non_indigenous", "aboriginal", "torres_strait_islander", "both")

**Emergency Contact:**
- `emergency_contact_name` (text, nullable)
- `emergency_contact_phone` (text, nullable)
- `emergency_contact_relationship` (text, nullable)

**Employment Details:**
- `end_date` (date, nullable)
- `probation_end_date` (date, nullable)
- `pay_rate` (numeric, nullable)
- `award_level` (text, nullable — e.g. "SCHADS Level 2.1")
- `tax_file_number_on_file` (boolean, default false)
- `superannuation_fund` (text, nullable)
- `bank_details_on_file` (boolean, default false)

**NDIS-Specific:**
- `ndis_worker_id` (text, nullable)
- `disability_status` (text, nullable)
- `working_with_children_number` (text, nullable)
- `ndis_screening_number` (text, nullable)

## UI Changes

### 1. Edit button on StaffDetail header
Add a pencil/edit icon button next to the staff name that opens the AddStaffDialog in edit mode, pre-populated with all current values.

### 2. Rebuild AddStaffDialog as a tabbed/sectioned form
Organize fields into collapsible sections:
- **Basic Info** — first name, last name, phone, email, date of birth, gender, pronouns, sexuality, address
- **Cultural & Language** — CALD toggle, country of birth, languages spoken, interpreter required, indigenous status
- **Emergency Contact** — name, phone, relationship
- **Employment** — position, employment type, start date, end date, probation end, pay rate, award level, TFN on file, super fund, bank details on file, user profile link
- **NDIS Details** — NDIS worker ID, screening number, WWCC number, disability status
- **Notes** — free text

### 3. Update StaffDetail Overview tab
Display the new fields in organized cards (Personal, Emergency Contact, Cultural & Language, Employment Details) so all info is visible at a glance.

### 4. Update types
`src/integrations/supabase/types.ts` will auto-regenerate after migration.

## Files Changed
1. **New migration SQL** — ALTER TABLE staff ADD COLUMN for all ~20 new fields
2. **`AddStaffDialog.tsx`** — complete rebuild with sectioned form, all new fields
3. **`StaffDetail.tsx`** — add Edit button in header, expand Overview tab to show all details
4. **`StaffTable.tsx`** — no changes needed (list view stays compact)

