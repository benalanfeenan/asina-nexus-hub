

# Implementation Plan: Remaining NDIS Audit Phases

This covers everything not yet built from the original plan. Given the scope, I'll break it into implementable batches.

---

## Batch A: New Database Tables (Single Migration)

Create all remaining tables in one migration:

- `conflict_of_interest` (staff_id, declaration_date, description, management_strategy, status)
- `legislative_compliance` (legislation_name, description, applicable_to, review_date, status)
- `insurance_register` (policy_type, provider, policy_number, start_date, expiry_date, certificate_url, status)
- `staff_supervisions` (staff_id, supervisor_id, date, type [supervision/performance_review], notes, next_due)
- `house_keys` (sil_house_id, key_number, issued_to, issued_date, returned_date, status)
- `staff_competency_assessments` (staff_id, competency_type, date, assessor, result, next_due)
- `staff_acknowledgements` (staff_id, document_type, signed_date, document_url)
- `vehicle_inspections` (vehicle_id, date, inspector_id, checklist jsonb, issues, status)
- `visitor_log` (sil_house_id, date, visitor_name, purpose, time_in, time_out)
- `hazardous_substances` (sil_house_id, substance_name, location, sds_url, risk_level)
- `cleaning_schedules` (sil_house_id, task, frequency, last_completed, completed_by)
- `participant_documents` (participant_id, document_type, title, file_url, uploaded_date, expiry_date, version, status)
- `staff_documents` (staff_id, document_type, title, file_url, uploaded_date, expiry_date)
- `meeting_minutes` (meeting_type, sil_house_id nullable, date, attendees, agenda, minutes, actions, created_by)
- `participant_surveys` (participant_id, date, survey_type, responses jsonb, actions_taken, actioned_by)
- `alerts` (type, entity_type, entity_id, message, due_date, is_read, created_at)

Plus a Supabase storage bucket `documents` for file uploads. All tables get standard RLS (admin ALL, authenticated SELECT+INSERT, house_manager ALL where relevant).

---

## Batch B: New Pages & Routes

### Governance Section (new sidebar group)
1. **Conflict of Interest** — `/conflict-of-interest` — CRUD table page
2. **Legislative Compliance** — `/legislative-compliance` — CRUD table page
3. **Insurance Register** — `/insurance` — CRUD table with expiry tracking
4. **Meeting Minutes** — `/meetings` — CRUD page with type filter (management/house)

### Safety Section (extend existing)
5. **Workplace Inspections** tab on SIL House Detail page
6. **Visitor Log** tab on SIL House Detail page
7. **Hazardous Substances** tab on SIL House Detail page
8. **Cleaning Schedules** tab on SIL House Detail page

### Staff Detail Enhancements
9. **Supervisions** tab — list/add supervisions and performance reviews
10. **Competency Assessments** tab
11. **Acknowledgements** tab (induction, code of conduct, confidentiality)
12. **Documents** tab — file upload/download using storage bucket

### Participant Detail Enhancements
13. **Documents** tab — file upload/download (service agreements, BSPs, consent forms, etc.)

### Reports Section (new sidebar group)
14. **Incident Trends** — `/reports/incidents` — recharts bar/line charts by category, severity, month
15. **RP Trends** — `/reports/restrictive-practices` — monthly trend showing reduction
16. **Training Compliance Report** — enhance existing Compliance Dashboard with % completion metrics
17. **Monthly Summary** — `/reports/summary` — exportable overview with CSV download

---

## Batch C: Dashboard Alerts Widget

- Query `alerts` table + compute real-time alerts from:
  - `staff_compliance` expiring within 60 days
  - `staff_training` overdue
  - `complaints` not acknowledged in 2 days / not resolved in 20 days
  - `fire_drills` overdue (6-monthly)
  - `incident_follow_ups` 5-day deadline
  - `restrictive_practice_reports` monthly submission due
  - QI actions overdue
- Add alerts card to Dashboard page
- Optional: edge function on cron to populate `alerts` table

---

## Sidebar Navigation Updates

```text
Main:        Dashboard
People:      Participants, Staff
Operations:  SIL Houses, Rostering, Timesheets, Progress Notes, Invoicing
Compliance:  Incidents, Complaints, Feedback, Risk Register, Hazards,
             Fire Safety, Restrictive Practices, Quality Improvement,
             Compliance Dashboard
Governance:  Conflict of Interest, Legislative Compliance, Insurance,
             Meeting Minutes
Reports:     Incident Trends, RP Trends, Monthly Summary
System:      Documents, NDIS Price List, Settings
```

---

## Implementation Order

Given this is a single approval, I'll implement in this sequence:

1. Database migration (all 16 tables + storage bucket + RLS)
2. Update `types.ts` regeneration
3. New governance pages (4 pages)
4. SIL House Detail new tabs (4 tabs: inspections, visitors, hazardous substances, cleaning)
5. Staff Detail new tabs (4 tabs: supervisions, competencies, acknowledgements, documents)
6. Participant Detail documents tab
7. Reports pages (3 pages with recharts)
8. Dashboard alerts widget
9. Sidebar + routing updates

This is a large implementation. I'll tackle it methodically, creating all database tables first, then building out the UI pages and components.

