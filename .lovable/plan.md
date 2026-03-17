

# Participant Management Module

## Overview
Build a full Participant Management module following the same patterns as Staff Management. All database tables already exist: `participants`, `participant_contacts`, `participant_goals`, `participant_daily_routines`, `participant_support_needs`, `medications`. No schema changes needed.

## What We'll Build

### 1. Participant List Page (`src/pages/Participants.tsx`)
- Header with "Add Participant" button (admin/house_manager only)
- Search bar filtering by name, NDIS number, email
- Filter by status (active/inactive) and SIL house
- Table showing: name, NDIS number, SIL house, date of birth, alerts summary (allergy/BSP/mealtime icons), active status
- Click row to navigate to `/participants/:id`

### 2. Add/Edit Participant Dialog
- Form fields: first name, last name, date of birth, NDIS number, phone, email, address, SIL house (select from `sil_houses`), alerts (JSON checkboxes for allergies, BSP, mealtime plan), notes
- react-hook-form + zod validation
- Inserts/updates `participants` table

### 3. Participant Detail Page (`src/pages/ParticipantDetail.tsx`)
- New route: `/participants/:id`
- Header card with name, NDIS number, DOB, SIL house, alert badges, active status
- Tabbed interface:
  - **Overview**: basic info, address, phone, email, alerts displayed as colored badges
  - **Contacts**: list from `participant_contacts`, add dialog (name, relationship, phone, email, contact type, is_primary)
  - **Goals**: list from `participant_goals`, add dialog (goal text, status, target date, progress percentage)
  - **Daily Routines**: list from `participant_daily_routines`, add dialog (time of day, routine description, support required)
  - **Support Needs**: list from `participant_support_needs`, add dialog (category, description, support level)
  - **Medications**: list from `medications`, add dialog (name, dose, frequency, route, prescriber, is_prn, instructions)

### 4. Component Files
- `src/components/participants/ParticipantTable.tsx` -- list table
- `src/components/participants/AddParticipantDialog.tsx` -- add/edit form
- `src/components/participants/ParticipantContactsTab.tsx` -- contacts CRUD
- `src/components/participants/ParticipantGoalsTab.tsx` -- goals CRUD
- `src/components/participants/ParticipantRoutinesTab.tsx` -- daily routines CRUD
- `src/components/participants/ParticipantSupportNeedsTab.tsx` -- support needs CRUD
- `src/components/participants/ParticipantMedicationsTab.tsx` -- medications CRUD
- Add dialogs for each sub-entity

### 5. Route Addition
- Add `/participants/:id` route to `App.tsx`

### Technical Approach
- Same patterns as Staff module: `@tanstack/react-query` for data, `react-hook-form` + `zod` for validation
- Alerts stored as JSON in `participants.alerts` column, rendered as colored badges (red for allergies, blue for BSP, orange for mealtime)
- Admin and house_manager can add/edit; support_worker can view only
- All mutations invalidate relevant query keys

