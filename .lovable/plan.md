

# Fix: Bi-directional Sync Between Linked Compliance Items

## The Bug
`first_aid_renewal` has `linked_to: "first_aid"`, meaning it's a child of `first_aid`. The current sync logic in `StaffComplianceTab.tsx` only syncs **parent → children** (line 118: `filter(i => i.linked_to === payload.item_key)`). It never syncs **child → parent**.

So when you completed "First Aid Renewal" (either directly or via the Training tab), it updated `first_aid_renewal` but did NOT update the parent `first_aid` in Induction. Same issue affects `cpr_refresher` → `cpr` and `ndis_wsc_renewal` → `ndis_wsc`.

## Fix
In the `upsertItem` mutation in `StaffComplianceTab.tsx`, after the existing child-sync logic, add a **parent-sync**: look up the current item's definition, check if it has a `linked_to` value, and if so, also upsert the parent item with the same status/dates.

Same fix needed in `src/lib/compliance-definitions.ts` → `upsertComplianceItem` helper (used by Training, Competencies, Acknowledgements tabs).

## Files Changed
1. **`StaffComplianceTab.tsx`** — add parent sync block after the existing child sync (lines 118-131)
2. **`src/lib/compliance-definitions.ts`** — update `upsertComplianceItem` to also sync to parent when the item has `linked_to`

