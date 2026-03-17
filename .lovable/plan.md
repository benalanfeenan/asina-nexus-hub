

# Fix Bulk Upload Button Visibility

The "Bulk Upload" button uses `variant="outline"` which renders white/transparent on the teal gradient header, making it nearly invisible.

## Change

### `src/pages/Documents.tsx`
- Change the Bulk Upload button from `variant="outline"` to `variant="secondary"` so it has a visible background that contrasts against the teal header gradient.

