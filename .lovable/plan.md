

# Move Compliance Tab to Second Position

Move the "Compliance" tab trigger and content to be right after "Overview" in `src/pages/ParticipantDetail.tsx`, matching the staff detail page pattern.

### Change in `src/pages/ParticipantDetail.tsx`
- **TabsList**: Reorder so Compliance is the second tab (after Overview, before Contacts)
- **TabsContent**: Move the Compliance TabsContent block to be after the Overview TabsContent

Current order: Overview, Contacts, Goals, Routines, Support, Medications, MAR, ABC, **Compliance**, Documents

New order: Overview, **Compliance**, Contacts, Goals, Routines, Support, Medications, MAR, ABC, Documents

