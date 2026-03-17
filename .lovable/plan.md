

# Redesign Compliance Tab as a Clean Matrix Layout

## Current State
The compliance tab uses heavy cards with individually bordered collapsible rows — lots of visual noise. Role flags are in a 2-column grid of bordered boxes.

## New Layout

### Role Flags → Compact inline toggle row
Replace the bordered card grid with a single horizontal strip of inline toggle pills — each flag as a compact `label + switch` inline, wrapping naturally. No borders around each toggle, just a subtle divider line below the section.

### Compliance Items → Table Matrix
Replace the card-per-category + collapsible-row pattern with a **single table** organized by category headers as sticky row dividers:

| Item | Status | Completed | Expiry | Doc | |
|------|--------|-----------|--------|-----|---|
| **Pre-Employment** | | | | | |
| NDIS Worker Screening Check | ✅ Completed | 2024-01-15 | 2027-01-15 | 📄 | ▸ |
| Working With Children Check | — N/A | | | | |
| **Induction** | | | | | |
| Code of Conduct (signed) | ✅ Completed | 2024-02-01 | | 📄 | ▸ |
| ...etc | | | | | |

- Category names as bold section header rows spanning all columns
- Status shown as a small colored dot + text (not a badge)
- Document icon links directly to the file
- Chevron on the right expands an inline edit form below the row (same form as now)
- N/A items shown greyed out at the bottom of their category
- Compact row height (~40px) for density

### Score Bar
Keep the score bar at top but make it slimmer — horizontal bar with percentage inline, not a big centered number.

## Files Changed
- `src/components/staff/StaffComplianceTab.tsx` — rebuild the render section with table layout, compact role flags strip, and slim score bar. All data logic stays identical.

