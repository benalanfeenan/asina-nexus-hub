

# Make WWCC Unconditionally Mandatory

## Change
In `src/lib/compliance-definitions.ts`, remove `conditional_on: "supports_under_18"` from the `wwcc` item (set it to `null`), making Working With Children Check required for all staff regardless of whether they support under-18 participants.

Also remove the `supports_under_18` role flag since it no longer gates any compliance item — clean up from `ROLE_FLAG_LABELS`, `ROLE_FLAG_KEYS`, `RoleFlags` type, and `DEFAULT_ROLE_FLAGS`.

## Files Changed
- `src/lib/compliance-definitions.ts` — set `conditional_on: null` on `wwcc`, remove `supports_under_18` flag

