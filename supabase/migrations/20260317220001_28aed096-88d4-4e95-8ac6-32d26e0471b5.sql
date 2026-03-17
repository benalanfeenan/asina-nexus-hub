
-- Priority 1: Exit/Transition Planning
CREATE TABLE public.participant_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  transition_type text NOT NULL DEFAULT 'exit',
  reason text,
  exit_date date,
  destination_provider text,
  handover_summary text,
  exit_interview_completed boolean NOT NULL DEFAULT false,
  exit_interview_notes text,
  documents_transferred boolean NOT NULL DEFAULT false,
  final_progress_note_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.participant_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage participant_transitions" ON public.participant_transitions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage participant_transitions" ON public.participant_transitions FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view participant_transitions" ON public.participant_transitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert participant_transitions" ON public.participant_transitions FOR INSERT TO authenticated WITH CHECK (true);

-- Priority 2: Reportable Incident Commission Reports
CREATE TABLE public.incident_commission_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  report_type text NOT NULL DEFAULT '24hr_notification',
  submitted_at timestamptz,
  submitted_by uuid,
  commission_reference text,
  acknowledgement_received boolean NOT NULL DEFAULT false,
  acknowledgement_date date,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incident_commission_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage incident_commission_reports" ON public.incident_commission_reports FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view incident_commission_reports" ON public.incident_commission_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert incident_commission_reports" ON public.incident_commission_reports FOR INSERT TO authenticated WITH CHECK (true);

-- Priority 3: Internal Audit Register
CREATE TABLE public.internal_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_date date NOT NULL DEFAULT CURRENT_DATE,
  practice_standard text NOT NULL,
  auditor_id uuid,
  findings text,
  non_conformances text,
  corrective_actions text,
  status text NOT NULL DEFAULT 'scheduled',
  next_audit_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage internal_audits" ON public.internal_audits FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage internal_audits" ON public.internal_audits FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view internal_audits" ON public.internal_audits FOR SELECT TO authenticated USING (true);

-- Priority 5: Safeguarding Register
CREATE TABLE public.safeguarding_concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL DEFAULT next_reference('safeguard'),
  participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL,
  concern_type text NOT NULL DEFAULT 'other',
  date_identified date NOT NULL DEFAULT CURRENT_DATE,
  reported_by uuid,
  mandatory_report_made boolean NOT NULL DEFAULT false,
  authority_reported_to text,
  report_date date,
  investigation_status text NOT NULL DEFAULT 'open',
  outcome text,
  actions_taken text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.safeguarding_concerns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage safeguarding_concerns" ON public.safeguarding_concerns FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "HM can manage safeguarding_concerns" ON public.safeguarding_concerns FOR ALL USING (has_role(auth.uid(), 'house_manager'));
CREATE POLICY "Authenticated can view safeguarding_concerns" ON public.safeguarding_concerns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert safeguarding_concerns" ON public.safeguarding_concerns FOR INSERT TO authenticated WITH CHECK (true);
