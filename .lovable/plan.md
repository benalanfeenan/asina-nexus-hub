

# Fix White-on-White Buttons in PageHeader

## Problem
Buttons using `variant="outline"` inside the `PageHeader` (teal gradient) get `bg-background` from the variant definition, resulting in a white/light background that makes white text invisible.

## Root Cause
The `outline` variant in `button.tsx` includes `bg-background`, which resolves to a near-white color. When these buttons are placed inside the dark `PageHeader` gradient with `text-white` overrides, the background stays light -- white text on white background.

## Fix

### 1. Add a `ghost-light` button variant for use on dark backgrounds
In `src/components/ui/button.tsx`, add a new variant designed for buttons on dark/gradient backgrounds:
```
"ghost-light": "text-white border border-white/30 bg-white/10 hover:bg-white/20"
```

### 2. Update affected buttons
- **`src/pages/Scheduler.tsx`** (lines 156-161): Change "Publish Drafts" from `variant="outline" className="text-white border-white/30..."` to `variant="ghost-light"`. Change "Add Shift" from inline `className="bg-white text-primary..."` to `variant="accent"`.
- **`src/pages/Rostering.tsx`** (lines 137-143): Change all 4 outline buttons (Handovers, Sleepover Logs, Patterns, Generate Week) from `variant="outline" className="text-white border-white/30..."` to `variant="ghost-light"`.

This consolidates the pattern into a reusable variant instead of fragile className overrides, and eliminates the `bg-background` conflict entirely.

