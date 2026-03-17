

# Phase 1: Foundation, Auth & Database Schema

## Overview
Build the design system, app shell with sidebar navigation, authentication system, and create the complete database schema for all NDIS All in One modules.

---

## Step 1: Design System & Global Styles

Update `src/index.css` and `tailwind.config.ts`:
- Import **Questrial** (Century Gothic substitute) and **DM Sans** from Google Fonts in `index.html`
- Set CSS variables: primary teal `#1A9E8F`, accent amber `#E4B134`, text slate `#1E293B`, background `#F8FAFC`
- Add status colors: success green, warning amber, critical red
- Configure font families in Tailwind config

---

## Step 2: Database Schema (Single Large Migration)

Create all core tables via migration. Key tables grouped by module:

**Auth & Profiles:**
- `app_role` enum (admin, house_manager, support_worker)
- `profiles` (id FK to auth.users, full_name, email, avatar_url, phone, is_active)
- `user_roles` (user_id, role) with `has_role()` security definer function
- Trigger to auto-create profile on auth signup

**Participants:**
- `participants` (personal details, ndis_number, sil_house_id FK, alerts jsonb for allergies/BSP/mealtime)
- `participant_contacts` (type: emergency/guardian/GP/pharmacy, details)
- `participant_goals` (goal text, progress percentage, status)
- `participant_daily_routines`, `participant_support_needs`
- `medications` (name, dose, frequency, active flag)
- `mar_records` (medication_id, date, time_slot, administered_by, status)
- `prn_records` (medication_id, reason, outcome)

**Staff:**
- `staff` (profile_id FK, employment details, position)
- `staff_training` (training name, completion date, expiry date, status)
- `staff_compliance` (check type: NDIS_WSC/WWCC/first_aid/CPR, issue/expiry dates, document_url)

**SIL Houses:**
- `sil_houses` (name, address, capacity, is_active)
- `sil_house_participants` (junction), `sil_house_staff` (junction)
- `property_maintenance_log`

**Rostering & Timesheets:**
- `shifts` (house_id, date, shift_type enum, staff_id, status)
- `recurring_roster_patterns`
- `timesheets` (shift_id, rate_type auto-detected, hours, approval_status, approved_by)
- `public_holidays` (date, name)

**Progress Notes:**
- `progress_notes` (participant_id, staff_id, shift_id, content, goal_progress, concerns_flagged)

**Invoicing:**
- `invoices` (participant_id, status: draft/sent/paid/overdue, total, invoice_number)
- `invoice_line_items` (invoice_id, ndis_line_item_code, description, quantity, rate, amount)
- `board_lodging_invoices`
- `ndis_price_list` (item_code, description, unit, rate)

**Compliance & Governance:**
- `incidents` (auto-ref INC-YYYY-NNN, category flags jsonb, severity, reportable, investigation fields)
- `complaints` (auto-ref, workflow status, acknowledgement/resolution dates)
- `risks` (category, likelihood, consequence, risk_rating computed, review_date)
- `hazards` (house_id, description, status, photo_url)
- `restrictive_practices` (participant_id, type enum, duration, authorised, antecedent, outcome)
- `quality_improvements` (source_type, source_id, description, action, responsible_person, due_date, status)

**Documents & Handovers:**
- `documents` (category, file_url, version, review_date, uploaded_by)
- `shift_handovers` (shift_id, outgoing/incoming staff, content jsonb, acknowledged)
- `sleepover_logs` (shift_id, participant_id, start/end time, reason, active_minutes)

**Settings:**
- `organisation_settings` (name, abn, address, bank_details jsonb, logo_url)
- `auto_reference_sequences` (type, year, last_number) for generating INC-2026-001 style refs

**RLS Policies:** Enable RLS on all tables. Admins can do everything. House managers can access their assigned houses' data. Support workers can only access their own shifts, assigned participants, and forms.

**Storage Buckets:** Create `staff-documents`, `participant-documents`, `organisation-documents`.

---

## Step 3: App Shell & Sidebar Navigation

Create `src/components/AppSidebar.tsx` and `src/components/AppLayout.tsx`:
- Collapsible sidebar using shadcn `Sidebar` component
- Asina logo at top (text placeholder initially)
- Grouped nav sections:
  - **Main:** Dashboard
  - **People:** Participants, Staff
  - **Operations:** SIL Houses, Rostering, Timesheets, Progress Notes, Invoicing
  - **Compliance:** Incidents, Complaints, Risk Register, Hazards, Restrictive Practices, Quality Improvement, Compliance Dashboard
  - **System:** Documents, Settings
- Active route highlighting via `NavLink`
- Role-based nav filtering (support workers see limited items)
- Mobile responsive with hamburger trigger

---

## Step 4: Authentication

Create `src/pages/Login.tsx`:
- Branded login page with Asina logo, teal/amber styling
- Email + password form (no signup link -- admin creates accounts)
- Forgot password flow with `/reset-password` page

Create `src/contexts/AuthContext.tsx`:
- Auth state management with `onAuthStateChange` listener
- Fetch user role from `user_roles` table
- Expose `user`, `role`, `loading`, `signOut`

Create `src/components/ProtectedRoute.tsx`:
- Redirect to `/login` if not authenticated
- Optional role check prop

Update `src/App.tsx`:
- Wrap with `AuthProvider`
- All module routes wrapped in `ProtectedRoute` inside `AppLayout`
- Login and reset-password as public routes

---

## Step 5: Placeholder Pages for All Modules

Create stub pages for each sidebar item so navigation works end-to-end:
- `src/pages/Dashboard.tsx` (with basic welcome card)
- `src/pages/Participants.tsx`
- `src/pages/Staff.tsx`
- `src/pages/SILHouses.tsx`
- `src/pages/Rostering.tsx`
- `src/pages/Timesheets.tsx`
- `src/pages/ProgressNotes.tsx`
- `src/pages/Invoicing.tsx`
- `src/pages/Incidents.tsx`
- `src/pages/Complaints.tsx`
- `src/pages/RiskRegister.tsx`
- `src/pages/Hazards.tsx`
- `src/pages/RestrictivePractices.tsx`
- `src/pages/QualityImprovement.tsx`
- `src/pages/ComplianceDashboard.tsx`
- `src/pages/Documents.tsx`
- `src/pages/Settings.tsx`
- `src/pages/ResetPassword.tsx`

Each stub shows module name and "Coming soon" text.

---

## Step 6: Admin User Management (Settings)

Build the Settings page with a **User Management** tab:
- List existing users from `profiles` + `user_roles`
- "Create User" form: email, full name, role selection
- Uses Supabase Edge Function `create-user` (since client can't create users with admin API)
- Deactivate/reactivate users

---

## Summary of Files Created/Modified

~25 new files, 3-4 modified files, 1 large database migration, 1 edge function, 3 storage buckets. This gives you a fully navigable app shell with authentication, role-based access, and the complete database ready for Phase 2 module building.

