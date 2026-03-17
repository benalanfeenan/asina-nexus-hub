

# Staff Compliance Module — Full NDIS Implementation Plan

This is a comprehensive rebuild of the staff compliance system. Here's what changes.

---

## Database Changes (Single Migration)

### 1. Add name fields to `staff` table
```sql
ALTER TABLE staff ADD COLUMN first_name text;
ALTER TABLE staff ADD COLUMN last_name text;
ALTER TABLE staff ADD COLUMN phone text;
ALTER TABLE staff ADD COLUMN photo_url text;
ALTER TABLE staff ADD COLUMN status text NOT NULL DEFAULT 'active';
```
This fixes the "Unknown" name problem — names stored directly on staff, not dependent on profiles.

### 2. New table: `compliance_item_definitions`
Pre-seeded with all 41 items. Columns: `item_key`, `name`, `description`, `category`, `requires_document`, `has_expiry`, `expiry_months`, `is_mandatory`, `conditional_on` (nullable — references role flag field name), `display_order`.

### 3. New table: `staff_compliance_items`
Replaces the current `staff_compliance` usage for this module. Columns: `staff_id`, `item_key`, `status` (not_started/in_progress/completed/expired/not_applicable), `date_completed`, `expiry_date`, `document_url`, `verified_by`, `verified_date`, `notes`.

### 4. New table: `staff_role_flags`
One row per staff member. Boolean toggles: `administers_medication`, `supports_mealtime_assessed`, `supports_bsp_participants`, `delivers_high_intensity`, `uses_restrictive_practices`, `transports_participants`, `supports_under_18`.

RLS on all new tables follows existing pattern (admin ALL, authenticated SELECT+INSERT, house_manager ALL).

---

## UI Changes

### AddStaffDialog
- Add **First Name** and **Last Name** fields (required)
- Also update `profiles.full_name` on save for backward compatibility

### StaffDetail page
- Display `staff.first_name + staff.last_name` as name (fallback to profile)
- Show compliance score (circular progress) in the header card
- Replace existing Compliance tab with new full compliance profile

### New: StaffComplianceTab (complete rewrite)
1. **Role Toggles card** — 7 toggle switches that control which conditional items are applicable
2. **Compliance Items list** — grouped by category (Pre-Employment, Induction, Role-Specific, Ongoing), each item as an expandable card showing status badge, dates, document upload, verification, notes
3. **Score calculation** — computed client-side from items data + role flags
4. **Document upload** — uses existing `documents` storage bucket
5. **Linked items** (34↔18, 35↔17, 36↔1) — when parent item updated, linked renewal item auto-syncs

### StaffTable + Staff list page
- Display `first_name + last_name` instead of `profiles.full_name`
- Show compliance score percentage

### ComplianceDashboard (complete rewrite)
- Alert panel at top: red/amber alerts with specific item counts and staff names
- Matrix table: staff rows × key compliance columns with RAG dots
- Overall score column, sortable
- Filters: status (issues only), position, employment type
- Export buttons (CSV download)

---

## Files Changed
- New migration SQL (tables + seed data for 41 definitions)
- `src/components/staff/AddStaffDialog.tsx` — add name fields
- `src/components/staff/StaffComplianceTab.tsx` — complete rewrite
- `src/components/staff/StaffTable.tsx` — use staff name fields
- `src/pages/StaffDetail.tsx` — show score, use staff names
- `src/pages/Staff.tsx` — minor: use staff names
- `src/pages/ComplianceDashboard.tsx` — complete rewrite with new data model
- `src/integrations/supabase/types.ts` — auto-regenerated

## Not included (separate effort)
- PDF export (complex, needs edge function)
- Mobile self-service view (needs auth role check for "own profile")
- Daily cron for auto-expiry (needs edge function + pg_cron)

