

# SIL House Competency Requirements → Staff Compliance

## Concept
Each SIL house gets competency requirement flags (e.g., "Has participants needing medication", "Has participants needing mealtime assistance"). When a staff member is assigned to that house, those competency flags merge with their personal role flags, making the corresponding compliance items mandatory with annual refreshers.

## Database Change

New table `sil_house_competency_requirements`:

```sql
CREATE TABLE public.sil_house_competency_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sil_house_id uuid NOT NULL REFERENCES public.sil_houses(id) ON DELETE CASCADE,
  -- reuse the same flag keys as staff role flags
  administers_medication boolean NOT NULL DEFAULT false,
  supports_mealtime_assessed boolean NOT NULL DEFAULT false,
  supports_bsp_participants boolean NOT NULL DEFAULT false,
  delivers_high_intensity boolean NOT NULL DEFAULT false,
  uses_restrictive_practices boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sil_house_id)
);
```

RLS: authenticated can view, admin/house_manager can manage.

## UI Changes

### 1. AddSILHouseDialog — add competency checkboxes
After the existing fields (name, address, capacity, notes), add a "House Competency Requirements" section with checkboxes for each competency. On save, insert into both `sil_houses` and `sil_house_competency_requirements`.

### 2. SILHouseDetail — show/edit competency requirements
Add a small card or section in the house detail header showing which competencies are required, with edit capability for admin/house_manager.

### 3. StaffComplianceTab — merge house-based flags
Currently the tab fetches `staff_role_flags` to determine which role-specific items apply. Add a query for houses the staff member is linked to (`sil_house_staff`), then fetch `sil_house_competency_requirements` for those houses. Merge (OR) all house flags with the staff's personal role flags. This makes house-driven competencies appear as mandatory items automatically.

### 4. StaffDetail — same merge for compliance score
The `flags` useMemo in StaffDetail also needs the merged house flags so the compliance percentage is accurate.

### 5. ComplianceDashboard & Staff list — same merge
Anywhere compliance score is calculated, the house-based flags need merging.

## Files Changed
1. **Migration SQL** — create `sil_house_competency_requirements` table with RLS
2. **`src/integrations/supabase/types.ts`** — auto-regenerates
3. **`src/components/sil-houses/AddSILHouseDialog.tsx`** — add competency checkboxes
4. **`src/pages/SILHouseDetail.tsx`** — display/edit house competency requirements
5. **`src/components/staff/StaffComplianceTab.tsx`** — fetch house requirements, merge with role flags
6. **`src/pages/StaffDetail.tsx`** — fetch house requirements, merge for score calc
7. **`src/pages/ComplianceDashboard.tsx`** — merge house flags into compliance calculations
8. **`src/pages/Staff.tsx`** — merge house flags into staff list compliance scores

