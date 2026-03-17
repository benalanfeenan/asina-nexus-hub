

# Apply Consistent Teal Gradient + Gold Styling Across the App

## Current State
- The **Login page** has the vibrant teal gradient card with gold buttons -- this is the target style
- All other pages (15+) have plain `h1` titles with no gradient banner
- Only the **Dashboard** has a gradient welcome banner
- The sidebar already uses brand gradient dark
- Buttons use teal gradient but the gold/amber accent is only on Login

## Approach: Shared PageHeader Component + Global Tweaks

Rather than editing 15+ page files individually, create a **reusable `PageHeader` component** that gives every page a consistent branded header, then update a few global primitives.

### 1. Create `src/components/PageHeader.tsx` (new file)
A reusable component that renders:
- A `rounded-xl bg-brand-gradient` banner (matching Login's teal-to-blue gradient)
- White page title (h1) and optional subtitle
- Optional action buttons slot (right-aligned, gold/amber styled)
- Consistent padding, shadow, and spacing

```tsx
// Usage: <PageHeader title="Participants" action={<Button>Add</Button>} />
```

### 2. Update all 15 page files to use `<PageHeader>`
Replace the current pattern:
```tsx
<div className="flex items-center justify-between">
  <h1 className="text-3xl font-heading font-bold">Title</h1>
  <Button>Action</Button>
</div>
```
With:
```tsx
<PageHeader title="Title" action={<Button>Action</Button>} />
```

Pages to update: Participants, Staff, Incidents, Rostering, SILHouses, Complaints, Timesheets, ProgressNotes, Documents, Invoicing, Hazards, RestrictivePractices, RiskRegister, QualityImprovement, ComplianceDashboard, NDISPriceList, Settings, ParticipantDetail, StaffDetail, SILHouseDetail

### 3. Add a gold/amber `"accent"` button variant (`src/components/ui/button.tsx`)
New variant: `accent` -- gold background (`bg-[hsl(38_78%_56%)]`), white text, rounded-full, matching Login's "Sign In" button style. Used for primary CTA buttons on page headers against the gradient background.

### 4. Update `src/components/ui/table.tsx` header styling
Give table headers a subtle teal tint (`bg-brand-gradient-subtle`) instead of plain `bg-muted` for consistency.

### 5. Dashboard banner update
Refactor Dashboard to use `<PageHeader>` for its welcome banner too, keeping the logo.

## Files to Edit/Create
- **Create**: `src/components/PageHeader.tsx`
- **Edit**: `src/components/ui/button.tsx` (add accent variant)
- **Edit**: 20 page files (swap h1 block for `<PageHeader>`)
- **Edit**: `src/components/ui/table.tsx` (tinted headers)

## Result
Every page gets a vibrant teal gradient header with white text and gold action buttons, matching the Login page's sleek, colourful aesthetic consistently across the entire app.

