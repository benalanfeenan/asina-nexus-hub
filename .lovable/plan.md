

# Visual Rebrand: Match Asina Website Design

## Brand Colors Extracted from Website
From the uploaded screenshot, the Asina brand uses:
- **Primary teal/green**: `#1a9e8f` (buttons, nav highlights) -- close to current `--primary`
- **Deep teal gradient start**: `#0d7377` (dark end of hero gradient)
- **Gold/amber accent**: `#e8a838` (CTA buttons like "Make a Referral", "CREATE" pill) -- close to current `--accent`
- **Dark background**: `#1a3a4a` (top nav bar, footer tones)
- **White text on gradients**, clean white cards
- **Rounded pill buttons** with gradient backgrounds
- **Gradient hero sections**: teal-to-dark-teal diagonal gradients

## What Changes

### 1. CSS Variables (`src/index.css`)
- Fine-tune `--primary` to exact Asina teal `#1a9e8f`
- Adjust `--accent` to match golden yellow `#e8a838`
- Sidebar: use deep teal gradient tones instead of plain dark grey
- Add CSS utility classes for brand gradients (`.bg-brand-gradient`, `.bg-brand-gradient-subtle`)
- Increase `--radius` to `0.75rem` for more rounded feel

### 2. Tailwind Config (`tailwind.config.ts`)
- Add `backgroundImage` entries for brand gradients (teal-to-dark-teal)
- Add custom box-shadow for cards with subtle teal glow

### 3. Login Page (`src/pages/Login.tsx`)
- Full-screen gradient background (teal diagonal) instead of plain `bg-background`
- White card with frosted glass effect and rounded corners
- Brand logo placeholder styled as gradient circle
- Pill-shaped buttons with gradient fill

### 4. Sidebar (`src/components/AppSidebar.tsx`)
- Gradient background (dark teal to deep teal) instead of flat dark color
- Active nav items get a subtle gradient highlight with left border accent
- Logo area gets brand gradient treatment

### 5. App Header (`src/components/AppLayout.tsx`)
- Subtle gradient border-bottom or thin teal accent line
- Light frosted glass effect on header

### 6. Dashboard (`src/pages/Dashboard.tsx`)
- Top welcome section with subtle gradient banner
- Stat cards with gradient accent borders (left border or top border in teal)
- Card hover effects with teal shadow glow

### 7. UI Primitives (global effect on ALL pages and dialogs)
- **Card** (`card.tsx`): Add subtle shadow upgrade, slightly more rounded
- **Button** (`button.tsx`): Primary variant gets gradient background (`from-[#1a9e8f] to-[#0d7377]`), more rounded (`rounded-full` for pill shape on key CTAs)
- **Dialog** (`dialog.tsx`): Rounded corners, subtle gradient on header area
- **Badge**: Softer rounded pills
- **Input**: Slightly more rounded, focus ring in teal

### 8. All Page Headers
- Add a subtle gradient background strip behind page titles (h1 sections)
- Consistent styling across all 15+ pages via a shared pattern

## Files to Edit
- `src/index.css` -- color variables, gradient utilities, global styles
- `tailwind.config.ts` -- gradient backgrounds, shadows
- `src/pages/Login.tsx` -- gradient background, styled card
- `src/components/AppSidebar.tsx` -- gradient sidebar
- `src/components/AppLayout.tsx` -- header accent
- `src/components/ui/button.tsx` -- gradient primary variant
- `src/components/ui/card.tsx` -- enhanced shadows/rounding
- `src/components/ui/dialog.tsx` -- rounded corners
- `src/components/ui/badge.tsx` -- pill shape
- `src/components/ui/input.tsx` -- rounding + focus
- `src/pages/Dashboard.tsx` -- gradient welcome banner, styled stat cards

## Approach
All changes cascade through the design system -- updating CSS variables and the 5-6 UI primitives will automatically restyle every page, every dialog, and every form across the entire app without touching each of the 15+ page files individually.

