

# Fix Sidebar Gradient Being Overridden

## Problem
The `<Sidebar>` component in `sidebar.tsx` has multiple nested divs that each apply `bg-sidebar` (a flat solid color). Even though `AppSidebar.tsx` adds a gradient class to the outer `<Sidebar>`, the inner content div (line 209) and the mobile sheet (line 159) override it with the flat `bg-sidebar` background.

## Fix

### `src/components/ui/sidebar.tsx`
Remove `bg-sidebar` from the inner divs that overlap the outer container, so the gradient from the parent shows through:

- **Line 144**: Remove `bg-sidebar` from the flex column container (keep `text-sidebar-foreground`)
- **Line 209**: Remove `bg-sidebar` from the `data-sidebar="sidebar"` inner div
- **Line 159**: Keep `bg-sidebar` on mobile sheet (it's a separate overlay, needs its own background) — but change it to match the gradient too

### `src/components/AppSidebar.tsx`
No changes needed — the gradient class is already applied correctly on line 115.

## Result
The gradient from `bg-gradient-to-b from-[hsl(173_72%_36%)] to-[hsl(200_50%_30%)]` will flow through all nested sidebar elements, matching the login page's look.

