

# Update Sidebar to Match Login's Light Teal Gradient

## Problem
The sidebar CSS variables set the background to `192 42% 18%` (very dark, lightness 18%). The login card uses `hsl(173 72% 36%)` → `hsl(200 50% 30%)` — a brighter, more vibrant teal. The reference image shows the sidebar matching this lighter teal tone.

## Changes

### `src/index.css` — Update sidebar CSS variables (light mode)
Change the sidebar color tokens to match the login gradient range:

| Variable | Current | New |
|---|---|---|
| `--sidebar-background` | `192 42% 18%` | `173 72% 36%` (matches login's `from` color) |
| `--sidebar-accent` | `192 35% 24%` | `173 60% 32%` (slightly darker for hover states) |
| `--sidebar-border` | `192 35% 22%` | `173 50% 30%` |

Also update dark mode sidebar variables to the same values so it stays consistent.

### `src/components/AppSidebar.tsx` — Add gradient background
Apply `bg-gradient-to-b from-[hsl(173_72%_36%)] to-[hsl(200_50%_30%)]` directly on the `<Sidebar>` component to get the same gradient direction as the login card, giving it depth rather than a flat color.

### Result
The sidebar will use the same vibrant teal gradient as the login card, with the active item highlight (`sidebar-primary`) and gold accents remaining visible against the lighter background.

