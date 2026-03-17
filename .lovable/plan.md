

# Add Asina Logo & Favicon Across the App

## Assets to Copy
- `user-uploads://asina-favicon-2.png` → `public/favicon.png` (browser tab favicon)
- `user-uploads://asina-logo-2.png` → `src/assets/asina-logo.png` (React components)

The logo has a transparent background (no black background to remove).

## Files to Edit

### 1. `index.html`
- Add `<link rel="icon" href="/favicon.png" type="image/png">` in `<head>`

### 2. `src/pages/Login.tsx`
- Import logo from `@/assets/asina-logo.png`
- Replace the "A" gradient square (line 53-55) with `<img src={logo} alt="Asina" className="mx-auto mb-4 h-14" />`

### 3. `src/components/AppSidebar.tsx`
- Import both logo and favicon images
- **Expanded state** (lines 116-124): Replace the "A" square + text with `<img src={logo} alt="Asina" className="h-8" />`
- **Collapsed state** (lines 126-128): Replace the "A" square with `<img src={favicon} alt="Asina" className="h-8 w-8" />`

### 4. `src/pages/Dashboard.tsx`
- Import logo, add it to the welcome banner next to the text for brand presence

