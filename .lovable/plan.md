

# Participant Communication Log

Record all communications with/about a participant -- calls, emails, meetings with support coordinators, allied health, families. Critical audit evidence of person-centred practice and stakeholder engagement.

## Database

New `participant_communications` table:
- `id` (uuid, PK)
- `participant_id` (uuid, NOT NULL)
- `date` (timestamptz, default now())
- `type` (text -- phone_call / email / meeting / letter / other)
- `direction` (text -- inbound / outbound)
- `contact_name` (text) -- who was communicated with
- `contact_role` (text) -- e.g. "Support Coordinator", "Family Member", "Allied Health"
- `subject` (text, NOT NULL)
- `summary` (text, NOT NULL)
- `follow_up_required` (boolean, default false)
- `follow_up_date` (date, nullable)
- `follow_up_completed` (boolean, default false)
- `document_url` (text, nullable) -- attached file
- `created_by` (uuid, nullable)
- `created_at` (timestamptz, default now())

RLS: authenticated can select and insert; admin/HM can manage all.

## UI

### New tab: "Communications" on `ParticipantDetail.tsx`
- Table showing date, type, direction, contact, subject, follow-up status
- "Add Communication" dialog with all fields + file upload (same Supabase storage pattern as Transitions/Surveys)
- Badge on follow-up rows that are overdue
- Filter by type (phone/email/meeting/all)

### Dashboard integration
- Add a count of overdue follow-ups to the AlertsWidget on the Dashboard

## Files affected

| Change | File |
|--------|------|
| Migration | New SQL migration |
| New component | `src/components/participants/ParticipantCommunicationsTab.tsx` |
| Tab addition | `src/pages/ParticipantDetail.tsx` |
| Types | `src/integrations/supabase/types.ts` (auto-updated) |

