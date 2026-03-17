

# Build Remaining 9 Stub Pages + Enrich Dashboard

## Status
Completed: Staff, Participants, SIL Houses, Rostering, Incidents, Progress Notes, Settings, Login/Auth.
Remaining stubs: Timesheets, Complaints, Hazards, Risk Register, Restrictive Practices, Quality Improvement, Compliance Dashboard, Documents, Invoicing. Dashboard needs enrichment with real metrics.

## What We'll Build

### 1. Timesheets
- Table from `timesheets` joined to `staff`/`profiles` and `shifts`
- Filter by staff, date range, approval status
- Add timesheet entry: staff, date, start/end time, break minutes, rate type, shift link, notes
- Admin approval workflow: approve/reject with timestamp
- Auto-calculate hours from start/end times

### 2. Complaints
- Table from `complaints` with status badges (received/acknowledged/investigating/resolved/closed)
- Auto-generated reference numbers via `next_reference('COMP')`
- Add complaint: title, description, complainant name/contact, assigned_to
- Detail dialog: acknowledge, record investigation, resolve with details

### 3. Hazards
- Table from `hazards` joined to `sil_houses`
- Filter by status (identified/assessed/controlled/eliminated) and risk level
- Add hazard: description, location, SIL house, risk level, control measures
- Update status workflow with resolve date

### 4. Risk Register
- Table from `risks` with risk matrix (likelihood x consequence = rating)
- Color-coded risk rating badges
- Add risk: title, description, category, likelihood, consequence, existing controls, additional controls, responsible person, review date
- Auto-calculate risk rating (1-25 scale)

### 5. Restrictive Practices
- Table from `restrictive_practices` joined to `participants`
- Filter by practice type (chemical/mechanical/physical/seclusion/environmental)
- Add record: participant, type, date, description, antecedent, duration, outcome, is_authorised, authorised_by

### 6. Quality Improvement
- Table from `quality_improvements`
- Filter by status and source type
- Add QI action: description, source type/id, action required, responsible person, due date
- Track completion

### 7. Compliance Dashboard (admin only)
- Summary cards: total staff, expired compliance count, expiring within 30 days, training gaps
- Staff compliance overview table with red/amber/green indicators
- Aggregated from `staff_compliance` and `staff_training`

### 8. Documents
- Table from `documents` filtered by category (policy/procedure/form/template/training/compliance)
- Add document: title, category, version, review date, notes, file URL
- Category filter tabs

### 9. Invoicing
- Table from `invoices` joined to `participants`, with status badges
- Add invoice: participant, invoice number, issue/due date, notes
- Line items CRUD via `invoice_line_items` (description, NDIS code, quantity, rate, amount)
- Invoice detail dialog with line items and total
- Board & lodging invoices from `board_lodging_invoices`

### 10. Dashboard Enrichment
- Cards: active participants count, active staff count, open incidents, pending timesheets
- Recent incidents list, upcoming compliance expirations, today's shifts
- All data from existing tables via `@tanstack/react-query`

## Technical Approach
- Same patterns as all previous modules
- No schema changes needed -- all tables and enums exist
- Role-based access per sidebar config
- `@tanstack/react-query` for data, mutations invalidate caches

