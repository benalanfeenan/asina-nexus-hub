

# NDIS Audit Evidence App — Gap Analysis & Implementation Plan

This is a large body of work. I've compared every requirement in the document against what's already built. Below is a structured breakdown of what exists, what's partially done, and what's completely missing — organized into implementation phases.

---

## What Already Exists (No Work Needed)

These modules are built and match the document requirements:

| Requirement | Status |
|---|---|
| Incident Register (ref #, date, category, status, outcome) | Built |
| Reportable Incident tracking (is_reportable flag) | Built |
| Restrictive Practice Register | Built |
| Risk Register | Built |
| Hazard Register | Built |
| Complaints Register | Built |
| Quality Improvement Register | Built |
| NDIS Worker Screening Check Register (via staff_compliance) | Built |
| Staff Training Register/Matrix | Built |
| Property Maintenance Log | Built |
| Progress Notes (daily, per participant) | Built |
| Shift Handover Records | Built |
| Sleepover Logs | Built |
| Rosters | Built |
| Timesheets | Built |
| MAR (Medication Administration Records) | Built |
| PRN Medication Records | Built |
| Participant Contacts / Emergency Contacts | Built |
| Participant Goals | Built |
| Participant Daily Routines | Built |
| Support Needs | Built |
| Invoicing | Built |
| Board & Lodging Invoices | Built |
| Compliance Dashboard (staff screening + training) | Built |
| NDIS Price List | Built |

---

## What's Missing — Organized by Phase

### Phase 1: New Registers (Database + CRUD Pages)

These are new data tables and pages that don't exist yet:

1. **Feedback Register** — Compliments, suggestions, informal feedback logged and actioned. Separate from complaints.
   - New table: `feedback` (date, type, source, description, action_taken, status)
   - New page or tab on Complaints page

2. **Conflict of Interest Register** — Declarations with management strategy.
   - New table: `conflict_of_interest` (staff_id, declaration_date, description, management_strategy, status)
   - New page under Compliance section

3. **Legislative Compliance Register** — Applicable legislation with review dates.
   - New table: `legislative_compliance` (legislation_name, description, applicable_to, review_date, status)
   - New page under Compliance section

4. **Insurance Register** — Policies, expiry dates, certificates.
   - New table: `insurance_register` (policy_type, provider, policy_number, start_date, expiry_date, certificate_url, status)
   - New page under System section

5. **Supervision Schedule/Register** — Formal supervision dates per staff member.
   - New table: `staff_supervisions` (staff_id, supervisor_id, date, notes, next_due)
   - New tab on Staff Detail page

6. **House Key Register** — Keys issued, to whom, returned.
   - New table: `house_keys` (sil_house_id, key_number, issued_to, issued_date, returned_date, status)
   - New tab on SIL House Detail page

### Phase 2: New Forms & Records

These are fillable forms that need to be created, typically linked to existing registers:

7. **Incident Investigation Report** — For serious/reportable incidents with findings, corrective actions.
   - Extend incident detail with investigation fields (already partially there: `investigation_findings`, `root_cause`, `corrective_actions`)
   - Add witness statements, post-incident debrief as sub-records

8. **5-Day Follow-Up Report** — For reportable incidents, tracking Commission submissions.
   - New table: `incident_follow_ups` (incident_id, follow_up_date, submitted_to_commission, content, submitted_by)

9. **Witness Statements** — Linked to incidents.
   - New table: `incident_witness_statements` (incident_id, witness_name, statement, date, signed)

10. **Post-Incident Debrief Records**
    - New table: `incident_debriefs` (incident_id, date, attendees, lessons_identified, actions)

11. **ABC Data Sheets** — Behaviour data for BSP reviews.
    - New table: `abc_data_sheets` (participant_id, date, antecedent, behaviour, consequence, staff_id, notes)

12. **Monthly Restrictive Practice Reports** — Evidence of Commission submission.
    - New table: `restrictive_practice_reports` (month, year, submitted_date, submitted_by, report_url, status)

13. **Complaint Outcome Letters** — Resolution communicated to complainant.
    - Add `outcome_letter_url` and `outcome_letter_date` fields to complaints table

14. **Medication Error Report**
    - New table: `medication_errors` (participant_id, medication_id, date, error_type, description, actions_taken, reported_by)

15. **Medication Audit Checklist**
    - New table: `medication_audits` (sil_house_id, date, auditor_id, findings, actions, status)

16. **Fire Evacuation Drill Records** — 6-monthly per house.
    - New table: `fire_drills` (sil_house_id, date, participants_count, staff_present, evacuation_time, issues, actions, next_due)

17. **Fire Equipment / Smoke Alarm Test Logs**
    - New table: `fire_equipment_tests` (sil_house_id, date, equipment_type, result, actions, tested_by)

18. **Workplace Inspection Checklists** — Quarterly per house.
    - New table: `workplace_inspections` (sil_house_id, date, inspector_id, findings, actions, status)

19. **Daily House Log** — General household record.
    - New table: `daily_house_logs` (sil_house_id, date, content, staff_id)

20. **Staff Supervision Record & Performance Review**
    - Covered by supervision register in Phase 1, add `type` field (supervision vs performance_review)

21. **Competency Assessments** (medication, mealtime, high intensity, BSP)
    - New table: `staff_competency_assessments` (staff_id, competency_type, date, assessor, result, next_due)

22. **Staff Induction Checklist, Code of Conduct, Confidentiality Agreement**
    - New table: `staff_acknowledgements` (staff_id, document_type, signed_date, document_url)

23. **Vehicle Pre-Trip Inspection**
    - New table: `vehicle_inspections` (vehicle_id, date, inspector_id, checklist, issues, status)

24. **Visitor Sign-In Sheets**
    - New table: `visitor_log` (sil_house_id, date, visitor_name, purpose, time_in, time_out)

25. **Hazardous Substances Register**
    - New table: `hazardous_substances` (sil_house_id, substance_name, location, sds_url, risk_level)

26. **Cleaning Schedules**
    - New table: `cleaning_schedules` (sil_house_id, task, frequency, last_completed, completed_by)

### Phase 3: Participant File Documents

27. **Participant Document Storage** — Service agreements, consent forms, support plans, BSPs, health care plans, mealtime plans, intake forms, compatibility assessments, PEPs, board & lodging agreements, "About Me" profiles.
    - New table: `participant_documents` (participant_id, document_type, title, file_url, uploaded_date, expiry_date, version, status)
    - Requires a Supabase storage bucket for file uploads
    - New tab on Participant Detail page

28. **Staff Document Storage** — Employment contracts, position descriptions, clearances, qualifications, certificates, signed acknowledgements.
    - New table: `staff_documents` (staff_id, document_type, title, file_url, uploaded_date, expiry_date)
    - New tab on Staff Detail page

### Phase 4: Meetings & Consultation

29. **Management Meeting Minutes**
    - New table: `meeting_minutes` (meeting_type, date, attendees, agenda, minutes, actions, created_by)
    - New page under Compliance or Governance section

30. **House Meeting Minutes** — Participant voice in their home.
    - Same table with `meeting_type = 'house_meeting'` and `sil_house_id`

31. **Participant Feedback Surveys** — With evidence responses were actioned.
    - New table: `participant_surveys` (participant_id, date, survey_type, responses, actions_taken, actioned_by)

32. **Emergency Management Plan** — Per house, current.
    - Could be a document type stored in SIL house documents, or a dedicated structured record

### Phase 5: Dashboards & Reports

33. **Incident Trend Dashboard** — Charts by category, severity, month, house.
    - New dashboard page with charts (use recharts, already likely available)

34. **Restrictive Practice Trend Report** — Monthly data showing reduction over time.
    - New report view

35. **Training Compliance Report** — % current for each mandatory training item.
    - Enhance existing Compliance Dashboard

36. **Quality Improvement Tracking** — Open actions, overdue items, completion rates.
    - Enhance existing QI page with summary cards

37. **Monthly/Quarterly Summary Report** — Exportable for management review.
    - New report page with PDF/CSV export

### Phase 6: Automated Alerts

38. **Proactive compliance alerts** — all of the following:
    - WSC expiring within 60 days
    - First aid/CPR expiring within 30 days
    - Mandatory training overdue
    - Policy/document due for review
    - Incident 5-day follow-up due
    - Restrictive practice monthly report due
    - Support plan review due
    - Risk register quarterly review due
    - Fire drill overdue (6-monthly)
    - Complaint not acknowledged within 2 business days
    - Complaint not resolved within 20 business days
    - QI action overdue

    Implementation: A notification/alerts system that checks dates and surfaces warnings on the Dashboard and via in-app alerts. Could use an edge function on a cron schedule to generate alerts into an `alerts` table.

---

## Sidebar Navigation Updates

New nav items will be needed for:
- Feedback (or merge into Complaints page as a tab)
- Governance section (Conflict of Interest, Legislative Compliance, Insurance, Meeting Minutes)
- Fire Safety (Drills, Equipment Tests, Emergency Plans)
- Reports section (Incident Trends, RP Trends, Training Compliance, Monthly Summary)

---

## Recommended Implementation Order

Given the document's priority ratings:

1. **Phase 1 + 2 (CRITICAL items first):** Incident follow-ups, witness statements, debriefs, ABC data sheets, monthly RP reports, fire drills, emergency plans, participant & staff document storage
2. **Phase 1 + 2 (HIGH items):** Feedback register, supervision register, conflict of interest, legislative compliance, workplace inspections, house logs, meeting minutes, medication audits
3. **Phase 3:** Participant and staff file document management with storage bucket
4. **Phase 4:** Meetings, surveys, consultation records
5. **Phase 5:** Dashboards and trend reports with charts
6. **Phase 6:** Automated alerts system

---

## Technical Notes

- Approximately 20-25 new database tables needed
- A Supabase storage bucket is required for document/file uploads
- Each new table needs RLS policies following the existing pattern (admin full access, authenticated read, house_manager manage where relevant)
- Chart library (recharts) for trend dashboards
- Export functionality (CSV/PDF) for reports
- This is a very large scope — each phase above represents multiple implementation sessions

This is too large to implement in one go. I'd recommend we tackle it phase by phase, starting with the CRITICAL-priority items. Which phase would you like to start with?

