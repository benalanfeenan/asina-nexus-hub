

# Redesign Login Page to Match Reference Image

## Design from Reference (image-3.png)
- **Page background**: White/light grey (not teal gradient)
- **Card**: Full gradient background (teal-to-blue diagonal), rounded-2xl, with shadow
- **Logo**: White version on gradient card
- **Text**: White "Welcome back" heading, lighter subtitle
- **Labels**: White, bold
- **Inputs**: Semi-transparent white (`bg-white/20`), no border, white placeholder text, rounded-lg
- **"Forgot password?"**: Inline next to Password label (not below form)
- **Sign In button**: Gold/amber (`#e8a838`), rounded-full, bold white text
- **Footer text**: "Contact your administrator for access" + "NDIS Provider? Register your organisation today!" in gold

## File to Edit
`src/pages/Login.tsx` — complete restyle:
- Page: `bg-gray-100` instead of `bg-brand-gradient`
- Remove `<Card>` wrapper, use a plain `div` with `bg-gradient-to-br from-[#1a9e8f] to-[#2a7da5]` (teal-to-blue)
- Logo with `brightness-0 invert` filter for white appearance on gradient
- All labels `text-white font-semibold`
- Inputs: `bg-white/20 border-0 text-white placeholder:text-white/60`
- Password label row: flex with "Forgot password?" link on right in `text-amber-400`
- Sign In button: `bg-[#e8a838] hover:bg-[#d49730] text-white rounded-full`
- Footer: white + amber text lines
- Remove decorative circles

