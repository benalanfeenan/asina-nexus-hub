

# Fix: Invoice Generation Failing for Ben Feenan

## Root Cause
The `scheduler_shifts` query joins `participants(first_name, last_name)` but does **not** include `id` in the join. So `group.participant.id` is always `undefined`, triggering the guard: "Cannot generate invoice: Participant information is missing."

## Fix (single file)

**File**: `src/pages/Invoicing.tsx`

1. **Add `id` to the participants join select** (line 92):
   - Change `participants(first_name, last_name)` to `participants(id, first_name, last_name)`

2. **Also fix the `readyByParticipant` mapping** (line 109) as a safety fallback:
   - Use `{ id: pid, ...s.participants }` instead of just `s.participants`, so `participant_id` from the shift is always available even if the join shape changes

Both changes together ensure the participant ID is always present when generating invoices.

