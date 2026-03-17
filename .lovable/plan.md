

# Update Compliance: 100 Pts of ID, Driver's Licence Always Required, Transport Flag Change

## Changes to `src/lib/compliance-definitions.ts`

### 1. Driver's Licence — always mandatory
Remove `conditional_on: "transports_participants"` from `drivers_licence`. It becomes unconditionally required for all staff.

### 2. Add "100 Points of ID Verified" item
New Pre-Employment item `hundred_points_id` — mandatory, no expiry, requires document. Inserted after `right_to_work` (display_order 3.5 area).

### 3. Rename role flag and split vehicle items
- Rename flag `transports_participants` → `transports_in_own_vehicle` with label "Transports clients in own vehicle"
- Rename `vehicle_rego_insurance` → `vehicle_registration` ("Vehicle Registration") conditional on `transports_in_own_vehicle`
- Add new item `vehicle_insurance` ("Vehicle Insurance") conditional on `transports_in_own_vehicle`
- Update `RoleFlags` type and `DEFAULT_ROLE_FLAGS` to use the new key

### 4. Update `StaffDetail.tsx` and `StaffComplianceTab.tsx`
Both reference `RoleFlags` — they'll pick up the type change automatically since they import from compliance-definitions. The `staff_role_flags` DB column name stays as `transports_participants` but gets mapped to the new key in the useMemo in StaffDetail.

### 5. Database migration
- Rename column `transports_participants` → `transports_in_own_vehicle` in `staff_role_flags` table (using ALTER TABLE RENAME COLUMN)

## Files Changed
1. **Migration SQL** — rename column in `staff_role_flags`
2. **`src/lib/compliance-definitions.ts`** — add 100pts item, make driver's licence unconditional, rename flag, split vehicle rego/insurance
3. **`src/pages/StaffDetail.tsx`** — update the `flags` useMemo to use new column name
4. **`src/integrations/supabase/types.ts`** — auto-regenerates

