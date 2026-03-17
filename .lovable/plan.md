

# NDIS Audit Gap — Recommended Additions

## Priority 1: Exit / Transition Planning (participant module)

### Database
New `participant_transitions` table:
- `id`, `participant_id`, `transition_type` (exit/transfer/plan_review), `reason`, `exit_date`, `destination_provider`, `handover_summary`, `exit_interview_completed` (bool), `exit_interview_notes`, `documents_transferred` (bool), `final_progress_note_id`, `created_by`, `created_at`

### Participant compliance additions
Add to `participant-compliance-definitions.ts` under Ongoing Review:
- **Exit/Transition Plan on File** (mandatory, no expiry)

### UI
- New tab on ParticipantDetail: "Transitions"
- Simple table + add dialog for recording transitions

---

## Priority 2: Reportable Incident Workflow

### Database
New `incident_commission_reports` table:
- `id`, `incident_id`, `report_type` (24hr_notification / 5day_report / final), `submitted_at`, `submitted_by`, `commission_reference`, `acknowledgement_received` (bool), `acknowledgement_date`, `document_url`

### UI
- New sub-tab in IncidentDetailDialog for reportable incidents showing the 24hr → 5-day → final submission timeline with status dots

---

## Priority 3: Internal Audit Register

### Database
New `internal_audits` table:
- `id`, `audit_date`, `practice_standard` (text — e.g. "Rights", "Governance", "Provision of Supports"), `auditor_id`, `findings`, `non_conformances`, `corrective_actions`, `status` (scheduled/in_progress/completed), `next_audit_date`, `created_at`

### UI
- New page under Governance: "Internal Audits"
- Table with add/view dialogs, status tracking

---

## Priority 4: Participant Satisfaction Surveys

### Database
New `satisfaction_surveys` table:
- `id`, `participant_id`, `survey_date`, `overall_rating` (1-5), `feel_safe` (1-5), `staff_respectful` (1-5), `choice_and_control` (1-5), `comments`, `conducted_by`, `created_at`

### UI
- New tab on ParticipantDetail: "Surveys"
- Dashboard widget showing average satisfaction scores + trends

---

## Priority 5: Safeguarding Register

### Database
New `safeguarding_concerns` table:
- `id`, `reference_number`, `participant_id`, `concern_type` (abuse/neglect/exploitation/other), `date_identified`, `reported_by`, `mandatory_report_made` (bool), `authority_reported_to`, `report_date`, `investigation_status`, `outcome`, `actions_taken`, `created_at`

### UI
- New page under Compliance: "Safeguarding"
- Table with filters by status and type

---

## Files affected

| Change | Files |
|--------|-------|
| Exit/Transition | New migration, new `ParticipantTransitionsTab.tsx`, update `ParticipantDetail.tsx`, update `participant-compliance-definitions.ts` |
| Commission Reports | New migration, update `IncidentDetailDialog.tsx` + new sub-component |
| Internal Audits | New migration, new page `InternalAudits.tsx`, update `AppSidebar.tsx` + `App.tsx` |
| Satisfaction Surveys | New migration, new `ParticipantSurveysTab.tsx`, update `ParticipantDetail.tsx` |
| Safeguarding | New migration, new page `Safeguarding.tsx`, update `AppSidebar.tsx` + `App.tsx` |

All five changes are independent and can be implemented in any order. Priority 1 and 2 are the most likely to be flagged in an audit.

